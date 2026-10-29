import { useState } from 'react';
import { getProducts } from '../lib/api';
import { formatCurrency } from '../lib/helpers';
import useSmartSearch from '../hooks/useSmartSearch';
import SearchDropdown from './SearchDropdown';

export default function RepairPartsPicker({ parts, onAdd, onUpdate, onRemove }) {
  const [showResults, setShowResults] = useState(false);

  const { query, setQuery, results: filtered, isLoading } = useSmartSearch(
    () => getProducts().then((prods) => prods.filter((p) => p.category === 'RepairPart')),
    ['name', 'sku'],
    0
  );

  function handleSelect(product) {
    if ((Number(product.stock) || 0) <= 0) return;

    const existing = parts.find((part) => part.productId === product.id);
    if (existing) {
      onUpdate(product.id, 'quantity', Number(existing.quantity) + 1);
    } else {
      onAdd({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        costPrice: product.costPrice || 0,
        sellingPrice: product.sellingPrice || 0,
      });
    }
    setQuery('');
    setShowResults(false);
  }

  const partsTotal = parts.reduce((s, p) => s + p.quantity * (p.sellingPrice || p.costPrice || 0), 0);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Parts Used (optional)
      </label>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search part..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {showResults && query.length > 0 && (
          <SearchDropdown
            results={filtered}
            isLoading={isLoading}
            emptyMessage="No repair parts found"
            maxItems={8}
            onClose={() => setShowResults(false)}
            onSelect={handleSelect}
            isItemDisabled={(p) => (Number(p.stock) || 0) <= 0}
            renderItem={(p) => (
              <span className={p.stock <= 0 ? 'text-gray-400' : ''}>
                <span className="font-medium">{p.name}</span>
                <span className={p.stock <= 0 ? 'text-red-400' : 'text-gray-400'}>
                  {' '}(Stock: {p.stock})
                </span>
                {p.stock <= 0 && ' ⚠'}
              </span>
            )}
          />
        )}
      </div>

      {parts.length > 0 && (
        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Part</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 w-16">Qty</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-24">Unit Price</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-24">Subtotal</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <tr key={part.productId} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2">{part.productName}</td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={part.quantity}
                      onChange={(e) =>
                        onUpdate(
                          part.productId,
                          'quantity',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      onBlur={() => {
                        if (!(Number(part.quantity) >= 1)) {
                          onUpdate(part.productId, 'quantity', 1);
                        }
                      }}
                      className="w-full text-center border border-gray-300 rounded px-1 py-0.5 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      value={part.sellingPrice ?? part.costPrice ?? 0}
                      onChange={(e) =>
                        onUpdate(part.productId, 'sellingPrice', Number(e.target.value))
                      }
                      className="w-full text-right border border-gray-300 rounded px-1 py-0.5 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatCurrency(part.quantity * (part.sellingPrice || part.costPrice || 0))}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(part.productId)}
                      aria-label={`Remove ${part.productName}`}
                      className="text-red-400 hover:text-red-600 text-sm"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-gray-50 px-3 py-2 text-sm text-right text-gray-700 border-t border-gray-200">
            Parts Total: <strong>{formatCurrency(partsTotal)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
