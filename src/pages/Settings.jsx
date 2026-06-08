import { useState, useEffect, useRef } from 'react';
import { getSettings, updateSettings } from '../lib/api';
import { setCurrency } from '../lib/helpers';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { exportJSON, importJSON } from '../lib/backup';

export default function Settings() {
  const [form, setForm] = useState({
    shopName: '',
    shopPhone: '',
    shopAddress: '',
    shopLogo: '',
    shopHours: '',
    currency: 'EUR',
  });
  const { signOut } = useAuth();
  const addToast = useToast();
  const confirm = useConfirm();
  const fileRef = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    getSettings().then((s) =>
      setForm({
        shopName: s.shopName || '',
        shopPhone: s.shopPhone || '',
        shopAddress: s.shopAddress || '',
        shopLogo: s.shopLogo || '',
        shopHours: s.shopHours || '',
        currency: s.currency || 'EUR',
      })
    );
  }, []);

  function handleSave(e) {
    e.preventDefault();
    updateSettings(form).then(() => {
      setCurrency(form.currency);
      addToast('Settings saved');
    });
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, shopLogo: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveLogo() {
    setForm((prev) => ({ ...prev, shopLogo: '' }));
  }

  async function handleExport() {
    try {
      await exportJSON();
      addToast('Backup exported');
    } catch {
      addToast('Export failed', 'error');
    }
  }

  async function handleImport(file) {
    const ok = await confirm(
      'Import Data',
      'This will overwrite ALL current data with the backup file. Continue?',
      { confirmLabel: 'Overwrite', confirmVariant: 'red' }
    );
    if (!ok) return;

    try {
      await importJSON(file);
      const s = await getSettings();
      setCurrency(s.currency || 'EUR');
      setForm({
        shopName: s.shopName || '',
        shopPhone: s.shopPhone || '',
        shopAddress: s.shopAddress || '',
        shopLogo: s.shopLogo || '',
        shopHours: s.shopHours || '',
        currency: s.currency || 'EUR',
      });
      addToast('Data imported successfully');
    } catch {
      addToast('Import failed — invalid file', 'error');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      {/* Shop Info */}
      <div className="max-w-lg bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Shop Information
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Logo
            </label>
            <div className="flex items-center gap-4">
              {form.shopLogo ? (
                <div className="relative">
                  <img
                    src={form.shopLogo}
                    alt="Shop logo"
                    style={{ maxHeight: '64px', maxWidth: '200px', objectFit: 'contain' }}
                    className="border border-gray-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center">
                  No logo
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {form.shopLogo ? 'Change Logo' : 'Upload Logo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">
                  PNG or SVG
                </p>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/png,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Name
            </label>
            <input
              type="text"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Phone
            </label>
            <input
              type="text"
              value={form.shopPhone}
              onChange={(e) => setForm({ ...form, shopPhone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Address
            </label>
            <textarea
              value={form.shopAddress}
              onChange={(e) =>
                setForm({ ...form, shopAddress: e.target.value })
              }
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opening Hours
            </label>
            <input
              type="text"
              value={form.shopHours}
              onChange={(e) => setForm({ ...form, shopHours: e.target.value })}
              placeholder="e.g. Mon–Sat 9:00 AM – 7:00 PM"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EUR">EUR — Euro</option>
              <option value="PKR">PKR — Pakistani Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="INR">INR — Indian Rupee</option>
              <option value="AED">AED — UAE Dirham</option>
              <option value="SAR">SAR — Saudi Riyal</option>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="AUD">AUD — Australian Dollar</option>
              <option value="JPY">JPY — Japanese Yen</option>
              <option value="CNY">CNY — Chinese Yuan</option>
              <option value="KRW">KRW — South Korean Won</option>
              <option value="MYR">MYR — Malaysian Ringgit</option>
              <option value="SGD">SGD — Singapore Dollar</option>
              <option value="LKR">LKR — Sri Lankan Rupee</option>
              <option value="BDT">BDT — Bangladeshi Taka</option>
              <option value="NPR">NPR — Nepalese Rupee</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Save Settings
          </button>
        </form>
      </div>

      {/* Backup & Restore */}
      <div className="max-w-lg bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Backup & Restore
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Export all your data as a JSON file. Use this as a backup before
          clearing browser data.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
          >
            Export Backup
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Import Backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Logout */}
      <div className="max-w-lg bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Account
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Sign out of your account. You'll need to sign in again to access the
          app.
        </p>
        <button
          onClick={() => {
            signOut();
            addToast('Signed out');
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
