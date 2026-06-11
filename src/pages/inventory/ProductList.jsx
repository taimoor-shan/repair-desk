import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct, adjustStock, addStockPurchase } from '../../lib/api';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, rankPrefixFirst } from '../../lib/helpers';
import useDebounce from '../../hooks/useDebounce';
import SearchDropdown from '../../components/SearchDropdown';
import EmptyState from '../../components/EmptyState';

const categories = ['All', 'Mobile', 'Accessory', 'RepairPart'];
const adjustReasons = ['Damaged', 'Stock Count', 'Other'];

const emptyRestock = {
  date: new Date().toISOString().slice(0, 10),
  supplier: '',
  quantity: 0,
  unitCost: 0,
  note: '',
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showDropdown, setShowDropdown] = useState(false);
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [restockModal, setRestockModal] = useState(null);
  const [restockForm, setRestockForm] = useState(emptyRestock);
  const confirm = useConfirm();
  const addToast = useToast();
  const debouncedSearch = useDebounce(search, 300);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  // Category filter first, then prefix-first search
  const categoryFiltered =
    category === 'All'
      ? products
      : products.filter((p) => p.category === category);

  const filtered = rankPrefixFirst(categoryFiltered, debouncedSearch, ['name', 'sku']);

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
    try {
      await adjustStock(adjustModal.id, Number(adjustAmount));
      setProducts((prev) =>
        prev.map((p) =>
          p.id === adjustModal.id
            ? { ...p, stock: Math.max(0, p.stock + Number(adjustAmount)) }
            : p
        )
      );
      addToast(`Stock adjusted — ${adjustReason}`);
      setAdjustModal(null);
      setAdjustAmount(0);
      setAdjustReason('');
    } catch (err) {
      addToast(err.message || 'Unable to adjust stock', 'error');
    }
  }

  async function handleRestock() {
    if (!restockModal || restockForm.quantity <= 0) return;
    const product = restockModal;
    const unitCost = Number(restockForm.unitCost) || 0;
    if (unitCost <= 0) {
      addToast('Unit cost is required for restock', 'error');
      return;
    }
    const totalCost = unitCost * restockForm.quantity;

    try {
      await addStockPurchase({
        productId: product.id,
        productName: product.name,
        quantity: restockForm.quantity,
        unitCost,
        totalCost,
        supplier: restockForm.supplier || null,
        note: restockForm.note || null,
        date: restockForm.date,
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, stock: p.stock + restockForm.quantity, costPrice: unitCost }
            : p
        )
      );
      addToast(`${restockForm.quantity} units of "${product.name}" restocked`);
      setRestockModal(null);
      setRestockForm(emptyRestock);
    } catch (err) {
      addToast(err.message || 'Unable to restock product', 'error');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
        <div className="flex gap-2">
          <Link
            to="/inventory/purchases"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Purchases
          </Link>
          <Link
            to="/inventory/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by name or SKU..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search.length > 0 && (
            <span className="text-xs text-gray-500 mt-1 inline-block">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''} match
            </span>
          )}
          {showDropdown && debouncedSearch.length > 0 && (
            <SearchDropdown
              results={filtered}
              isLoading={false}
              emptyMessage="No matching products"
              maxItems={8}
              onClose={() => setShowDropdown(false)}
              onSelect={(p) => {
                setShowDropdown(false);
                window.location.href = `#/inventory/${p.id}/edit`;
              }}
              renderItem={(p) => (
                <>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-400 text-xs ml-2">
                    {p.sku && `${p.sku} · `}Stock: {p.stock} · {formatCurrency(p.sellingPrice)}
                  </span>
                </>
              )}
            />
          )}
        </div>
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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading inventory...
          </div>
        </div>
      ) : filtered.length === 0 ? (
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
                          setRestockModal(p);
                          setRestockForm({
                            ...emptyRestock,
                            unitCost: p.costPrice || 0,
                          });
                        }}
                        className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded"
                      >
                        Restock
                      </button>
                      <button
                        onClick={() => {
                          setAdjustModal(p);
                          setAdjustAmount(0);
                          setAdjustReason('');
                        }}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Adjust
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

      {/* Stock Adjustment Modal (corrections only) */}
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
                max="-1"
                placeholder="e.g. -3"
                autoFocus
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason *
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select reason...</option>
                {adjustReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
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
                  setAdjustReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                disabled={!adjustReason || Number(adjustAmount) >= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Adjust
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal (incoming from supplier) */}
      {restockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Restock — {restockModal.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Current stock: {restockModal.stock}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={restockForm.date}
                  onChange={(e) =>
                    setRestockForm({ ...restockForm, date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier (optional)
                </label>
                <input
                  type="text"
                  value={restockForm.supplier}
                  onChange={(e) =>
                    setRestockForm({ ...restockForm, supplier: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Ali Parts"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={restockForm.quantity}
                  onChange={(e) =>
                    setRestockForm({
                      ...restockForm,
                      quantity: Number(e.target.value),
                    })
                  }
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost
                </label>
                <input
                  type="number"
                  value={restockForm.unitCost}
                  onChange={(e) =>
                    setRestockForm({
                      ...restockForm,
                      unitCost: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={restockForm.note}
                  onChange={(e) =>
                    setRestockForm({ ...restockForm, note: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {restockForm.quantity > 0 && (
                <p className="text-sm text-gray-500">
                  Total cost:{' '}
                  {formatCurrency(
                    restockForm.quantity * (Number(restockForm.unitCost) || 0)
                  )}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRestockModal(null);
                  setRestockForm(emptyRestock);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                disabled={restockForm.quantity <= 0 || Number(restockForm.unitCost) <= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
