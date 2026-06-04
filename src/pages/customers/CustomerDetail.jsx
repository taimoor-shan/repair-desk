import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getCustomer,
  getRepairJobsByCustomer,
  getSalesByCustomer,
} from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/helpers';
import StatusBadge from '../../components/StatusBadge';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    getCustomer(id).then((c) => {
      if (!c) return navigate('/customers');
      setCustomer(c);
    });
    getRepairJobsByCustomer(id).then(setRepairs);
    getSalesByCustomer(id).then(setSales);
  }, [id, navigate]);

  if (!customer) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/customers"
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            ← Back to Customers
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
        </div>
        <Link
          to={`/customers/${id}/edit`}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Edit
        </Link>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {customer.phone && (
            <div>
              <span className="text-gray-500">Phone:</span>{' '}
              <span className="font-medium">{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div>
              <span className="text-gray-500">Email:</span>{' '}
              <span className="font-medium">{customer.email}</span>
            </div>
          )}
          {customer.address && (
            <div>
              <span className="text-gray-500">Address:</span>{' '}
              <span className="font-medium">{customer.address}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Customer since:</span>{' '}
            <span className="font-medium">
              {formatDate(customer.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Repair History */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Repair History ({repairs.length})
        </h3>
        {repairs.length === 0 ? (
          <p className="text-sm text-gray-500">No repairs yet.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Receipt
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Device
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {repairs.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/repairs/${r.id}`)}
                  >
                    <td className="px-4 py-2 text-blue-600">
                      {r.receiptNumber || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-900">
                      {r.mobileBrand} {r.mobileModel}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(r.finalCost || r.estimatedCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Sales History ({sales.length})
        </h3>
        {sales.length === 0 ? (
          <p className="text-sm text-gray-500">No sales yet.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Receipt
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Type
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/sales/${s.id}`)}
                  >
                    <td className="px-4 py-2 text-blue-600">
                      {s.receiptNumber || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-gray-900">{s.saleType}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(
                        s.totalAmount - (s.discount || 0)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
