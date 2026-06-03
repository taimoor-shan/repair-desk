# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server on port 5173
npm run build        # Production build to dist/
npm run lint         # ESLint
npm run electron:dev # Electron dev (Vite + Electron concurrently)
npm run electron:build  # Build and package Electron app (current OS)
```

## Architecture

Single-user offline-first mobile repair shop app. React 19 + Vite 8 + TailwindCSS 3 + Dexie.js (IndexedDB). HashRouter for routing (no server needed — works in Electron `file://` context via `electron-serve`).

**Database** — Dexie.js in `src/db/db.js`. Single `repairDesk` database with tables: `settings`, `customers`, `devices`, `products`, `repairJobs`, `sales`, `saleItems`. All data lives client-side. JSON export/import in `src/lib/backup.js` for backup.

**Receipt numbers** — `REP-YYYYMMDD-XXXX` / `SAL-YYYYMMDD-XXXX` with daily auto-reset counter.

**Routing** — `src/App.jsx` defines all routes. Layout wraps sidebar + main content. Sidebar is a slide-over drawer on mobile (`-translate-x-full`), fixed w-56 on desktop.

**Contexts** — Two: `ToastContext` (auto-dismiss 3s, `useToast()` returns `addToast(msg, type?)`), `ConfirmContext` (Promise-based, `useConfirm()` returns `confirm(title, msg, opts?)` where opts: `{ confirmLabel, confirmVariant }` — variant is `'red'` or `'blue'`).

**State pattern** — Pages fetch directly from Dexie (no Redux/global state). Forms use `useState` for field values and errors. Dashboard uses `useLiveQuery` from `dexie-react-hooks` for reactivity.

**Receipt printing** — `src/components/PrintReceipt.jsx` renders shop logo, details table, totals. Printed via `window.open()` + `ReactDOM.createRoot()` + `win.print()` after 300ms delay.

**Electron** — `electron/main.js` uses `electron-serve` to serve `dist/` on localhost (not `file://`). `electron-builder` packages to `.dmg` (macOS), `.exe` (Windows), `.AppImage` (Linux). Icon: `public/icon.png` (512×512). Build config in `package.json` under `"build"` key.

**File conventions** — Pages in `src/pages/` or `src/pages/<section>/`. Components in `src/components/`. One component per file, default exports.
