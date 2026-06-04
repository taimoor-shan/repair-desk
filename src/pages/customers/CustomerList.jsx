import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCustomers, searchCustomers, deleteCustomer } from '../../lib/api';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');
  const confirm = useConfirm();
  const addToast = useToast();

  useEffect(() => {
    if (query.trim()) {
      searchCustomers(query).then(setCustomers);
    } else {
      getCustomers().then(setCustomers);
    }
  }, [query]);

  async function handleDelete(customer) {
    const ok = await confirm(
      'Delete Customer',
      `Delete "${customer.name}"? This cannot be undone.`
    );
    if (!ok) return;
    await deleteCustomer(customer.id);
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    addToast(`"${customer.name}" deleted`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <Link
          to="/customers/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + Add Customer
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer to get started."
          action={
            <Link
              to="/customers/new"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              + Add Customer
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Phone
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                  Address
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/customers/${c.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {c.name}
                    </Link>
                    {c.email && (
                      <p className="text-xs text-gray-400">{c.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.phone || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                    {c.address || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/customers/${c.id}`}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        View
                      </Link>
                      <Link
                        to={`/customers/${c.id}/edit`}
                        className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(c)}
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
  );
}
