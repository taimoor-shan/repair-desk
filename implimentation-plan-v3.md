

# Plan: Three Focused Features

---

## Feature 1 — Device History + Repeat Detection

### What changes

A new `devices` table. Lightweight. No new pages — integrates into existing RepairForm and CustomerDetail.

### Database

```sql
create table devices (
  id          bigserial primary key,
  customer_id bigint references customers(id) on delete set null,
  brand       text not null,
  model       text not null,
  imei        text,          -- recommended, not required
  color       text,
  notes       text,
  created_at  timestamptz default now()
);

-- For Supabase: partial unique index on IMEI (only when IMEI is present)
create unique index devices_imei_unique
  on devices (imei)
  where imei is not null and imei != '';
```

`repair_jobs` gets one new column:

```sql
alter table repair_jobs add column device_id bigint references devices(id);
```

Keep existing `mobile_brand`, `mobile_model`, `imei` columns on `repair_jobs` as snapshots — they remain the source of truth on the receipt. `device_id` is just the link for history lookup.

For Dexie adapter: add a `devices` table to the schema. No unique index support in Dexie — handle IMEI dedup in the adapter function instead.

### New components

**`DevicePicker.jsx`**

Used inside `RepairForm`. Appears after `CustomerPicker` selects a customer.

Behaviour:
- Loads all devices linked to selected customer
- Shows dropdown: list of existing devices + "New device" option at bottom
- Selecting an existing device: pre-fills brand/model/IMEI fields + shows a yellow info banner — *"This device has been repaired [N] time(s). Last visit: [date] — [problem summary]"* with a "View history" link to CustomerDetail
- Selecting "New device": shows empty brand/model/IMEI/color fields
- If customer is changed or cleared: resets device selection

**IMEI lookup on blur (inside RepairForm)**

When IMEI field loses focus (and has a value):
1. Query `devices` by IMEI
2. If found under the same customer → auto-select that device in DevicePicker, show repair history banner
3. If found under a different customer → show a warning banner: *"This IMEI was previously registered under [Other Customer Name]. View record."* — no auto-fill, just the warning
4. If not found → do nothing, field stays as typed

### RepairForm save logic

On submit:
1. If existing device selected → use its `device_id`, update `device.customer_id` if it changed
2. If new device → insert into `devices`, get back the new `id`, use as `device_id`
3. Save `repair_job` with `device_id` + snapshot fields as before

### CustomerDetail changes

Add a **Devices** section between customer info and repair history:

```
Devices (2)
┌─────────────┬───────────┬──────────────────┬────────────┐
│ Brand/Model │ IMEI      │ Repairs          │            │
├─────────────┼───────────┼──────────────────┼────────────┤
│ Samsung A52 │ 35xxxxxxx │ 3 repairs        │ View       │
│ iPhone 13   │ —         │ 1 repair         │ View       │
└─────────────┴───────────┴──────────────────┴────────────┘
```

Clicking "View" scrolls to the repair history table filtered to that device.

### Files changed

| File | Change |
|---|---|
| SQL / Dexie schema | Add `devices` table, `device_id` on `repair_jobs` |
| `adapter.dexie.js` | Add `getDevicesByCustomer`, `getDeviceByIMEI`, `addDevice`, `updateDevice` |
| `adapter.supabase.js` | Same + camelCase mappers |
| `src/lib/api/index.js` | Export new device functions |
| `src/components/DevicePicker.jsx` | NEW |
| `src/pages/repairs/RepairForm.jsx` | Integrate DevicePicker + IMEI blur lookup + history banner |
| `src/pages/customers/CustomerDetail.jsx` | Add Devices section |

---

## Feature 2 — Receipt Print Changes

Two changes to `PrintReceipt.jsx` only. Nothing else touches this.

### What to remove from printed output

| Field | Initial receipt | Final receipt | Kept internally |
|---|---|---|---|
| Estimated cost | Remove | Remove | Yes — shown in RepairDetail UI |
| Payment method | Remove | Remove | Yes — stored in DB, shown in SaleDetail/RepairDetail |

### What stays on receipts

Initial repair receipt: shop info, receipt number, date, customer name + phone, device brand/model/IMEI, problem description, repair notes.

Final repair receipt: everything above + final cost + repair status (Delivered) + delivered date.

Sale receipt: shop info, receipt number, date, customer name, items list, quantities, unit prices, subtotal, discount, **total** — payment method removed from print.

### Implementation

`PrintReceipt.jsx` receives a `type` prop (`'repair_initial'` / `'repair_final'` / `'sale'`) and a `printMode` prop (already renders differently per type). Add two boolean render conditions:

```jsx
{/* Remove these two lines from ALL receipt types */}
{/* estimatedCost — remove entirely from rendered output */}
{/* paymentMethod — remove from rendered output */}
```

No logic changes anywhere else. `RepairDetail` and `SaleDetail` still display both fields in the UI — only the print component changes.

**One additional note:** WhatsApp receipt text is generated in `whatsapp.js` via `formatRepairReceiptText` and `formatSaleReceiptText`. Apply the same removals there — strip estimated cost and payment method from the WhatsApp message text too, since that's effectively the same as printing.

### Files changed

| File | Change |
|---|---|
| `src/components/PrintReceipt.jsx` | Remove estimated cost + payment method from rendered output |
| `src/lib/whatsapp.js` | Remove same fields from receipt text formatters |

---

## Feature 3 — Analytics Dashboard

### Confirming the data model first

Before building, here's what each metric pulls from:

| Metric | Source |
|---|---|
| **Revenue** | `sales.total_amount` (by `created_at`) + `repair_jobs.final_cost` where `status = 'Delivered'` (by `delivered_at`) |
| **Cost of parts** | `repair_parts` joined to `products.cost_price` × quantity — what you actually paid for parts used in repairs |
| **Expenses** | New `expenses` table — shop running costs (rent, electricity, etc.) |
| **Gross profit** | Revenue − cost of parts |
| **Net profit** | Revenue − cost of parts − expenses |

### New table: expenses

```sql
create table expenses (
  id         bigserial primary key,
  category   text not null
             check (category in ('Rent','Utilities','Tools','Salary','Other')),
  amount     numeric(10,2) not null,
  note       text,
  date       date not null default current_date,
  created_at timestamptz default now()
);
```

For Dexie: add `expenses` table with `++id, date, category`.

### New page: `/analytics`

Replaces the current Dashboard stats cards (keep the Dashboard as-is for daily ops — the analytics page is a separate deeper view).

Add `/analytics` to the router and a nav link in the Sidebar.

#### Layout

```
Analytics
[Date range picker: Today | This Week | This Month | Custom]

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Revenue│ Parts Cost   │ Expenses     │  Net Profit  │
│ PKR 84,500   │ PKR 32,000   │ PKR 15,000   │ PKR 37,500   │
│ (sales+repairs)│(repair_parts)│(expenses tbl)│(rev−cost−exp)│
└──────────────┴──────────────┴──────────────┴──────────────┘

Revenue vs Cost vs Expenses          [Bar chart — recharts]
  Daily breakdown within selected range
  3 bars per day: Revenue (blue) | Parts Cost (orange) | Expenses (red)

Monthly Summary                      [Line chart — recharts]
  3 lines: Revenue | Parts Cost | Expenses
  Last 6 months

Expense Breakdown                    [Pie or donut chart]
  By category: Rent / Utilities / Tools / Salary / Other
  Shows % and PKR amount per category

Repair Stats
  Most common problems (top 5 by count)
  Average repair cost (finalCost average)
  Average turnaround time (delivered_at − received_at in hours)

Sales Stats
  Top selling products (top 5 by quantity sold — from sales.items jsonb)
  Revenue by sale type (Mobile vs Accessory)
```

#### Expense management (within Analytics page)

A simple section at the bottom of the analytics page — not a separate page:

```
Expenses  [+ Add Expense]

Date        Category     Note              Amount
────────────────────────────────────────────────
2026-06-01  Rent         June rent         PKR 25,000
2026-06-03  Utilities    Electricity bill  PKR 3,200
                                    [Edit] [Delete]
```

Clicking "+ Add Expense" opens the `ConfirmDialog`-style modal (reuse `ConfirmContext` pattern) with: date, category dropdown, note, amount.

No separate expenses page needed — keeping it contained in Analytics keeps the nav clean.

### Charts library

Use `recharts` — already in your stack. No new dependency needed.

### Files changed

| File | Change |
|---|---|
| SQL / Dexie schema | Add `expenses` table |
| `adapter.dexie.js` | Add `getExpenses`, `addExpense`, `updateExpense`, `deleteExpense`, `getAnalyticsData(range)` |
| `adapter.supabase.js` | Same + mappers |
| `src/lib/api/index.js` | Export new expense + analytics functions |
| `src/pages/Analytics.jsx` | NEW — full analytics page |
| `src/components/Sidebar.jsx` | Add Analytics nav link |
| `src/App.jsx` | Add `/analytics` route |

---

## Execution Order

Do these in sequence — each is independent of the others except that Feature 3 depends on the `repair_parts` data being populated (which is already in your V2 schema).

**Day 1–2:** Feature 2 (receipt changes) — smallest, least risk, client sees immediate result.

**Day 3–5:** Feature 1 (device history) — schema change + new component + RepairForm integration.

**Day 6–9:** Feature 3 (analytics) — new table, new page, charts.

---

## Verification Checklist

**Feature 1**
1. Create repair → select customer → DevicePicker shows their existing devices
2. Select existing device → brand/model/IMEI pre-filled → history banner shows correct count and last visit
3. Type an IMEI that exists on another customer → warning banner appears
4. Save repair → `device_id` stored on repair job
5. CustomerDetail → Devices section shows all devices with repair counts

**Feature 2**
1. Print initial repair receipt → estimated cost absent, payment method absent
2. Print final repair receipt → same
3. Print sale receipt → payment method absent
4. RepairDetail UI still shows estimated cost and payment method
5. SaleDetail UI still shows payment method
6. WhatsApp repair message → no estimated cost, no payment method
7. WhatsApp sale message → no payment method

**Feature 3**
1. Add an expense → appears in list, totals update
2. Edit/delete expense → works correctly
3. Revenue card matches sum of sales + delivered repair finalCosts for selected range
4. Parts cost card matches sum of repair_parts × cost_price for selected range
5. Net profit = revenue − parts cost − expenses
6. Bar chart shows 3 bars per day, correct values
7. Expense breakdown pie reflects actual category split
8. Date range filter changes all charts and cards simultaneously