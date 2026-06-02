import { useState, useEffect } from 'react';
import { getCustomer, searchCustomers } from '../db/db';

export default function CustomerPicker({ value, onChange, required = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value && !selected) {
      getCustomer(value).then((c) => {
        if (c) {
          setSelected(c);
          setQuery(c.name);
        }
      });
    }
  }, [value]);

  function handleSearch(q) {
    setQuery(q);
    setOpen(true);
    if (q.length > 0) {
      searchCustomers(q).then(setResults);
    } else {
      setResults([]);
    }
  }

  function handleSelect(c) {
    setSelected(c);
    setQuery(c.name);
    setOpen(false);
    onChange(c.id);
  }

  function handleClear() {
    setSelected(null);
    setQuery('');
    onChange(null);
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search customer by name or phone..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {!required && selected && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
              onClick={() => handleSelect(c)}
            >
              <span className="font-medium">{c.name}</span>
              {c.phone && (
                <span className="text-gray-500 ml-2">{c.phone}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && query.length > 0 && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500">
          No customers found
        </div>
      )}
    </div>
  );
}
