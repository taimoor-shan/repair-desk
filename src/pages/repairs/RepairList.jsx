import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRepairJobs, getCustomer } from '../../db/db';
import { formatDate, formatCurrency } from '../../lib/helpers';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function RepairList() {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState([]);
  const [customers, setCustomers] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    getRepairJobs().then((jobs) => {
      setRepairs(jobs);
      const ids = [...new Set(jobs.map((j) => j.customerId).filter(Boolean))];
      Promise.all(ids.map((id) => getCustomer(id))).then((custs) => {
        const map = {};
        custs.forEach((c) => {
          if (c) map[c.id] = c;
        });
        setCustomers(map);
      });
    });
  }, []);

  const statuses = ['All', 'Pending', 'InProgress', 'Ready', 'Delivered'];
  const filtered =
    statusFilter === 'All'
      ? repairs
      : repairs.filter((r) => r.status === statusFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Repairs</h2>
        <Link
          to="/repairs/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + New Repair
        </Link>
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

      {filtered.length === 0 ? (
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
