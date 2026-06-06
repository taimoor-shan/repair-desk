import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addRepairJob, addDevice, updateDevice, getDeviceByIMEI, getCustomer } from '../../lib/api';
import { generateRepairNumber } from '../../lib/receiptNumber';
import { useToast } from '../../context/ToastContext';
import CustomerPicker from '../../components/CustomerPicker';
import DevicePicker from '../../components/DevicePicker';

const initial = {
  customerId: null,
  mobileBrand: '',
  mobileModel: '',
  imei: '',
  color: '',
  phonePassword: '',
  problemDescription: '',
  repairNotes: '',
};

export default function RepairForm() {
  const navigate = useNavigate();
  const addToast = useToast();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [imeiWarning, setImeiWarning] = useState(null);

  function validate() {
    const e = {};
    if (!form.mobileBrand.trim()) e.mobileBrand = 'Brand is required';
    if (!form.mobileModel.trim()) e.mobileModel = 'Model is required';
    if (!form.problemDescription.trim())
      e.problemDescription = 'Problem description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleIMEIBlur() {
    setImeiWarning(null);
    const imei = form.imei.trim();
    if (!imei) return;

    const device = await getDeviceByIMEI(imei);
    if (!device) return;

    if (device.customerId === form.customerId) {
      setSelectedDevice(device);
      setForm((prev) => ({
        ...prev,
        mobileBrand: device.brand,
        mobileModel: device.model,
        imei: device.imei || prev.imei,
        color: device.color || '',
      }));
    } else {
      const other = await getCustomer(device.customerId);
      setImeiWarning({
        customerName: other?.name || 'another customer',
        customerId: device.customerId,
      });
    }
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;

    // Upsert device
    let deviceId = null;
    if (selectedDevice) {
      deviceId = selectedDevice.id;
      if (selectedDevice.customerId !== form.customerId) {
        await updateDevice(selectedDevice.id, { customerId: form.customerId });
      }
    } else if (form.mobileBrand.trim() || form.mobileModel.trim()) {
      const newDevice = await addDevice({
        customerId: form.customerId,
        brand: form.mobileBrand.trim(),
        model: form.mobileModel.trim(),
        imei: form.imei.trim() || null,
        color: form.color.trim() || null,
      });
      deviceId = newDevice.id;
    }

    const receiptNumber = await generateRepairNumber();
    const repairJobId = await addRepairJob({
      ...form,
      customerId: form.customerId ? Number(form.customerId) : null,
      deviceId,
      estimatedCost: 0,
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
              onChange={(id) => {
                update('customerId', id);
                setSelectedDevice(null);
                setImeiWarning(null);
              }}
            />
          </div>

          {form.customerId && (
            <DevicePicker
              customerId={form.customerId}
              selectedDevice={selectedDevice}
              onDeviceSelect={(device) => {
                setSelectedDevice(device);
                if (device) {
                  setForm((prev) => ({
                    ...prev,
                    mobileBrand: device.brand,
                    mobileModel: device.model,
                    imei: device.imei || '',
                    color: device.color || '',
                  }));
                } else {
                  setForm((prev) => ({
                    ...prev,
                    mobileBrand: '',
                    mobileModel: '',
                    imei: '',
                    color: '',
                  }));
                }
              }}
            />
          )}

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IMEI
              </label>
              <input
                type="text"
                value={form.imei}
                onChange={(e) => {
                  update('imei', e.target.value);
                  setImeiWarning(null);
                }}
                onBlur={handleIMEIBlur}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {imeiWarning && (
                <p className="mt-1 text-xs text-red-600">
                  This IMEI is registered under {imeiWarning.customerName}.{' '}
                  <Link
                    to={`/customers/${imeiWarning.customerId}`}
                    className="underline font-medium"
                  >
                    View record
                  </Link>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => update('color', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Password
            </label>
            <input
              type="text"
              value={form.phonePassword}
              onChange={(e) => update('phonePassword', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 1234"
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
