import { useState, useEffect, useRef } from 'react';
import {
  addCustomer,
  getCustomer,
  getCustomerByPhone,
  searchCustomers,
} from '../lib/api';
import useDebounce from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext';

const emptyCustomer = { name: '', phone: '', email: '', address: '' };

export default function CustomerPicker({ value, onChange, required = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState(emptyCustomer);
  const [addErrors, setAddErrors] = useState({});
  const [savingCustomer, setSavingCustomer] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const searchRequest = useRef(0);
  const savingRef = useRef(false);
  const addToast = useToast();

  useEffect(() => {
    if (!value || String(selected?.id) === String(value)) return;
    getCustomer(value).then((c) => {
      if (c) {
        setSelected(c);
        setQuery(c.name);
      }
    });
  }, [value, selected?.id]);

  // Search when debouncedQuery changes; ignore out-of-order responses.
  useEffect(() => {
    if (debouncedQuery.length === 0) return;
    const requestId = ++searchRequest.current;
    searchCustomers(debouncedQuery)
      .then((res) => {
        if (requestId !== searchRequest.current) return;
        setResults(res.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => {
        if (requestId !== searchRequest.current) return;
        setResults([]);
      });
  }, [debouncedQuery]);

  function handleSearch(q) {
    setQuery(q);
    setOpen(true);
    if (selected && q !== selected.name) {
      setSelected(null);
      onChange(null);
    }
    if (q.length === 0) {
      setResults([]);
    }
  }

  function handleSelect(c) {
    setSelected(c);
    setQuery(c.name);
    setOpen(false);
    setAdding(false);
    onChange(c.id);
  }

  function handleClear() {
    setSelected(null);
    setQuery('');
    setResults([]);
    onChange(null);
  }

  function beginAdd() {
    const q = query.trim();
    const looksLikePhone = /^[+\d][\d\s()-]{3,}$/.test(q);
    if (selected) {
      setSelected(null);
      onChange(null);
    }
    setNewCustomer({
      ...emptyCustomer,
      name: looksLikePhone ? '' : q,
      phone: looksLikePhone ? q : '',
    });
    setAddErrors({});
    setAdding(true);
    setOpen(false);
  }

  function cancelAdd() {
    setAdding(false);
    setAddErrors({});
    setNewCustomer(emptyCustomer);
  }

  function updateNewCustomer(field, value) {
    setNewCustomer((prev) => ({ ...prev, [field]: value }));
    if (addErrors[field]) {
      setAddErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleAddKeyDown(ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      saveNewCustomer();
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      cancelAdd();
    }
  }

  async function saveNewCustomer() {
    if (savingRef.current) return;

    const e = {};
    if (!newCustomer.name.trim()) e.name = 'Customer name is required';
    if (!newCustomer.phone.trim()) e.phone = 'Phone number is required';
    if (
      newCustomer.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email.trim())
    ) {
      e.email = 'Enter a valid email address';
    }
    setAddErrors(e);
    if (Object.keys(e).length > 0) return;

    savingRef.current = true;
    setSavingCustomer(true);
    try {
      const existing = await getCustomerByPhone(newCustomer.phone.trim());
      if (existing) {
        setAddErrors({
          phone: `A customer with this phone already exists (${existing.name}). Search and select them instead.`,
        });
        return;
      }

      const id = await addCustomer({
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        email: newCustomer.email.trim(),
        address: newCustomer.address.trim(),
      });
      const created = {
        id,
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
      };
      setNewCustomer(emptyCustomer);
      setAddErrors({});
      handleSelect(created);
      addToast('Customer added');
    } catch (err) {
      addToast(err.message || 'Unable to add customer', 'error');
    } finally {
      savingRef.current = false;
      setSavingCustomer(false);
    }
  }

  return (
    <div className="relative">
      {adding ? (
        <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900">Add new customer</p>
            <button
              type="button"
              onClick={cancelAdd}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-2" onKeyDown={handleAddKeyDown}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="block text-xs font-medium text-gray-600">
                Name *
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => updateNewCustomer('name', e.target.value)}
                  autoFocus
                  className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    addErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {addErrors.name && (
                  <span className="mt-1 block text-xs text-red-600">{addErrors.name}</span>
                )}
              </label>

              <label className="block text-xs font-medium text-gray-600">
                Phone *
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => updateNewCustomer('phone', e.target.value)}
                  className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    addErrors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {addErrors.phone && (
                  <span className="mt-1 block text-xs text-red-600">{addErrors.phone}</span>
                )}
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="block text-xs font-medium text-gray-600">
                Email
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => updateNewCustomer('email', e.target.value)}
                  className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    addErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {addErrors.email && (
                  <span className="mt-1 block text-xs text-red-600">{addErrors.email}</span>
                )}
              </label>

              <label className="block text-xs font-medium text-gray-600">
                Address
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => updateNewCustomer('address', e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={saveNewCustomer}
              disabled={savingCustomer}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {savingCustomer ? 'Adding...' : 'Add & Select'}
            </button>
            <button
              type="button"
              onClick={cancelAdd}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
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

          {open && query.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {results.length > 0 ? (
                <div className="max-h-48 overflow-auto">
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
              ) : (
                <div className="p-3 text-sm text-gray-500">
                  {query !== debouncedQuery ? 'Searching...' : 'No customers found'}
                </div>
              )}
              <button
                type="button"
                onClick={beginAdd}
                className="w-full text-left px-3 py-2 text-sm font-medium text-blue-600 bg-gray-50 border-t border-gray-200 hover:bg-blue-50"
              >
                + Add new customer
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
