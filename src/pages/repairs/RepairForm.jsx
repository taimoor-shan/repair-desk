import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addRepairJob } from '../../db/db';
import { generateRepairNumber } from '../../lib/receiptNumber';
import { useToast } from '../../context/ToastContext';
import CustomerPicker from '../../components/CustomerPicker';

const initial = {
  customerId: null,
  mobileBrand: '',
  mobileModel: '',
  imei: '',
  problemDescription: '',
  repairNotes: '',
  estimatedCost: '',
};

export default function RepairForm() {
  const navigate = useNavigate();
  const addToast = useToast();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.mobileBrand.trim()) e.mobileBrand = 'Brand is required';
    if (!form.mobileModel.trim()) e.mobileModel = 'Model is required';
    if (!form.problemDescription.trim())
      e.problemDescription = 'Problem description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;

    const receiptNumber = await generateRepairNumber();
    await addRepairJob({
      ...form,
      customerId: form.customerId ? Number(form.customerId) : null,
      estimatedCost: Number(form.estimatedCost) || 0,
      finalCost: null,
      status: 'Pending',
      receivedAt: new Date().toISOString(),
      deliveredAt: null,
      receiptNumber,
    });

    addToast('Repair job created');
    navigate('/repairs');
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">New Repair</h2>
      <div className="max-w-lg bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <CustomerPicker
              value={form.customerId}
              onChange={(id) => update('customerId', id)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Brand *
              </label>
              <input
                type="text"
                value={form.mobileBrand}
                onChange={(e) => update('mobileBrand', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.mobileBrand ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g. Samsung"
              />
              {errors.mobileBrand && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.mobileBrand}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                value={form.mobileModel}
                onChange={(e) => update('mobileModel', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.mobileModel ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g. Galaxy S24"
              />
              {errors.mobileModel && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.mobileModel}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IMEI
            </label>
            <input
              type="text"
              value={form.imei}
              onChange={(e) => update('imei', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Problem Description *
            </label>
            <textarea
              value={form.problemDescription}
              onChange={(e) => update('problemDescription', e.target.value)}
              rows={3}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.problemDescription
                  ? 'border-red-300'
                  : 'border-gray-300'
              }`}
            />
            {errors.problemDescription && (
              <p className="mt-1 text-xs text-red-600">
                {errors.problemDescription}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repair Notes
            </label>
            <textarea
              value={form.repairNotes}
              onChange={(e) => update('repairNotes', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Cost
            </label>
            <input
              type="number"
              value={form.estimatedCost}
              onChange={(e) => update('estimatedCost', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Create Repair
            </button>
            <button
              type="button"
              onClick={() => navigate('/repairs')}
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
