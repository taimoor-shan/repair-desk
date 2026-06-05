
---

# Repair Desk — Implementation Plan v4.0
**Handover document for developer**

---

## Project State

V1 is complete and working: offline-first React + Vite + Tailwind + Dexie.js app with customers, repairs, sales, inventory, receipts, WhatsApp sharing, and notification bell. The adapter pattern is in place — `adapter.dexie.js` and `adapter.supabase.js` both export identical function signatures, pages import only from `src/lib/api/index.js`.

This plan adds four feature sets on top of that working base. No existing functionality is removed. No existing files are deleted unless explicitly stated.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS v3 |
| Local DB | Dexie.js (IndexedDB) |
| Cloud DB | Supabase PostgreSQL (optional, via adapter switch) |
| Charts | recharts (new dependency — not yet installed) |
| Hosting | Vercel |
| Print | `window.print()` + `@media print` CSS |
| WhatsApp | `wa.me` URL links |

---

## Architecture Rules (do not break these)

1. Every new DB table gets CRUD functions in **both** `adapter.dexie.js` and `adapter.supabase.js` with identical signatures.
2. Every new function is exported via `src/lib/api/index.js`. Pages never import from adapters directly.
3. Supabase adapter always normalises column names: snake_case from DB → camelCase in JS (mappers pattern already established).
4. Supabase adapter always throws normalised errors: `if (error) throw new Error(error.message)` — `{ data, error }` never leaks into component code.
5. Dexie schema changes always bump the version number. Existing tables are carried forward in the new version block.
6. No component imports directly from `db/` or adapter files.

---

## Complete New Schema

Run all of this in order. For Dexie, bump to version 3 in `adapter.dexie.js`. For Supabase, run in the SQL editor.

### Dexie v3

```js
db.version(3).stores({
  // existing tables — carry forward unchanged
  customers:   '++id, &phone, name',
  products:    '++id, name, category, stock',
  repairJobs:  '++id, customerId, deviceId, status, receivedAt',
  sales:       '++id, customerId, saleType, createdAt',
  settings:    'id',

  // new tables
  devices:       '++id, customerId, imei',
  repairParts:   '++id, repairJobId, productId',
  expenses:      '++id, date, category',
  stockPurchases:'++id, productId, date',
});
```

### Supabase SQL

```sql
-- ─── DEVICES ────────────────────────────────────────────────
create table devices (
  id          bigserial primary key,
  customer_id bigint references customers(id) on delete set null,
  brand       text not null,
  model       text not null,
  imei        text,
  color       text,
  notes       text,
  created_at  timestamptz default now()
);

-- IMEI unique only when present
create unique index devices_imei_unique
  on devices(imei)
  where imei is not null and imei != '';

alter table repair_jobs
  add column device_id bigint references devices(id);

-- ─── REPAIR PARTS ────────────────────────────────────────────
create table repair_parts (
  id            bigserial primary key,
  repair_job_id bigint references repair_jobs(id) on delete cascade,
  product_id    bigint references products(id) on delete set null,
  product_name  text not null,
  cost_price    numeric(10,2) not null,   -- snapshot at time of repair
  selling_price numeric(10,2),            -- snapshot at time of repair
  quantity      integer not null default 1
);

-- ─── EXPENSES ────────────────────────────────────────────────
create table expenses (
  id         bigserial primary key,
  category   text not null
             check (category in
               ('Rent','Utilities','Tools','Salary','Stock Purchase','Other')),
  amount     numeric(10,2) not null,
  note       text,
  date       date not null default current_date,
  created_at timestamptz default now()
);

-- ─── STOCK PURCHASES ─────────────────────────────────────────
create table stock_purchases (
  id           bigserial primary key,
  product_id   bigint references products(id) on delete set null,
  product_name text not null,    -- snapshot
  quantity     integer not null,
  unit_cost    numeric(10,2) not null,
  total_cost   numeric(10,2) not null,
  supplier     text,
  note         text,
  date         date not null default current_date,
  created_at   timestamptz default now()
);

-- ─── RLS (if Supabase mode) ──────────────────────────────────
alter table devices enable row level security;
alter table repair_parts enable row level security;
alter table expenses enable row level security;
alter table stock_purchases enable row level security;

create policy "Authenticated access" on devices
  for all using (auth.role() = 'authenticated');
create policy "Authenticated access" on repair_parts
  for all using (auth.role() = 'authenticated');
create policy "Authenticated access" on expenses
  for all using (auth.role() = 'authenticated');
create policy "Authenticated access" on stock_purchases
  for all using (auth.role() = 'authenticated');
```

---

## Money Model (reference for all analytics work)

```
REVENUE
  Sales Revenue       = sum(sales.total_amount)
  Repair Revenue      = sum(repair_jobs.final_cost) — Delivered status only

COST OF GOODS SOLD (COGS)
  Sales COGS          = sum(sale.items[].unitCost × quantity)
  Repair Parts COGS   = sum(repair_parts.cost_price × quantity)

GROSS PROFIT          = Total Revenue − Total COGS

OPERATING EXPENSES    = sum(expenses.amount)

NET PROFIT            = Gross Profit − Operating Expenses

STOCK CASH FLOW       = sum(stock_purchases.total_cost)
  — shown separately, not subtracted from profit
  — cash awareness only, not a P&L line
```

These five buckets must always be shown separately in the UI. Never merge them.

---

## Feature Set 1 — Device History + Repeat Detection

### Goal
When a customer arrives, the owner immediately sees which devices they have brought before, full repair history per device, and a warning if a device IMEI was previously seen under a different customer.

### New adapter functions (both adapters)

```
getDevicesByCustomer(customerId)       → Device[]
getDeviceByIMEI(imei)                  → Device | null
addDevice(device)                      → Device
updateDevice(id, data)                 → Device
```

### New component: `DevicePicker.jsx`

Props: `customerId`, `onDeviceSelect(device | null)`, `selectedDevice`

Behaviour:
- Loads devices for `customerId` on mount and when `customerId` changes
- Dropdown shows existing devices labelled as "Samsung A52 — 35xxxxxxx" or "iPhone 13 — No IMEI"
- Last option always: "＋ New device"
- Selecting existing device: calls `onDeviceSelect(device)`, pre-fills brand/model/IMEI/color in RepairForm
- Shows yellow info banner below picker: *"This device has been repaired N time(s). Last visit: [date] — [problem]"* with link to CustomerDetail
- Selecting "New device": calls `onDeviceSelect(null)`, clears pre-filled fields
- Resets when `customerId` changes

### Modified: `RepairForm.jsx`

**New fields and behaviour:**

After `CustomerPicker`:
- Render `DevicePicker` (only when a customer is selected)

IMEI field on-blur handler:
- If IMEI has a value: call `getDeviceByIMEI(imei)`
- If found and `device.customerId === current customerId`: auto-select in DevicePicker
- If found and `device.customerId !== current customerId`: show red warning banner — *"This IMEI is registered under [Customer Name]. View record."* — no auto-fill
- If not found: do nothing

Parts Used section (below repair notes):
```
Parts Used (optional)
┌──────────────────────────┬─────┬───────────┬──────────┬────────┐
│ Part (search)            │ Qty │ Unit Cost │ Subtotal │        │
├──────────────────────────┼─────┼───────────┼──────────┼────────┤
│ [Samsung A52 Screen    ] │  1  │ PKR 800   │ PKR 800  │ Remove │
└──────────────────────────┴─────┴───────────┴──────────┴────────┘
[ + Add Part ]                        Parts Total: PKR 800
```

- Product search filters to `category = 'RepairPart'` only
- Dropdown shows `name` + `(Stock: N)` — out of stock shown greyed with warning, not blocked
- `unit_cost` auto-fills from `products.cost_price`, field is editable
- Parts total updates live

Cost summary below parts section:
```
Parts Cost:     PKR 800   (auto — from parts list)
Labor / Other:  [      ]  (manual input, labelled clearly)
────────────────────────
Estimated Total: PKR 800  (updates live: parts + labor)
```

`estimatedCost` stored in DB = parts total + labor. Both parts and labor are displayed separately in RepairDetail for reference.

**Save transaction (order is critical):**

```
1. Validate: each part quantity ≤ current stock
   → if any fail: show inline error on that row, block save

2. Upsert device:
   → if existing device selected: use its id
   → if new device: insert into devices, get new id

3. Insert repair_job with deviceId + estimatedCost

4. For each part in parts list:
   → insert repair_parts row with snapshots:
      { repairJobId, productId, product_name, cost_price, selling_price, quantity }
   → decrement products.stock by quantity

5. Show success toast, navigate to RepairDetail
```

For Dexie: wrap steps 3–4 in `db.transaction('rw', [db.repairJobs, db.repairParts, db.products], ...)`.
For Supabase: use a Postgres function `save_repair_with_parts(repair, parts[])` that handles the insert + stock decrement atomically.

### Modified: `RepairDetail.jsx`

Add a **Parts Used** card:
```
Parts Used
─────────────────────────────────────────
Samsung A52 Screen    × 1    PKR 800
Adhesive Strip        × 2    PKR 300
─────────────────────────────────────────
Parts Cost:                  PKR 1,100
```

Show only if `repairParts.length > 0`. Read-only — parts are not editable after save (stock has already been decremented).

### Modified: `CustomerDetail.jsx`

Add **Devices** section between customer info and repair history:

```
Devices (2)
┌─────────────────┬───────────────┬──────────┬──────────┐
│ Brand / Model   │ IMEI          │ Repairs  │          │
├─────────────────┼───────────────┼──────────┼──────────┤
│ Samsung A52     │ 35xxxxxxxxx   │ 3        │ View     │
│ iPhone 13       │ —             │ 1        │ View     │
└─────────────────┴───────────────┴──────────┴──────────┘
```

"View" scrolls to repair history table filtered to that device.

---

## Feature Set 2 — Sales COGS Capture

### Goal
Every sale records the cost of goods at the moment of sale so gross profit is calculable.

### Modified: `SaleForm.jsx` — save logic only

When building the `items` array on submit, add `unitCost`:

```js
// current shape
{ productId, productName, quantity, unitPrice }

// new shape
{ productId, productName, quantity, unitPrice, unitCost }
// unitCost = products.cost_price at time of save — snapshot it
```

One line change. Existing sale records without `unitCost` default to `0` in analytics — no crash, incomplete historical data only (acceptable since we are in development).

---

## Feature Set 3 — Stock Purchase Log

### Goal
Replace manual stock adjustment for incoming stock with a recorded purchase that tracks cash outflow and auto-increments stock.

### New adapter functions (both adapters)

```
getStockPurchases(rangeStart?, rangeEnd?)  → StockPurchase[]
addStockPurchase(purchase)                 → also increments products.stock
deleteStockPurchase(id)                    → also decrements products.stock
```

No `updateStockPurchase` — purchases are immutable once logged. Delete and re-enter if a mistake was made.

### Modified: `ProductList.jsx`

Split the existing stock adjustment modal into two separate actions per product row:

**Restock button** — for incoming stock from a supplier:
Opens a form: Date / Supplier (free text, optional) / Quantity / Unit Cost (pre-fills from `products.cost_price`, editable) / Note. On save: creates `stock_purchases` row, increments `products.stock`.

**Adjust button** — for corrections only (damaged, miscounted):
Keeps existing `+/−` modal. Adds a required Reason field: `Damaged | Stock Count | Other`. No purchase record created.

### New page: `src/pages/inventory/Purchases.jsx`

Route: `/inventory/purchases`
Accessible via a tab or sub-nav inside the Inventory section.

```
Stock Purchases                        [ + New Purchase ]

Date        Product           Supplier    Qty   Unit Cost   Total
──────────────────────────────────────────────────────────────────
2026-06-01  Samsung A52 Screen Ali Parts  10    PKR 800     PKR 8,000
2026-05-28  iPhone Battery     —           5    PKR 1,200   PKR 6,000
                                                      [ Delete ]
```

"+ New Purchase" opens the same restock form as the Restock button in ProductList. Consistent entry point regardless of where the owner starts.

---

## Feature Set 4 — Receipt Changes

### Goal
Remove payment method from all printed receipts. Add parts list to final repair receipt. Estimated cost stays on all receipts.

### Modified: `PrintReceipt.jsx`

| Field | Initial repair receipt | Final repair receipt | Sale receipt |
|---|---|---|---|
| Estimated cost | ✅ Keep | ✅ Keep | — |
| Payment method | ❌ Remove | ❌ Remove | ❌ Remove |
| Parts used list | ❌ Not shown | ✅ Add | — |

Parts list on final receipt format:
```
Parts Used:
  Samsung A52 Screen  x1   PKR 800
  Adhesive Strip      x2   PKR 300
  Parts Total:             PKR 1,100
```

Only shown when `repairParts.length > 0`.

### Modified: `whatsapp.js`

Apply same rules to `formatRepairReceiptText` and `formatSaleReceiptText`:
- Remove payment method from both
- Add parts list to repair final receipt text

---

## Feature Set 5 — Analytics Dashboard

### New page: `src/pages/Analytics.jsx`
### Route: `/analytics`
### New dependency: `recharts`

### Date range controls
Four options: **Today / This Week / This Month / Custom** (date pickers for custom range). All cards and charts respond to the selected range simultaneously.

### Stat cards (top row)

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Revenue│  Total COGS  │ Gross Profit │  Net Profit  │
│ PKR 1,20,000 │ PKR 65,000   │ PKR 55,000   │ PKR 32,000   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

Below cards, two breakdowns side by side:
```
Revenue Breakdown          COGS Breakdown
  Sales:   PKR 80,000        Sales COGS:    PKR 45,000
  Repairs: PKR 40,000        Repair Parts:  PKR 20,000

Operating Expenses: PKR 23,000

Stock Cash Outflow: PKR 35,000  ← separate box, labelled "not included in P&L"
```

### Charts section

**Bar chart** — Revenue vs COGS vs Expenses, daily breakdown within selected range. Three bars per day, colour coded.

**Line chart** — Monthly trend, last 6 months regardless of range filter. Three lines: Revenue / COGS / Expenses.

**Pie chart** — Operating expenses by category for selected range.

### Stats section

```
Repair Stats
  Top 5 problems by count
  Average final cost (Delivered repairs)
  Average turnaround time (delivered_at − received_at, in hours)

Sales Stats
  Top 5 products sold by quantity (from sales.items JSON)
  Revenue split: Sales vs Repairs
```

### Expense log section (bottom of page)

```
Operating Expenses              [ + Add Expense ]

Date        Category     Note              Amount
────────────────────────────────────────────────────
2026-06-01  Rent         June rent         PKR 25,000
2026-06-03  Utilities    Electricity       PKR 3,200
                                  [ Edit ]  [ Delete ]
```

Add/Edit via inline modal (reuse `ConfirmContext` pattern).
Categories: Rent / Utilities / Tools / Salary / Other.
`Stock Purchase` category removed here — stock purchases have their own dedicated module.

### `getAnalyticsData(rangeStart, rangeEnd)` return shape

Both adapters must return this exact shape:

```js
{
  revenue: {
    sales: 0,
    repairs: 0,
    total: 0,
  },
  cogs: {
    sales: 0,        // from sales.items[].unitCost × quantity
    repairs: 0,      // from repair_parts.cost_price × quantity
    total: 0,
  },
  grossProfit: 0,    // revenue.total − cogs.total
  expenses: {
    total: 0,
    byCategory: {},  // { Rent: 0, Utilities: 0, ... }
    log: [],         // raw expense rows for the log table
  },
  netProfit: 0,      // grossProfit − expenses.total
  stockCashFlow: 0,  // sum(stock_purchases.total_cost) for range
  charts: {
    daily: [],       // [{ date, revenue, cogs, expenses }]
    monthly: [],     // [{ month, revenue, cogs, expenses }] — last 6 months
  },
  repairStats: {
    topProblems: [], // [{ problem, count }] top 5
    avgFinalCost: 0,
    avgTurnaroundHours: 0,
  },
  salesStats: {
    topProducts: [], // [{ name, qty, revenue }] top 5
  },
}
```

Dexie computes everything in JavaScript. Supabase uses multiple focused queries then aggregates in JavaScript — do not write complex SQL for this, data volume is small.

---

## Complete File Change List

| File | Status | Change |
|---|---|---|
| `adapter.dexie.js` | Modify | Bump to v3, add all new table definitions + CRUD for devices, repairParts, expenses, stockPurchases, getAnalyticsData |
| `adapter.supabase.js` | Modify | Add camelCase mappers + CRUD for all new tables, Postgres function for repair save transaction, getAnalyticsData |
| `src/lib/api/index.js` | Modify | Export all new functions |
| `src/pages/sales/SaleForm.jsx` | Modify | Snapshot unitCost into sale items on submit |
| `src/pages/repairs/RepairForm.jsx` | Modify | Add DevicePicker, RepairPartsPicker, IMEI blur lookup, cost summary, save transaction |
| `src/pages/repairs/RepairDetail.jsx` | Modify | Add Parts Used card |
| `src/pages/customers/CustomerDetail.jsx` | Modify | Add Devices section |
| `src/pages/inventory/ProductList.jsx` | Modify | Split stock adjustment into Restock + Adjust with reason |
| `src/components/PrintReceipt.jsx` | Modify | Remove payment method, add parts list to final repair receipt |
| `src/lib/whatsapp.js` | Modify | Remove payment method, add parts list to repair final text |
| `src/components/Sidebar.jsx` | Modify | Add Analytics nav link |
| `src/App.jsx` | Modify | Add `/analytics` and `/inventory/purchases` routes |
| `src/components/DevicePicker.jsx` | New | Customer-aware device selector |
| `src/components/RepairPartsPicker.jsx` | New | Inventory-linked parts selector with stock display |
| `src/pages/Analytics.jsx` | New | Full P&L dashboard with charts and expense log |
| `src/pages/inventory/Purchases.jsx` | New | Stock purchase log |
| `package.json` | Modify | Add recharts |

---

## Execution Order

| Day | Work | Risk if skipped |
|---|---|---|
| Day 1 | Schema: all 4 new tables, Dexie v3 bump, both adapters fully updated, all new functions exported | Everything else depends on this |
| Day 2 | `SaleForm` unitCost snapshot. `DevicePicker` component. `RepairPartsPicker` component. | Analytics COGS data missing |
| Day 3 | `RepairForm` full integration — DevicePicker, RepairPartsPicker, cost summary, save transaction with stock guard | Core feature incomplete |
| Day 4 | `RepairDetail` parts card. `CustomerDetail` devices section. Receipt changes. WhatsApp changes. | Client-visible regressions |
| Day 5 | `ProductList` restock/adjust split. `Purchases.jsx` stock purchase log. | Stock cash flow data missing from analytics |
| Day 6 | `Analytics.jsx` — stat cards, expense log, expense CRUD | Dashboard incomplete |
| Day 7 | Charts (bar, line, pie). End-to-end verification. `npm run build` clean. | Delivery risk |

---

## Verification Checklist

**Device history**
- [ ] Select customer → DevicePicker shows their existing devices
- [ ] Select existing device → fields pre-fill, banner shows repair count + last visit
- [ ] Type known IMEI from different customer → red warning banner, no auto-fill
- [ ] Save repair → device created or linked, `device_id` on repair job
- [ ] CustomerDetail → Devices section lists all devices with repair counts

**Repair parts**
- [ ] Parts picker shows only `RepairPart` category products
- [ ] Out-of-stock parts show greyed warning, not blocked
- [ ] Adding part auto-fills cost price, field editable
- [ ] Parts total + labor = estimated total, updates live
- [ ] Save repair → `repair_parts` rows created with snapshots
- [ ] Save repair → `products.stock` decremented per part
- [ ] Exceed stock quantity → inline error, save blocked
- [ ] RepairDetail shows parts used list + parts cost subtotal

**Sales COGS**
- [ ] Save sale → `items` array contains `unitCost` for each item
- [ ] Verify in DB that unitCost matches product cost_price at time of sale

**Stock purchases**
- [ ] Restock button in ProductList → purchase form → stock increments + purchase recorded
- [ ] Adjust button → correction only, no purchase record
- [ ] `/inventory/purchases` shows full log
- [ ] Delete purchase → stock decrements

**Receipts**
- [ ] Initial repair receipt: estimated cost present, payment method absent, no parts list
- [ ] Final repair receipt: estimated cost present, payment method absent, parts list present
- [ ] Sale receipt: payment method absent
- [ ] RepairDetail and SaleDetail UI: payment method still visible
- [ ] WhatsApp repair message: same rules as print receipts

**Analytics**
- [ ] Revenue card = sales total + delivered repair finalCosts for range
- [ ] Sales COGS = unitCost × qty from sale items for range
- [ ] Repair COGS = repair_parts cost_price × qty for range
- [ ] Gross profit = revenue − total COGS
- [ ] Net profit = gross profit − operating expenses
- [ ] Stock cash flow shown separately, not in P&L
- [ ] Add / edit / delete expense → all cards update
- [ ] Date range filter updates all cards and bar chart simultaneously
- [ ] Line chart shows last 6 months regardless of range filter
- [ ] Pie chart reflects expense category split for selected range
- [ ] Bar chart: 3 bars per day (revenue / cogs / expenses)
- [ ] Repair stats: top 5 problems, avg cost, avg turnaround
- [ ] Sales stats: top 5 products by qty
- [ ] `npm run build` passes with no errors