import { useState, useEffect } from 'react';
import { getProducts } from '../lib/api';

export default function RepairPartsPicker({ parts, onAdd, onUpdate, onRemove }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const repairParts = products.filter((p) => p.category === 'RepairPart');

  const filtered = repairParts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(product) {
    onAdd({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      costPrice: product.costPrice || 0,
      sellingPrice: product.sellingPrice || 0,
    });
    setSearch('');
    setShowResults(false);
  }

  const partsTotal = parts.reduce((s, p) => s + p.quantity * p.costPrice, 0);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Parts Used (optional)
      </label>

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search part..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {showResults && search.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-0 ${
                    p.stock <= 0 ? 'text-gray-400 hover:bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(p)}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className={p.stock <= 0 ? 'text-red-400' : 'text-gray-400'}>
                    {' '}(Stock: {p.stock})
                  </span>
                  {p.stock <= 0 && ' ⚠'}
                </button>
              ))
            ) : (
              <p className="p-3 text-sm text-gray-500">No repair parts found</p>
            )}
          </div>
        )}
      </div>

      {parts.length > 0 && (
        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Part</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 w-16">Qty</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-24">Unit Cost</th>
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
                        onUpdate(part.productId, 'quantity', Number(e.target.value))
                      }
                      className="w-full text-center border border-gray-300 rounded px-1 py-0.5 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      value={part.costPrice}
                      onChange={(e) =>
                        onUpdate(part.productId, 'costPrice', Number(e.target.value))
                      }
                      className="w-full text-right border border-gray-300 rounded px-1 py-0.5 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {(part.quantity * part.costPrice).toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(part.productId)}
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
            Parts Total: <strong>{partsTotal.toLocaleString()}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
