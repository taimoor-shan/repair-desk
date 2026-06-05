import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStockPurchases, deleteStockPurchase, getProducts, addStockPurchase } from '../../lib/api';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../lib/helpers';
import EmptyState from '../../components/EmptyState';

const emptyRestock = {
  date: new Date().toISOString().slice(0, 10),
  supplier: '',
  quantity: 0,
  unitCost: 0,
  note: '',
};

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyRestock);
  const [selectedProductId, setSelectedProductId] = useState('');
  const confirm = useConfirm();
  const addToast = useToast();

  useEffect(() => {
    getStockPurchases().then(setPurchases);
    getProducts().then(setProducts);
  }, []);

  async function handleDelete(purchase) {
    const ok = await confirm(
      'Delete Purchase',
      `Delete this purchase of ${purchase.quantity}× ${purchase.productName}? Stock will be adjusted down.`
    );
    if (!ok) return;
    await deleteStockPurchase(purchase.id);
    setPurchases((prev) => prev.filter((p) => p.id !== purchase.id));
    addToast('Purchase deleted');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedProductId || form.quantity <= 0) return;

    const product = products.find((p) => p.id === Number(selectedProductId));
    if (!product) return;

    const unitCost = Number(form.unitCost) || product.costPrice || 0;
    const totalCost = unitCost * form.quantity;

    await addStockPurchase({
      productId: product.id,
      productName: product.name,
      quantity: form.quantity,
      unitCost,
      totalCost,
      supplier: form.supplier || null,
      note: form.note || null,
      date: form.date,
    });

    addToast(`${form.quantity} units of "${product.name}" restocked`);
    setShowForm(false);
    setForm(emptyRestock);
    setSelectedProductId('');
    getStockPurchases().then(setPurchases);
    getProducts().then(setProducts);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/inventory"
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            ← Back to Inventory
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Stock Purchases</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + New Purchase
        </button>
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          title="No purchases yet"
          description="Log your first stock purchase."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              + New Purchase
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Qty</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Unit Cost</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600" />
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{p.date}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{p.productName}</td>
                  <td className="px-4 py-3 text-gray-600">{p.supplier || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{p.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatCurrency(p.unitCost)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">
                    {formatCurrency(p.totalCost)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(p)}
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Purchase Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900">New Purchase</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const p = products.find(
                      (pr) => pr.id === Number(e.target.value)
                    );
                    if (p) {
                      setForm((f) => ({ ...f, unitCost: p.costPrice || 0 }));
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier (optional)
                </label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                <input
                  type="number"
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyRestock);
                    setSelectedProductId('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedProductId || form.quantity <= 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
