import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getCustomers, deleteCustomer, getRepairJobsByCustomer, getSalesByCustomer } from '../../lib/api';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import useSmartSearch from '../../hooks/useSmartSearch';
import SearchDropdown from '../../components/SearchDropdown';
import EmptyState from '../../components/EmptyState';

export default function CustomerList() {
  const [showDropdown, setShowDropdown] = useState(false);
  const confirm = useConfirm();
  const addToast = useToast();

  const { query, setQuery, results, isLoading, refetch } = useSmartSearch(
    getCustomers,
    ['name', 'phone'],
    300
  );

  const customers = results;

  async function handleDelete(customer) {
    try {
      const [repairs, sales] = await Promise.all([
        getRepairJobsByCustomer(customer.id),
        getSalesByCustomer(customer.id),
      ]);

      const parts = [`Delete "${customer.name}"?`];
      if (repairs.length > 0 || sales.length > 0) {
        parts.push(
          `This customer has ${repairs.length} repair${repairs.length !== 1 ? 's' : ''} and ${sales.length} sale${sales.length !== 1 ? 's' : ''}. These records will be kept but marked as Walk-in.`
        );
      }
      parts.push('This cannot be undone.');

      const ok = await confirm('Delete Customer', parts.join(' '));
      if (!ok) return;

      await deleteCustomer(customer.id);
      refetch();
      addToast(`"${customer.name}" deleted`);
    } catch (err) {
      addToast(err.message || 'Unable to delete customer', 'error');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <Link
          to="/customers/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + Add Customer
        </Link>
      </div>

      <div className="mb-4 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search by name or phone..."
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {query.length > 0 && (
          <span className="ml-3 text-xs text-gray-500">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} match
          </span>
        )}
        {showDropdown && query.length > 0 && (
          <div className="max-w-md">
            <SearchDropdown
              results={customers}
              isLoading={isLoading}
              emptyMessage="No customers found"
              maxItems={8}
              onClose={() => setShowDropdown(false)}
              onSelect={(c) => {
                setShowDropdown(false);
                window.location.href = `#/customers/${c.id}`;
              }}
              renderItem={(c) => (
                <>
                  <span className="font-medium">{c.name}</span>
                  {c.phone && (
                    <span className="text-gray-500 ml-2">{c.phone}</span>
                  )}
                </>
              )}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading customers...
          </div>
        </div>
      ) : customers.length === 0 ? (
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
