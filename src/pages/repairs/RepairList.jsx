import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRepairJobs, getCustomer } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/helpers';
import useSmartSearch from '../../hooks/useSmartSearch';
import SearchDropdown from '../../components/SearchDropdown';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function RepairList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Prefetch all repairs via smart search hook
  const { query, setQuery, results: repairs, isLoading } = useSmartSearch(
    getRepairJobs,
    ['receiptNumber', 'mobileBrand', 'mobileModel', 'imei', 'problemDescription'],
    300
  );

  // Load customer map whenever repairs change
  useEffect(() => {
    const ids = [...new Set(repairs.map((j) => j.customerId).filter(Boolean))];
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
  }, [repairs]);

  // Apply search - combine hook's prefix-first results with customer name search
  const searchFiltered = query.trim()
    ? repairs.filter((r) => {
        const q = query.toLowerCase().trim();
        const cust = customers[r.customerId];
        return (
          (r.receiptNumber || '').toLowerCase().includes(q) ||
          (r.mobileBrand || '').toLowerCase().includes(q) ||
          (r.mobileModel || '').toLowerCase().includes(q) ||
          (r.imei || '').toLowerCase().includes(q) ||
          (r.problemDescription || '').toLowerCase().includes(q) ||
          (cust?.name || '').toLowerCase().includes(q) ||
          (cust?.phone || '').toLowerCase().includes(q)
        );
      })
    : repairs;

  // Apply date range filter
  const dateFiltered = (dateFrom && dateTo)
    ? searchFiltered.filter((r) => {
        const d = (r.receivedAt || '').slice(0, 10);
        return d >= dateFrom && d <= dateTo;
      }).sort((a, b) =>
        (b.receivedAt || '').localeCompare(a.receivedAt || '')
      )
    : searchFiltered;

  // Apply status filter
  const filtered =
    statusFilter === 'All'
      ? dateFiltered
      : dateFiltered.filter((r) => r.status === statusFilter);

  const statuses = ['All', 'Pending', 'InProgress', 'Ready', 'Delivered'];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Repairs</h2>
        <Link
          to="/repairs/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + New Repair
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
              setShowDropdown(true);
              if (e.target.value.trim()) { setDateFrom(''); setDateTo(''); }
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by receipt, customer, IMEI, device..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query.length > 0 && (
            <span className="text-xs text-gray-500 mt-1 inline-block">
              {filtered.length} repair{filtered.length !== 1 ? 's' : ''} match
            </span>
          )}
          {showDropdown && query.length > 0 && (
            <SearchDropdown
              results={filtered}
              isLoading={isLoading}
              emptyMessage="No repairs found"
              maxItems={8}
              onClose={() => setShowDropdown(false)}
              onSelect={(r) => {
                setShowDropdown(false);
                navigate(`/repairs/${r.id}`);
              }}
              renderItem={(r) => {
                const cust = customers[r.customerId];
                return (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-blue-600">{r.receiptNumber || '—'}</span>
                    <span className="text-gray-600">
                      {cust?.name || 'Walk-in'} — {r.mobileBrand} {r.mobileModel}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                );
              }}
            />
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

      {/* Status Filter */}
      <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-1 mb-6">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s === 'InProgress' ? 'In Progress' : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading repairs...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No repairs found"
          description={
            statusFilter !== 'All'
              ? `No repairs with status "${statusFilter}".`
              : 'Create your first repair job.'
          }
          action={
            statusFilter === 'All' ? (
              <Link
                to="/repairs/new"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                + New Repair
              </Link>
            ) : null
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
                  Device
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const cust = customers[r.customerId];
                return (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/repairs/${r.id}`)}
                  >
                    <td className="px-4 py-3 text-blue-600 font-medium">
                      {r.receiptNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {cust?.name || 'Walk-in'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.mobileBrand} {r.mobileModel}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(r.finalCost || r.estimatedCost)}
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
