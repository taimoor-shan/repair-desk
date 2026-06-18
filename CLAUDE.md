# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start Vite dev server on port 5173
pnpm build        # Production build to dist/
pnpm lint         # ESLint
pnpm preview      # Preview production build locally
```

Package manager is `pnpm` (v10). No test suite exists.

## Architecture

Single-user offline-first mobile repair shop app. React 19 + Vite 8 + TailwindCSS 3 + Dexie.js (IndexedDB). HashRouter for routing (no server needed).

**Dual-backend adapter pattern** — `src/lib/api/index.js` dynamically imports either the Dexie adapter (`adapter.dexie.js`) or Supabase adapter (`adapter.supabase.js`) based on `import.meta.env.VITE_DB_BACKEND` (defaults to `'dexie'`). Both adapters export the same ~65 functions. All pages import from `'../lib/api'` — never from an adapter directly. The Supabase adapter maps between camelCase (app) and snake_case (DB columns).

**Database** — Dexie DB named `'RepairDesk'` is defined inside `src/lib/api/adapter.dexie.js`. Ten tables: `customers`, `products`, `repairJobs`, `sales`, `settings`, `devices`, `repairParts`, `expenses`, `stockPurchases`. Sale items are embedded JSON inside the `sales` table (no separate `saleItems` table). Products have a unique `sku` index (v6 schema with dedup migration).

**FIFO inventory costing** — Both adapters implement `consumeInventory(productId, quantity)` and `restoreInventory(item)`. When stock is consumed (sales, repair parts), it draws from `stockPurchases` lots oldest-first, recording cost layers (`{ purchaseId, quantity, unitCost }`). Restoring returns stock to those same lots. Products with stock above their costed layers get auto-reconciliation entries ("Opening balance reconciliation").

**Auth** — `AuthContext` (`src/context/AuthContext.jsx`). In Dexie mode, auto-logged-in as `{ id: 'local' }`. In Supabase mode, uses `@supabase/supabase-js` auth (email/password), with a 5-second timeout before showing login. Supabase client is lazy-loaded (`import('../lib/supabase.js')`). `ProtectedRoute` in `App.jsx` redirects to `/login` when unauthenticated.

**Contexts** — Four, nested in App.jsx: `AuthProvider` → `NotificationProvider` → `ToastProvider` → `ConfirmProvider`.
- `ToastContext` — `useToast()` returns `addToast(message, type?)`. Auto-dismisses after 3s. Types: `'success'` (green), `'error'` (red), `'info'` (blue).
- `ConfirmContext` — `useConfirm()` returns `confirm(title, message, opts?)` → Promise<boolean>. `opts`: `{ confirmLabel, confirmVariant }` where variant is `'red'` or `'blue'`.
- `NotificationContext` — `useNotifications()` returns `{ notifications, unreadCount, addNotification, dismissNotification, markAllRead, clearAll }`. Low-stock scan runs on mount. Persisted to `localStorage` key `'rd_notifications'`.
- `AuthContext` — `useAuth()` returns `{ user, session, loading, signIn, signOut }`.

**State pattern** — Pages fetch directly from Dexie/Supabase via `src/lib/api` (no Redux/global state). Forms use `useState` for field values and errors. Dashboard and pages with live data use `useLiveQuery` from `dexie-react-hooks`.

**Search** — `useSmartSearch` hook (`src/hooks/useSmartSearch.js`) prefetches all items on mount, then filters client-side with prefix-first ranking (items starting with query first, then contains). `useDebounce` hook for input debouncing. `SearchDropdown` component renders searchable select dropdowns. Helper functions in `src/lib/helpers.js`: `rankPrefixFirst(items, query, fields)` for manual ranking.

**Receipt numbers** — `src/lib/receiptNumber.js` generates `REP-YYYYMMDD-XXXX` / `SAL-YYYYMMDD-XXXX` with daily auto-reset. In Dexie, sequence is stored in `settings` row (id=1). In Supabase, uses `next_receipt_seq` RPC.

**Receipt printing** — `src/components/PrintReceipt.jsx` renders shop logo, details table, totals. Printed via `window.open()` + `ReactDOM.createRoot()` + `win.print()` after 300ms delay. `PrintReceiptButton` wraps the trigger logic. WhatsApp sharing via `src/lib/whatsapp.js` builds formatted receipt text with `wa.me` links.

**Currency** — `src/lib/helpers.js` exports `formatCurrency(amount, code?)`, `setCurrency(code)`, `getCurrency()`. In-memory currency code (no reactive update). Supports 20 locales. `App.jsx` calls `setCurrency` from settings on mount.

**Analytics** — `src/pages/Analytics.jsx` uses `recharts` for charts. `getAnalyticsData(rangeStart, rangeEnd)` from the API adapter returns revenue, COGS, expenses, net profit, daily/monthly breakdowns, top repair problems, top-selling products.

**Routing** — `src/App.jsx` defines all routes in `<Routes>`. Layout wraps sidebar + main content. Sidebar is a slide-over drawer on mobile (`-translate-x-full`), fixed `w-56` on desktop. `BellIcon` component in bottom-right (desktop) or header (mobile) shows notification count.

**Backup** — `src/lib/backup.js` exports `exportJSON()` and `importJSON(file)`. Dexie adapter clears all tables and bulk-adds; Supabase adapter upserts. Import handles snake_case→camelCase auto-mapping for cross-backend portability.

**Environment variables** — `VITE_DB_BACKEND` (`'dexie'` | `'supabase'`), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

**File conventions** — Pages in `src/pages/` or `src/pages/<section>/`. Components in `src/components/`. Custom hooks in `src/hooks/`. Library/utility code in `src/lib/`. One component per file, default exports.
