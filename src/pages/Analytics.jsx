import { useState, useEffect } from 'react';
import { getAnalyticsData, addExpense, updateExpense, deleteExpense } from '../lib/api';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../lib/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#f97316', '#ef4444', '#22c55e', '#a855f7', '#eab308'];

const expenseCats = ['Rent', 'Utilities', 'Tools', 'Salary', 'Other'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function weekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function monthStart() {
  return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
}

export default function Analytics() {
  const [range, setRange] = useState('month');
  const [customStart, setCustomStart] = useState(monthStart());
  const [customEnd, setCustomEnd] = useState(todayStr());
  const [data, setData] = useState(null);

  // Expense modal
  const [expModal, setExpModal] = useState(null); // null | { id, category, amount, note, date }
  const confirm = useConfirm();
  const addToast = useToast();

  const rangeStart = range === 'today' ? todayStr() : range === 'week' ? weekStart() : customStart;
  const rangeEnd = range === 'today' ? todayStr() : range === 'week' ? todayStr() : customEnd;

  useEffect(() => {
    getAnalyticsData(rangeStart, rangeEnd).then(setData);
  }, [rangeStart, rangeEnd]);

  function openAddExpense() {
    setExpModal({
      category: 'Rent',
      amount: '',
      note: '',
      date: todayStr(),
    });
  }

  function openEditExpense(exp) {
    setExpModal({
      id: exp.id,
      category: exp.category,
      amount: String(exp.amount),
      note: exp.note || '',
      date: exp.date,
    });
  }

  async function handleDeleteExpense(exp) {
    const ok = await confirm(
      'Delete Expense',
      `Delete ${formatCurrency(exp.amount)} expense?`
    );
    if (!ok) return;
    await deleteExpense(exp.id);
    getAnalyticsData(rangeStart, rangeEnd).then(setData);
    addToast('Expense deleted');
  }

  async function handleSaveExpense(e) {
    e.preventDefault();
    const payload = {
      category: expModal.category,
      amount: Number(expModal.amount) || 0,
      note: expModal.note || null,
      date: expModal.date,
    };

    if (expModal.id) {
      await updateExpense(expModal.id, payload);
    } else {
      await addExpense(payload);
    }
    setExpModal(null);
    getAnalyticsData(rangeStart, rangeEnd).then(setData);
    addToast(expModal.id ? 'Expense updated' : 'Expense added');
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const pieData = Object.entries(data.expenses.byCategory).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>

      {/* Date Range */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 mb-6">
        {[
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
        ].map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              range === r.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {r.label}
          </button>
        ))}
        <span className="text-gray-300 mx-1">|</span>
        <input
          type="date"
          value={customStart}
          onChange={(e) => { setCustomStart(e.target.value); setRange('custom'); }}
          className="border border-gray-300 rounded px-2 py-1 text-xs"
        />
        <span className="text-gray-400 text-xs">to</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => { setCustomEnd(e.target.value); setRange('custom'); }}
          className="border border-gray-300 rounded px-2 py-1 text-xs"
        />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: data.revenue.total, sub: `Sales: ${formatCurrency(data.revenue.sales)} · Repairs: ${formatCurrency(data.revenue.repairs)}` },
          { label: 'Total COGS', value: data.cogs.total, sub: `Sales: ${formatCurrency(data.cogs.sales)} · Parts: ${formatCurrency(data.cogs.repairs)}` },
          { label: 'Gross Profit', value: data.grossProfit, sub: 'Revenue − COGS', color: data.grossProfit >= 0 ? 'text-green-700' : 'text-red-700' },
          { label: 'Net Profit', value: data.netProfit, sub: `− Expenses: ${formatCurrency(data.expenses.total)}`, color: data.netProfit >= 0 ? 'text-green-700' : 'text-red-700' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color || 'text-gray-900'}`}>
              {formatCurrency(card.value)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Revenue Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Sales</span><span className="font-medium">{formatCurrency(data.revenue.sales)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Repairs</span><span className="font-medium">{formatCurrency(data.revenue.repairs)}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">COGS Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Sales COGS</span><span className="font-medium">{formatCurrency(data.cogs.sales)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Repair Parts</span><span className="font-medium">{formatCurrency(data.cogs.repairs)}</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Operating Expenses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.expenses.total)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Stock Cash Outflow</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.stockCashFlow)}</p>
          <p className="text-xs text-gray-400 mt-1">Not included in P&L</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Revenue vs COGS vs Expenses (Daily)
          </h3>
          {data.charts.daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.charts.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Bar dataKey="cogs" fill="#f97316" name="COGS" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No data for selected range</p>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Expenses by Category
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No expenses</p>
          )}
        </div>
      </div>

      {/* Monthly Trend Line Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Monthly Trend (Last 6 Months)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.charts.monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" strokeWidth={2} />
            <Line type="monotone" dataKey="cogs" stroke="#f97316" name="COGS" strokeWidth={2} />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Repair Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Repair Stats</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">Top 5 Problems</p>
              {data.repairStats.topProblems.length > 0 ? (
                <div className="space-y-1">
                  {data.repairStats.topProblems.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700 truncate max-w-[70%]">{p.problem}</span>
                      <span className="font-medium text-gray-900">{p.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No data</p>
              )}
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">Avg Final Cost</span>
              <span className="font-bold">{formatCurrency(data.repairStats.avgFinalCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Avg Turnaround</span>
              <span className="font-bold">{data.repairStats.avgTurnaroundHours}h</span>
            </div>
          </div>
        </div>

        {/* Sales Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Sales Stats</h3>
          <div>
            <p className="text-xs text-gray-500 mb-2">Top 5 Products Sold</p>
            {data.salesStats.topProducts.length > 0 ? (
              <div className="space-y-2">
                {data.salesStats.topProducts.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate max-w-[50%]">{p.name}</span>
                    <span className="text-gray-500">×{p.qty}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No sales data</p>
            )}
          </div>
        </div>
      </div>

      {/* Expense Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Operating Expenses</h3>
          <button
            onClick={openAddExpense}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            + Add Expense
          </button>
        </div>

        {data.expenses.log.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No expenses recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Note</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Amount</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600" />
                </tr>
              </thead>
              <tbody>
                {data.expenses.log.map((e) => (
                  <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-600">{e.date}</td>
                    <td className="px-4 py-2 text-gray-900">{e.category}</td>
                    <td className="px-4 py-2 text-gray-500">{e.note || '—'}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditExpense(e)}
                          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(e)}
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
      </div>

      {/* Expense Modal */}
      {expModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {expModal.id ? 'Edit Expense' : 'Add Expense'}
            </h3>
            <form onSubmit={handleSaveExpense} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={expModal.date}
                  onChange={(e) => setExpModal({ ...expModal, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={expModal.category}
                  onChange={(e) => setExpModal({ ...expModal, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {expenseCats.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  value={expModal.amount}
                  onChange={(e) => setExpModal({ ...expModal, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input
                  type="text"
                  value={expModal.note}
                  onChange={(e) => setExpModal({ ...expModal, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExpModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {expModal.id ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
