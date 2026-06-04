Good question on the hosting choice — the client explicitly said "local only, no hosting" in the brief, so Vercel+Supabase was out of scope for V1. For V2 it's the right move.

Before the PRD — one thing to confirm:

**Will the client pay for Supabase if they exceed the free tier?** Free tier gives 500MB DB + 50,000 monthly active users. For a single shop this is fine for years. But you should set this expectation now, not after launch.

---

# Repair Desk — V2 PRD & Roadmap
**Cloud edition | Vercel + Supabase | Multi-device accessible**

---

## What Changes in V2

| Concern | V1 | V2 |
|---|---|---|
| Hosting | Local browser file | Vercel (free) |
| Database | IndexedDB / Dexie.js | Supabase PostgreSQL (free tier) |
| Auth | None (single user) | Supabase Auth — email/password |
| Data access | Direct Dexie calls | Supabase JS client |
| Receipts | Browser print | Browser print (unchanged) |
| WhatsApp | None | whatsapp.web.link share URL |
| Parts consumption | Manual stock adjustment | Auto-deducted on repair save |
| Backup | JSON export/import | Redundant — Supabase handles it |

---
## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite (unchanged) |
| Styling | Tailwind CSS v3 (unchanged) |
| Hosting | Vercel |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (built-in) |
| DB client | `@supabase/supabase-js` |
| Env vars | `.env.local` → Vercel environment variables |

Drop Dexie.js entirely. Replace every `db.*` call with Supabase client queries.

---

## Architecture Changes

### File Structure Delta

```
src/
├── lib/
│   ├── supabase.js        # createClient() — replaces db.js
│   ├── receiptNumber.js   # Now queries Supabase instead of settings table
│   ├── helpers.js         # Unchanged
│   └── whatsapp.js        # NEW: receipt share URL builder
├── context/
│   ├── AuthContext.jsx    # NEW: session + user state
│   ├── ToastContext.jsx   # Unchanged
│   └── ConfirmContext.jsx # Unchanged
├── pages/
│   ├── Login.jsx          # NEW: email/password form
│   └── ...                # All existing pages unchanged in structure
```

`backup.js` is removed — Supabase handles data persistence and has its own backup tooling.

---

## Supabase Database Schema

Mirrors V1 Dexie schema, converted to PostgreSQL tables. Run these in the Supabase SQL editor.

```sql
-- Customers
create table customers (
  id         bigserial primary key,
  name       text not null,
  phone      text not null unique,
  address    text,
  email      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products / Inventory
create table products (
  id                  bigserial primary key,
  name                text not null,
  category            text not null check (category in ('Mobile','Accessory','RepairPart')),
  sku                 text,
  stock               integer not null default 0,
  cost_price          numeric(10,2),
  selling_price       numeric(10,2),
  low_stock_threshold integer not null default 5,
  created_at          timestamptz default now()
);

-- Repair Jobs
create table repair_jobs (
  id                  bigserial primary key,
  customer_id         bigint references customers(id),
  mobile_brand        text,
  mobile_model        text,
  imei                text,
  problem_description text,
  repair_notes        text,
  estimated_cost      numeric(10,2),
  final_cost          numeric(10,2),
  status              text not null default 'Pending'
                        check (status in ('Pending','InProgress','Ready','Delivered')),
  receipt_number      text,
  received_at         timestamptz default now(),
  delivered_at        timestamptz
);

-- Repair Parts Used (NEW — auto-consumption)
create table repair_parts (
  id            bigserial primary key,
  repair_job_id bigint references repair_jobs(id) on delete cascade,
  product_id    bigint references products(id),
  product_name  text not null,   -- snapshot at time of repair
  quantity      integer not null default 1
);

-- Sales
create table sales (
  id             bigserial primary key,
  customer_id    bigint references customers(id),
  sale_type      text not null check (sale_type in ('Mobile','Accessory')),
  items          jsonb not null default '[]',
  total_amount   numeric(10,2),
  discount       numeric(10,2) default 0,
  payment_method text check (payment_method in ('Cash','Card','BankTransfer')),
  receipt_number text,
  created_at     timestamptz default now()
);

-- Settings (singleton)
create table settings (
  id                bigserial primary key,
  shop_name         text,
  shop_phone        text,
  shop_address      text,
  last_repair_seq   integer default 0,
  last_repair_date  date,
  last_sale_seq     integer default 0,
  last_sale_date    date
);

insert into settings (id, shop_name) values (1, 'My Shop')
  on conflict (id) do nothing;
```

### Row Level Security

Enable RLS on all tables. Since this is a single-user app with Supabase Auth, the policy is simple — authenticated user can do everything:

```sql
-- repeat for each table
alter table customers enable row level security;
create policy "Authenticated access"
  on customers for all
  using (auth.role() = 'authenticated');
```

This prevents anyone who gets hold of your Supabase URL from reading the data without logging in.

---

## Authentication

Supabase Auth with email/password. Single account — the shop owner creates it once via Supabase dashboard, no self-registration UI needed.

### AuthContext.jsx

```js
// Wraps the app, exposes: user, session, signIn(), signOut(), loading
// On mount: supabase.auth.getSession()
// Listens: supabase.auth.onAuthStateChange()
```

### Login.jsx

Simple email + password form. On success, redirects to `/`. On failure, shows inline error. No "forgot password" UI needed for V1 single-user — can be reset via Supabase dashboard.

### Route Guard

Wrap all routes in a `<ProtectedRoute>` component. If no session → redirect to `/login`.

```jsx
// App.jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

---

## WhatsApp Receipt Sharing

No API needed. Uses the universal WhatsApp share link:

```
https://wa.me/<phone>?text=<encoded message>
```

### whatsapp.js

```js
export function buildWhatsAppReceiptURL(phone, receiptText) {
  const cleaned = phone.replace(/\D/g, '');
  const pakistanPhone = cleaned.startsWith('0')
    ? '92' + cleaned.slice(1)
    : cleaned;
  return `https://wa.me/${pakistanPhone}?text=${encodeURIComponent(receiptText)}`;
}

export function buildReceiptText(shopInfo, receipt) {
  // Returns a plain-text formatted receipt suitable for WhatsApp
  // Shop name, receipt number, items, total, payment method, date
}
```

### UX Pattern

On `RepairDetail` and `SaleDetail`, next to the Print button:

> **[Print Receipt]   [Share on WhatsApp]**

WhatsApp button opens the link in a new tab. WhatsApp Web opens on desktop, WhatsApp app opens on mobile. No backend, no API key, no cost.

**Caveat for client:** The customer's phone number must be saved with the correct format. Make this clear in the handoff guide.

---

## Repair Parts Auto-Consumption

### Workflow Change

`RepairForm` gets a new section: **Parts Used**. Same `ProductPicker` component already built, filtered to `category = 'RepairPart'`. Operator adds parts and quantities as they diagnose the job.

On repair job save:
1. Insert `repair_parts` rows linking to the job
2. Decrement `products.stock` for each part used
3. Same stock guard as sales — block if quantity exceeds stock, show inline error

On repair job delete (edge case): restore stock for each part in `repair_parts`.

### RepairForm additions

```
[ Customer ]  [ Brand / Model / IMEI ]  [ Problem ]
...existing fields...

Parts Used (optional)
┌─────────────────────┬──────────┬────────┐
│ Part                │ Quantity │        │
├─────────────────────┼──────────┼────────┤
│ [Screen - iPhone 13]│    1     │ Remove │
│ [Battery - Generic] │    1     │ Remove │
└─────────────────────┴──────────┴────────┘
[ + Add Part ]
```

Parts are optional — not every repair uses tracked inventory parts.

---

## Migration from V1 to V2

The client is running V1 locally right now. They will have real data.

Migration path:
1. Client uses V1 Export JSON function to download their data
2. You write a one-time migration script (`migrate.js`) that reads the JSON and inserts into Supabase via the JS client
3. Client verifies data in V2, then stops using V1

Write `migrate.js` before going live. Don't assume the client's data is clean — add null checks and skip/log bad rows rather than crashing.

---

## Vercel Deployment

```
# .env.local (never commit this)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Add the same variables in Vercel dashboard under Project → Settings → Environment Variables.

Vite exposes them as `import.meta.env.VITE_SUPABASE_URL`.

`vercel.json` — needed for React Router client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## Development Roadmap

### Phase 1 — Infrastructure (Day 1)
- Create Supabase project, run SQL schema, enable RLS + policies
- Replace `db.js` with `supabase.js` client setup
- Remove Dexie.js
- Create `AuthContext.jsx` + `Login.jsx`
- Add `ProtectedRoute` wrapper to all routes
- Test: login works, protected routes redirect correctly
- Set up Vercel project, connect GitHub repo, add env vars
- Test: deploy works, login page accessible on live URL

**Deliverable:** Auth working on Vercel. All routes protected.

---

### Phase 2 — Data Layer Migration (Day 2)
- Rewrite all CRUD calls in every page from Dexie to Supabase client
- Pattern per page: `supabase.from('table').select() / insert() / update() / delete()`
- Update `receiptNumber.js` to query Supabase settings table instead of Dexie
- Test every module: customers, inventory, repairs, sales

**Deliverable:** All existing V1 features working against Supabase.

---

### Phase 3 — Repair Parts Consumption (Day 3)
- Add `repair_parts` table (already in schema)
- Add Parts Used section to `RepairForm`
- Wire stock decrement + guard on repair save
- Update `RepairDetail` to show parts used
- Update receipt to list parts if present

**Deliverable:** Parts auto-consumed from inventory on repair save.

---

### Phase 4 — WhatsApp Integration (Day 4)
- Create `whatsapp.js` with URL builder + receipt text formatter
- Add WhatsApp button to `RepairDetail` and `SaleDetail`
- Test on desktop (WhatsApp Web) and mobile (WhatsApp app)
- Handle missing phone number gracefully — disable button, show tooltip

**Deliverable:** WhatsApp share working on both receipt types.

---

### Phase 5 — Migration Script + Polish (Day 5)
- Write `migrate.js` — reads V1 JSON export, inserts into Supabase
- Test migration with real or dummy V1 data
- Remove `backup.js` (redundant)
- Update Settings page to save to Supabase instead of Dexie
- End-to-end walkthrough
- Update client handoff guide: new login URL, WhatsApp usage, migration steps

**Deliverable:** V2 shippable. Migration path clear for client.

---

## V2 Verification Checklist

1. Login with wrong credentials → blocked with error
2. Login with correct credentials → redirected to dashboard
3. Navigate to any route without login → redirected to `/login`
4. All V1 features work: customers, repairs, sales, inventory, dashboard, settings
5. Create repair with parts → stock decrements correctly
6. Attempt to use more parts than in stock → blocked with inline error
7. Repair detail shows parts used
8. WhatsApp button on repair receipt → opens WhatsApp with correct pre-filled message
9. WhatsApp button on sale receipt → same
10. WhatsApp button with no customer phone → disabled or hidden, no crash
11. Run migration script with V1 JSON → all records appear in V2
12. Vercel build passes with no errors
13. Live URL accessible from mobile browser

---

## V3 Backlog (do not build in V2)

- Device table (`Customer → Device → Repairs`)
- Supplier / purchase tracking
- Expense tracking + profit dashboard
- Barcode scanner
- Multi-branch with branch-level RLS
- Staff accounts with role permissions
- Automated WhatsApp via Twilio (no manual send)