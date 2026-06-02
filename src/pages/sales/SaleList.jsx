import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSales, getCustomer } from '../../db/db';
import { formatDate, formatCurrency } from '../../lib/helpers';
import EmptyState from '../../components/EmptyState';

export default function SaleList() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState({});

  useEffect(() => {
    getSales().then((s) => {
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
    });
  }, []);

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
