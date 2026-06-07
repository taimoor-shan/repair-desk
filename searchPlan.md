# Master Plan: Smart Search System

## Context

Offline-first Dexie/IndexedDB app for a mobile repair and accessories shop.
All data is local — no network calls. "Prefetch" = load full dataset once on
mount, filter in memory. Zero latency after initial load.

---

## Architecture

Two new hooks + one reusable component, applied across all 7 search areas.

---

## Files to Create

### 1. `src/hooks/useDebounce.js`

```js
import { useState, useEffect } from 'react'

export default function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

300ms delay. Classic setTimeout — not useTransition/useDeferredValue (those
control render priority, not call frequency).

---

### 2. `src/hooks/useSmartSearch.js`

Accepts:
- `fetchFn` — async function returning all items (e.g. `getCustomers`)
- `searchFields` — array of field names to search (e.g. `['name', 'phone']`)
- `debounceMs` — default 300ms

Returns:
- `query` / `setQuery`
- `debouncedQuery`
- `results` — filtered + ranked array
- `isLoading` — true during initial prefetch only
- `hasResults`

**Ranking logic (prefix-first):**
1. Items where ANY searchField `startsWith(query)` → sorted alphabetically
2. Items where ANY searchField `includes(query)` but not startsWith → sorted alphabetically
3. Deduplicate. Concatenate group 1 + group 2.

**Cancellation:** use `let cancelled = false` flag in useEffect cleanup to
prevent stale state on rapid input changes.

**On empty query:** return full prefetched dataset, sorted alphabetically by
first searchField.

```js
// Ranking implementation reference
const lower = query.toLowerCase()
const prefix = []
const contains = []

items.forEach(item => {
  const fields = searchFields.map(f => (item[f] || '').toLowerCase())
  const isPrefix = fields.some(f => f.startsWith(lower))
  const isContains = fields.some(f => f.includes(lower))
  if (isPrefix) prefix.push(item)
  else if (isContains) contains.push(item)
})

const sort = (arr, field) =>
  [...arr].sort((a, b) =>
    (a[searchFields[0]] || '').localeCompare(b[searchFields[0]] || ''))

return [...sort(prefix), ...sort(contains)]
```

---

### 3. `src/components/SearchDropdown.jsx`

Props:
- `results` — items to display
- `onSelect(item)` — called on click or Enter
- `renderItem(item)` — render function for each row
- `isLoading` — show spinner
- `emptyMessage` — text when no results (default: "No results")
- `maxItems` — visible limit (default 8)
- `onClose` — close callback

Features:
- Click-outside-to-close (mousedown listener on document)
- Keyboard navigation: `↓` `↑` to move, `Enter` to select, `Esc` to close
- Show "Showing X of Y matches" when results exceed maxItems
- Fade-in animation (CSS only, no library needed)
- 4px top spinner during `isLoading`

---

## Files to Modify

### 4. `src/components/CustomerPicker.jsx`

- Import `useDebounce`
- Replace `handleSearch` with direct `setQuery` on `onChange`
- `debouncedQuery` drives the `searchCustomers` call
- Sort results: `.sort((a, b) => a.name.localeCompare(b.name))`
- Show "Searching..." or inline spinner while `isSearching`
- On empty query: clear results immediately (skip debounce)
- Keep existing dropdown UI

---

### 5. `src/components/RepairPartsPicker.jsx`

- Import `useSmartSearch` with `fetchFn = () => getProducts({ category: 'RepairPart' })`
- `searchFields: ['name']`
- Replace current `useState` filter with hook's `results`
- Prefix-first: typing "s" → "Samsung Battery" before "Glass Screen Protector"
- Keep existing parts table UI below the input

---

### 6. `src/components/ProductPicker.jsx`

- Import `useDebounce` (300ms)
- Apply prefix-first filter manually (same ranking logic as useSmartSearch)
- Sort: `.sort((a, b) => a.name.localeCompare(b.name))`
- Keep existing dropdown UI

---

### 7. `src/pages/customers/CustomerList.jsx`

- Import `useSmartSearch` with `fetchFn = getCustomers`, `searchFields: ['name', 'phone']`
- Replace `useEffect + searchCustomers` with hook
- Add `SearchDropdown` above table: top 8 matches, click → navigate to `/customers/:id`
- Table filters inline using `results`
- Show "X customers match your search" count below search input

---

### 8. `src/pages/repairs/RepairList.jsx`

- Import `useSmartSearch` with `fetchFn = getRepairJobs`
- `searchFields: ['receiptNumber', 'mobileBrand', 'mobileModel', 'imei', 'customerName', 'customerPhone']`
- Pre-fetch customer names for display
- Add `SearchDropdown`: top 8 matches, click → navigate to `/repairs/:id`
- Table filters inline using `results`
- Debounce search only — date range and status filters stay unchanged
- Effect dependencies: `[debouncedQuery, dateFrom, dateTo]`
- Sort by `receiptNumber`: `.sort((a, b) => (a.receiptNumber || '').localeCompare(b.receiptNumber || ''))`

---

### 9. `src/pages/sales/SaleList.jsx`

- Import `useSmartSearch` with `fetchFn = getSales`
- `searchFields: ['receiptNumber', 'customerName', 'customerPhone']`
- Pre-fetch customer names for display
- Add `SearchDropdown`: top 8 matches, click → navigate to `/sales/:id`
- Table filters inline using `results`
- Preserve existing date range filter logic
- Sort by `receiptNumber`

---

### 10. `src/pages/inventory/ProductList.jsx`

- Apply prefix-first filter to existing client-side filter (no hook needed, already prefetched)
- Add `SearchDropdown`: top 8 matches for quick navigation
- Preserve category filter logic
- Sort: `.sort((a, b) => a.name.localeCompare(b.name))`

---

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Debounce method | `setTimeout` | Controls call frequency. useTransition controls render priority only. |
| Delay | 300ms | Standard threshold. Below causality perception, eliminates 3-4 extra calls per fast typist. |
| Prefetch strategy | Load once on mount, filter in memory | Dexie is local — zero network cost. No reason to re-query on every keystroke. |
| Ranking | Prefix-first, then contains | More natural for product/customer lookup in a shop context. |
| Cancellation | `let cancelled = false` flag | Prevents stale state. Works identically for Dexie and Supabase. |
| Client-side components | No debounce, sort only | Already instant. Debounce would add unnecessary lag. |
| Dropdown limit | 8 items | Enough for quick navigation without overwhelming a small shop's dataset. |

---

## Verification Checklist

- [ ] `npm run dev` — app starts without errors
- [ ] CustomerPicker: results appear after 300ms pause, alphabetically sorted, no duplicate calls
- [ ] CustomerList: dropdown shows top 8, table filters simultaneously, count label updates
- [ ] RepairList: typing "ip" → "iPad", "iPhone" repairs first. Date/status filters unaffected.
- [ ] SaleList: receipt number prefix → instant dropdown + filtered table
- [ ] ProductList: prefix-first results in dropdown + table, category filter preserved
- [ ] RepairPartsPicker: typing "s" → "Samsung Battery" before "Glass Screen Protector"
- [ ] Keyboard nav: `↓↑` to move, `Enter` to select, `Esc` to close — all pickers
- [ ] Spinner visible during initial prefetch on slower devices
- [ ] Test Dexie backend (default) and Supabase (`VITE_DB_BACKEND=supabase`)
- [ ] Rapid typing: only one DB call fires after 300ms pause
- [ ] Empty query: full sorted list returned, no spinner