import { useState, useEffect } from 'react';
import { getProducts } from '../lib/api';
import useDebounce from '../hooks/useDebounce';
import { rankPrefixFirst } from '../lib/helpers';

export default function ProductPicker({ onSelect }) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  // Prefix-first ranked filter with debounce
  const filtered = rankPrefixFirst(
    products.filter((p) => p.stock > 0),
    debouncedQuery,
    ['name']
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search product..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && debouncedQuery.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                onClick={() => {
                  onSelect(p);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-500 ml-2">
                  Stock: {p.stock} | {p.sellingPrice}
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
