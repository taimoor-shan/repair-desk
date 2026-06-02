import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct, adjustStock } from '../../db/db';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../lib/helpers';
import EmptyState from '../../components/EmptyState';

const categories = ['All', 'Mobile', 'Accessory', 'RepairPart'];

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const confirm = useConfirm();
  const addToast = useToast();

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  async function handleDelete(product) {
    const ok = await confirm(
      'Delete Product',
      `Delete "${product.name}"? This cannot be undone.`
    );
    if (!ok) return;
    await deleteProduct(product.id);
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    addToast(`"${product.name}" deleted`);
  }

  async function handleAdjust() {
    if (adjustAmount === 0 || !adjustModal) return;
    await adjustStock(adjustModal.id, Number(adjustAmount));
    setProducts((prev) =>
      prev.map((p) =>
        p.id === adjustModal.id
          ? { ...p, stock: Math.max(0, p.stock + Number(adjustAmount)) }
          : p
      )
    );
    addToast('Stock adjusted');
    setAdjustModal(null);
    setAdjustAmount(0);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
        <Link
          to="/inventory/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first product to start tracking inventory."
          action={
            <Link
              to="/inventory/new"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              + Add Product
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Product
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Category
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Stock
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Cost
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Price
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    {p.sku && (
                      <span className="text-gray-400 text-xs ml-2">
                        {p.sku}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        p.stock <= (p.lowStockThreshold || 5)
                          ? 'text-red-600 font-semibold'
                          : 'text-gray-900'
                      }`}
                    >
                      {p.stock <= (p.lowStockThreshold || 5) && (
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                      )}
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatCurrency(p.costPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">
                    {formatCurrency(p.sellingPrice)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setAdjustModal(p);
                          setAdjustAmount(0);
                        }}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Stock
                      </button>
                      <Link
                        to={`/inventory/${p.id}/edit`}
                        className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p)}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Adjust Stock — {adjustModal.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Current stock: {adjustModal.stock}
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adjustment (+/−)
              </label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. +5 or -3"
                autoFocus
              />
            </div>
            {adjustAmount !== 0 && (
              <p className="mt-2 text-sm text-gray-500">
                New stock: {Math.max(0, adjustModal.stock + Number(adjustAmount))}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setAdjustModal(null);
                  setAdjustAmount(0);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Adjust
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
