import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSales, searchSales, getSalesInRange, getCustomer, deleteSale } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/helpers';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';

export default function SaleList() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lastActive, setLastActive] = useState(null);
  const confirm = useConfirm();
  const addToast = useToast();

  useEffect(() => {
    async function fetchSales() {
      let s;
      if (searchQuery.trim()) {
        s = await searchSales(searchQuery.trim());
      } else if (dateFrom && dateTo) {
        s = await getSalesInRange(dateFrom, dateTo);
      } else {
        s = await getSales();
      }
      setSales(s);
      const ids = [
        ...new Set(s.map((j) => j.customerId).filter(Boolean)),
      ];
      Promise.all(ids.map((id) => getCustomer(id))).then((custs) => {
        const map = {};
        custs.forEach((c) => {
          if (c) map[c.id] = c;
        });
        setCustomers(map);
      });
    }
    fetchSales();
  }, [searchQuery, dateFrom, dateTo]);

  async function handleDelete(sale, e) {
    e.stopPropagation();
    const itemsDesc = sale.items?.map((i) => `${i.quantity}× ${i.productName}`).join(', ') || 'no items';
    const ok = await confirm(
      'Delete Sale',
      `Delete ${sale.receiptNumber}?\n\nItems: ${itemsDesc}\nTotal: ${formatCurrency(sale.totalAmount - (sale.discount || 0))}\n\nStock will be returned to inventory.`
    );
    if (!ok) return;
    await deleteSale(sale.id);
    setSales((prev) => prev.filter((s) => s.id !== sale.id));
    addToast('Sale deleted, stock restored');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
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
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setLastActive('search');
            if (e.target.value.trim()) { setDateFrom(''); setDateTo(''); }
          }}
          placeholder="Search by receipt or customer..."
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setLastActive('date');
            if (e.target.value) { setSearchQuery(''); }
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setLastActive('date');
            if (e.target.value) { setSearchQuery(''); }
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="To date"
        />
        {(searchQuery || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearchQuery(''); setDateFrom(''); setDateTo(''); setLastActive(null); }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        )}
      </div>

      {sales.length === 0 ? (
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
              {sales.map((s) => {
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
