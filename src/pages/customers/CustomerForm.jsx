import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getCustomer,
  addCustomer,
  updateCustomer,
  getCustomerByPhone,
} from '../../db/db';
import { useToast } from '../../context/ToastContext';

const initial = {
  name: '',
  phone: '',
  address: '',
  email: '',
};

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToast();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [dupPhoneId, setDupPhoneId] = useState(null);

  useEffect(() => {
    if (id) {
      getCustomer(id).then((c) => {
        if (c) {
          setForm({
            name: c.name || '',
            phone: c.phone || '',
            address: c.address || '',
            email: c.email || '',
          });
        } else {
          navigate('/customers');
        }
      });
    }
  }, [id, navigate]);

  async function checkDuplicatePhone(phone) {
    if (!phone.trim()) return;
    const existing = await getCustomerByPhone(phone.trim());
    if (existing && String(existing.id) !== id) {
      setDupPhoneId(existing.id);
      return true;
    }
    setDupPhoneId(null);
    return false;
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Customer name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;

    const isDup = await checkDuplicatePhone(form.phone);
    if (isDup) return;

    const data = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      email: form.email.trim(),
    };

    if (isEdit) {
      await updateCustomer(id, data);
      addToast('Customer updated');
    } else {
      await addCustomer(data);
      addToast('Customer added');
    }
    navigate('/customers');
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === 'phone') setDupPhoneId(null);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Customer' : 'Add Customer'}
      </h2>
      <div className="max-w-lg bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              onBlur={() => checkDuplicatePhone(form.phone)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone || dupPhoneId ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
            {dupPhoneId && (
              <p className="mt-1 text-xs text-red-600">
                A customer with this number already exists —{' '}
                <Link
                  to={`/customers/${dupPhoneId}`}
                  className="underline font-medium"
                >
                  view their record
                </Link>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              {isEdit ? 'Update Customer' : 'Add Customer'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
