Here is the updated plan with all three changes integrated.

---

# Repair Desk — Implementation Plan v1.1

## Context

Building a browser-based shop management system for a mobile accessories and repair shop. Single-user, fully offline, data persists via IndexedDB. React + Vite + **Tailwind CSS v3** + Dexie.js. Week-1 delivery as a browser app (no Electron).

---

## Architecture Overview

```
repair-desk/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js        # v3 config
├── postcss.config.js         # v3: autoprefixer
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx                # Layout shell: Sidebar + HashRouter
    ├── index.css              # Tailwind directives + @media print base styles
    ├── db/
    │   └── db.js              # Dexie schema + CRUD helpers per table
    ├── lib/
    │   ├── receiptNumber.js   # Counter + date-reset logic
    │   ├── helpers.js         # formatCurrency, formatDate, etc.
    │   └── backup.js          # exportJSON / importJSON functions
    ├── components/
    │   ├── Sidebar.jsx
    │   ├── StatusBadge.jsx
    │   ├── ConfirmDialog.jsx  # Context-based, single root instance
    │   ├── Toast.jsx
    │   ├── EmptyState.jsx
    │   ├── PrintReceipt.jsx   # Shared printable receipt component
    │   ├── CustomerPicker.jsx # Searchable dropdown, "no results" + clear
    │   └── ProductPicker.jsx  # Searchable dropdown, "no results" + clear
    ├── pages/
    │   ├── Dashboard.jsx
    │   ├── Settings.jsx       # NEW: shop info + receipt settings
    │   ├── customers/
    │   │   ├── CustomerList.jsx
    │   │   ├── CustomerForm.jsx
    │   │   └── CustomerDetail.jsx
    │   ├── repairs/
    │   │   ├── RepairList.jsx
    │   │   ├── RepairForm.jsx
    │   │   └── RepairDetail.jsx
    │   ├── sales/
    │   │   ├── SaleList.jsx
    │   │   ├── SaleForm.jsx
    │   │   └── SaleDetail.jsx  # NEW: view past sale + reprint receipt
    │   └── inventory/
    │       ├── ProductList.jsx
    │       └── ProductForm.jsx
    └── context/
        ├── ToastContext.jsx
        └── ConfirmContext.jsx  # NEW: useConfirm hook + root dialog
```

---

## Database Schema (Dexie.js — db/db.js)

```js
db.version(1).stores({
  customers:  '++id, &phone, name',         // &phone = unique index
  products:   '++id, name, category, stock',
  repairJobs: '++id, customerId, status, receivedAt',
  sales:      '++id, customerId, saleType, createdAt',
  settings:   'id',
  // singleton row id=1:
  // shopName, shopPhone, shopAddress,
  // lastRepairSeq, lastRepairDate,
  // lastSaleSeq, lastSaleDate
});
```

**Sale items** stored as a JSON array on the sale record — no separate table needed.

---

## Receipt Numbering (lib/receiptNumber.js)

- Format: `REP-YYYYMMDD-XXXX` / `SAL-YYYYMMDD-XXXX`
- On each generation: read `lastRepairDate` (or `lastSaleDate`) from settings
- If stored date ≠ today → reset sequence to 1, update date
- If stored date = today → increment sequence by 1
- Write updated counter + date back to settings, then return the receipt number

---

## Routing (React Router v6 — HashRouter)

| Route | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Stats + recent activity |
| `/customers` | CustomerList | Searchable list |
| `/customers/new` | CustomerForm | Add new |
| `/customers/:id` | CustomerDetail | View + edit link + history |
| `/customers/:id/edit` | CustomerForm | Edit existing |
| `/repairs` | RepairList | Filterable list with status badges |
| `/repairs/new` | RepairForm | Create, links customer |
| `/repairs/:id` | RepairDetail | View, update status, print |
| `/sales` | SaleList | History list |
| `/sales/new` | SaleForm | New sale + product picker |
| `/sales/:id` | SaleDetail | View past sale + reprint receipt |
| `/inventory` | ProductList | Category filter, low stock alerts |
| `/inventory/new` | ProductForm | Add product |
| `/inventory/:id/edit` | ProductForm | Edit product |
| `/settings` | Settings | Shop info + receipt header config |

---

## Key Design Decisions

1. **No global state library.** Pages call Dexie directly. `ToastContext` for notifications. `ConfirmContext` for delete confirmations — single root instance, triggered via `useConfirm()` hook. No z-index or scroll conflicts.
2. **HashRouter** to avoid server config issues on static file delivery.
3. **Print via `window.print()`** with `@media print` CSS in `index.css`. Sidebar, nav, and all non-receipt elements hidden. Only `.print-area` renders. Base rules wired in Phase 1.
4. **Dexie `liveQuery`** for reactive dashboard stats.
5. **Inline form validation** — no library. Simple per-form validator functions.
6. **Unique phone constraint** on customers table (`&phone`). Duplicate check in `CustomerForm` with message: *"A customer with this number already exists — view their record."*
7. **Stock guard on sales.** Before saving, validate every item's quantity against current stock. Block submission and show inline error if any item exceeds available stock.
8. **Tailwind v3** — install `tailwindcss postcss autoprefixer`, run `npx tailwindcss init -p`. No `@tailwindcss/vite`.

---

## Implementation Order

### Phase 1 — Project Setup + Data Layer
- `npm create vite@latest . -- --template react`
- Install: `tailwindcss postcss autoprefixer dexie react-router-dom`
- Run: `npx tailwindcss init -p`
- Configure `tailwind.config.js` content paths
- Add Tailwind directives to `index.css`
- **Add base `@media print` rules to `index.css` now** — hide sidebar, nav, everything except `.print-area`
- Create `src/db/db.js` — full Dexie schema + CRUD functions per table
- Create `src/lib/receiptNumber.js` — counter + date-reset logic
- Create `src/lib/helpers.js` — `formatCurrency`, `formatDate`
- **Create `src/lib/backup.js`** — `exportJSON()` dumps all 5 tables to a single file: `{ customers, products, repairJobs, sales, settings }`. `importJSON()` reads it back and overwrites tables.
- Build `App.jsx` shell — `HashRouter` + `Sidebar` + route outlet
- Create `src/context/ToastContext.jsx` and `src/context/ConfirmContext.jsx`
- Create placeholder pages for all routes — verify all navigation works

**Deliverable:** Skeleton app navigates cleanly, DB initialised, backup functions exist, print CSS foundation in place.

---

### Phase 2 — Settings + Inventory Module
- **`Settings.jsx`** — form to edit `shopName`, `shopPhone`, `shopAddress`. Saved to `settings` (id=1). Required before first receipt print.
- `ProductList.jsx` — table with category filter, search, low-stock badges
- `ProductForm.jsx` — add/edit with validation
- Delete via `useConfirm()` hook
- Stock adjustment modal (manual `+/−`)

**Deliverable:** Settings page live. Inventory fully working.

---

### Phase 3 — Customer Module + Repair Module (Part 1)
- `CustomerList.jsx` — search by name or phone
- `CustomerForm.jsx` — add/edit with unique phone validation and duplicate error message
- `RepairForm.jsx` — create repair, link to customer via `CustomerPicker`
- `RepairList.jsx` — status badge colour coding
- `CustomerDetail.jsx` — customer info + edit link + linked repairs/sales (placeholder for sales until Phase 5)

**Deliverable:** Customers searchable with duplicate protection. Repair jobs creatable.

---

### Phase 4 — Repair Module (Part 2) + Receipt System
- `RepairDetail.jsx` — status update buttons, edit final cost
- `PrintReceipt.jsx` — shared component, renders data for both repair and sale receipts
- Print initial repair receipt (job received)
- Print final delivery receipt (job completed + payment amount)
- Receipt number auto-generation wired to `receiptNumber.js`

**Deliverable:** Full repair workflow end-to-end including both receipt types.

---

### Phase 5 — Sales Module
- `SaleForm.jsx` — optional customer picker, `ProductPicker` for items, quantity/price/discount, payment method
- Stock guard: validate quantity ≤ current stock before save, inline error if not
- Auto-decrement stock on save
- Print sale receipt via `PrintReceipt.jsx`
- `SaleList.jsx` — history view
- `SaleDetail.jsx` — view past sale, reprint receipt

**Deliverable:** Full sales workflow end-to-end with stock protection.

---

### Phase 6 — Dashboard + Customer History
- Dashboard stats cards: today's sales total, pending + in-progress repair count, monthly revenue, low stock item list
- Recent 5 sales + recent 5 repairs
- `CustomerDetail.jsx` — wire up linked sales (now that Phase 5 is done)
- Reprint receipt from customer history

**Deliverable:** Dashboard live. Customer history complete.

---

### Phase 7 — Polish + Handoff
- Empty states on every list page
- Error handling for deleted/missing references (e.g. sale linked to a deleted customer)
- `@media print` QA — test actual print output
- Wire Export button to `backup.js` `exportJSON()` — visible in Settings page
- Wire Import button to `backup.js` `importJSON()` — with a clear warning: *"This will overwrite all current data."*
- End-to-end walkthrough: full customer journey from arrival to receipt
- `npm run build` — confirm static output works
- Write 1-page "How to Use" guide for client

**Deliverable:** Shippable product.

---

## Verification Checklist

1. `npm run dev` starts without errors
2. `npm run build` produces clean static output
3. Navigate every route — no blank pages
4. Create a product → appears in inventory list with correct stock
5. Attempt to create duplicate customer phone → blocked with error message
6. Create customer → create repair linked to that customer
7. Update repair status through all 4 states: Pending → In Progress → Ready → Delivered
8. Print initial repair receipt → verify shop info appears (from Settings)
9. Print final delivery receipt → verify amount + completion details
10. Create a sale with 2+ products → verify stock decremented correctly
11. Attempt to sell more units than in stock → blocked with inline error
12. Print sale receipt
13. Open `SaleDetail` for a past sale → reprint receipt works
14. Dashboard shows correct stats matching actual DB records
15. `CustomerDetail` shows all linked repairs and sales
16. Export JSON → file downloads with all 5 tables
17. Import JSON → data restored, overwrite warning shown
18. Settings update → new shop name appears on next printed receipt

---

## V2 Backlog (do not build now)

- Electron packaging for desktop app feel
- Cloud hosting + login
- Device table (`Customer → Device → Repairs`)
- Repair parts auto-consumed from inventory
- Supplier / purchase tracking
- Expense tracking
- Barcode scanner
- Multi-branch support
- WhatsApp receipt sharing