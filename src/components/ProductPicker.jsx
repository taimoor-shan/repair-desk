import { useState, useEffect, useRef } from 'react';
import { getProducts } from '../lib/api';
import { formatCurrency, rankPrefixFirst } from '../lib/helpers';

export default function ProductPicker({ onSelect }) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const inStock = products.filter((p) => p.stock > 0);

  // Prefix-first ranked filter — name or SKU (barcode scans type into SKU)
  const filtered = rankPrefixFirst(inStock, query, ['name', 'sku']);

  function selectProduct(product) {
    onSelect(product);
    setQuery('');
    setOpen(false);
    // Keep focus for the next scan; parent re-render can steal it
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleKeyDown(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (filtered.length > 0) {
      selectProduct(filtered[0]);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search product or scan barcode..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && query.trim().length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                onClick={() => selectProduct(p)}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-400 text-xs ml-2">
                  {p.sku && `${p.sku} · `}Stock: {p.stock} · {formatCurrency(p.sellingPrice)}
                </span>
              </button>
            ))
          ) : (
            <div className="p-3 text-sm text-gray-500">
              {products.length === 0
                ? 'No products in inventory'
                : 'No matching products in stock'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
