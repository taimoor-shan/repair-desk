import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSales, getCustomer, deleteSale } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/helpers';
import useSmartSearch from '../../hooks/useSmartSearch';
import EmptyState from '../../components/EmptyState';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';

export default function SaleList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const confirm = useConfirm();
  const addToast = useToast();

  // Prefetch all sales via smart search hook
  const { query, setQuery, results: sales, isLoading } = useSmartSearch(
    getSales,
    ['receiptNumber'],
    300
  );

  // Load customer map whenever sales change
  useEffect(() => {
    const ids = [...new Set(sales.map((s) => s.customerId).filter(Boolean))];
    if (ids.length > 0) {
      Promise.all(ids.map((id) => getCustomer(id))).then((custs) => {
        const map = {};
        custs.forEach((c) => {
          if (c) map[c.id] = c;
        });
        setCustomers(map);
      });
    } else {
      setCustomers({});
    }
  }, [sales]);

  // Apply search - combine hook's prefix-first results with customer name search
  const searchFiltered = query.trim()
    ? sales.filter((s) => {
        const q = query.toLowerCase().trim();
        const cust = customers[s.customerId];
        return (
          (s.receiptNumber || '').toLowerCase().includes(q) ||
          (cust?.name || '').toLowerCase().includes(q) ||
          (cust?.phone || '').toLowerCase().includes(q)
        );
      })
    : sales;

  // Apply date range filter
  const dateFiltered = (dateFrom && dateTo)
    ? searchFiltered.filter((s) => {
        const d = (s.createdAt || '').slice(0, 10);
        return d >= dateFrom && d <= dateTo;
      }).sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      )
    : searchFiltered;

  const filtered = dateFiltered;

  async function handleDelete(sale, e) {
    e.stopPropagation();
    const itemsDesc = sale.items?.map((i) => `${i.quantity}× ${i.productName}`).join(', ') || 'no items';
    const ok = await confirm(
      'Delete Sale',
      `Delete ${sale.receiptNumber}?\n\nItems: ${itemsDesc}\nTotal: ${formatCurrency(sale.totalAmount - (sale.discount || 0))}\n\nStock will be returned to inventory.`
    );
    if (!ok) return;
    await deleteSale(sale.id);
    addToast('Sale deleted, stock restored');
    window.location.reload();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Sales</h2>
        <Link
          to="/sales/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + New Sale
        </Link>
      </div>

      {/* Search + Date Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim()) { setDateFrom(''); setDateTo(''); }
            }}
            placeholder="Search by receipt or customer..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query.length > 0 && (
            <span className="text-xs text-gray-500 mt-1 inline-block">
              {filtered.length} sale{filtered.length !== 1 ? 's' : ''} match
            </span>
          )}
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            if (e.target.value) { setQuery(''); }
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            if (e.target.value) { setQuery(''); }
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="To date"
        />
        {(query || dateFrom || dateTo) && (
          <button
            onClick={() => { setQuery(''); setDateFrom(''); setDateTo(''); }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading sales...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No sales yet"
          description="Record your first sale."
          action={
            <Link
              to="/sales/new"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              + New Sale
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Receipt
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Customer
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Items
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Payment
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Total
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const cust = customers[s.customerId];
                return (
                  <tr
                    key={s.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/sales/${s.id}`)}
                  >
                    <td className="px-4 py-3 text-blue-600 font-medium">
                      {s.receiptNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {cust?.name || 'Walk-in'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.items?.length || 0} item(s)
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(s.totalAmount - (s.discount || 0))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => handleDelete(s, e)}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
