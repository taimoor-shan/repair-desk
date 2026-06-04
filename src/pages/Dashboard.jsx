import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, getProducts, getRepairJobs, getSales } from '../lib/api';
import { formatCurrency, todayRange, monthRange } from '../lib/helpers';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [allRepairs, setAllRepairs] = useState([]);

  useEffect(() => {
    getCustomers().then(setCustomers);
    getProducts().then(setProducts);
    getSales().then(setAllSales);
    getRepairJobs().then(setAllRepairs);
  }, []);

  const today = todayRange();
  const month = monthRange();

  // Today's revenue: sales + delivered repairs with final cost
  const todaySales = allSales.filter(
    (s) => s.createdAt >= today.start && s.createdAt < today.end
  );
  const todaySalesTotal = todaySales.reduce(
    (sum, s) => sum + (s.totalAmount - (s.discount || 0)),
    0
  );
  const todayDeliveredRepairs = allRepairs.filter(
    (r) =>
      r.status === 'Delivered' &&
      r.finalCost != null &&
      r.deliveredAt >= today.start &&
      r.deliveredAt < today.end
  );
  const todayRepairTotal = todayDeliveredRepairs.reduce(
    (sum, r) => sum + (r.finalCost || 0),
    0
  );
  const todayTotal = todaySalesTotal + todayRepairTotal;

  // Monthly revenue: sales + delivered repairs
  const monthSales = allSales.filter(
    (s) => s.createdAt >= month.start && s.createdAt < month.end
  );
  const monthSalesRevenue = monthSales.reduce(
    (sum, s) => sum + (s.totalAmount - (s.discount || 0)),
    0
  );
  const monthDeliveredRepairs = allRepairs.filter(
    (r) =>
      r.status === 'Delivered' &&
      r.finalCost != null &&
      r.deliveredAt >= month.start &&
      r.deliveredAt < month.end
  );
  const monthRepairRevenue = monthDeliveredRepairs.reduce(
    (sum, r) => sum + (r.finalCost || 0),
    0
  );
  const monthRevenue = monthSalesRevenue + monthRepairRevenue;

  // Pending + In-Progress repairs
  const pendingRepairs = allRepairs.filter(
    (r) => r.status === 'Pending' || r.status === 'InProgress'
  );

  // Low stock
  const lowStock = products.filter(
    (p) => p.stock <= (p.lowStockThreshold || 5)
  );

  // Recent 5 sales + repairs
  const recentSales = [...allSales]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5);
  const recentRepairs = [...allRepairs]
    .sort((a, b) => (b.receivedAt || '').localeCompare(a.receivedAt || ''))
    .slice(0, 5);

  // Resolve customer names
  const customerMap = {};
  customers.forEach((c) => {
    customerMap[c.id] = c;
  });

  const todayTxCount =
    todaySales.length + todayDeliveredRepairs.length;
  const monthTxCount =
    monthSales.length + monthDeliveredRepairs.length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Today's Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(todayTotal)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {todaySales.length} sale{todaySales.length !== 1 ? 's' : ''}
            {todaySales.length > 0 && todayDeliveredRepairs.length > 0 && ' + '}
            {todayDeliveredRepairs.length > 0 &&
              `${todayDeliveredRepairs.length} repair${todayDeliveredRepairs.length !== 1 ? 's' : ''}`}
            {todayTxCount === 0 && ' No activity today'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Pending Repairs</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {pendingRepairs.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Active jobs</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Monthly Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(monthRevenue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {monthTxCount} transaction{monthTxCount !== 1 ? 's' : ''}
            {monthTxCount === 0 && ' this month'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {lowStock.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {lowStock.length > 0 ? 'Needs restock' : 'All stocked'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Recent Sales
            </h3>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View all
            </button>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No sales yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentSales.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
                  onClick={() => navigate(`/sales/${s.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {s.receiptNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {customerMap[s.customerId]?.name || 'Walk-in'}
                      {' · '}
                      {s.paymentMethod}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(s.totalAmount - (s.discount || 0))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Repairs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Recent Repairs
            </h3>
            <button
              onClick={() => navigate('/repairs')}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View all
            </button>
          </div>
          {recentRepairs.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No repairs yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentRepairs.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
                  onClick={() => navigate(`/repairs/${r.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {r.mobileBrand} {r.mobileModel}
                    </p>
                    <p className="text-xs text-gray-500">
                      {customerMap[r.customerId]?.name || 'Walk-in'}
                      {' · '}
                      {r.receiptNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.finalCost != null && (
                      <span className="text-xs font-medium text-green-700">
                        {formatCurrency(r.finalCost)}
                      </span>
                    )}
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-red-800 mb-3">
            Low Stock Alert
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStock.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-white/60 rounded-sm cursor-pointer hover:bg-white bg-red-50 rounded-xl border border-red-200 px-4 py-2 hover:shadow-md"
                onClick={() => navigate(`/inventory/${p.id}/edit`)}
              >
                <span className="text-sm text-gray-900">{p.name}</span>
                <span className="text-sm font-bold text-red-600">
                  {p.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
