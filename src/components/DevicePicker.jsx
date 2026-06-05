import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDevicesByCustomer, getRepairJobs } from '../lib/api';
import { formatDate } from '../lib/helpers';

export default function DevicePicker({ customerId, onDeviceSelect, selectedDevice }) {
  const [devices, setDevices] = useState([]);
  const [repairHistory, setRepairHistory] = useState(null);

  useEffect(() => {
    if (!customerId) {
      setDevices([]);
      setRepairHistory(null);
      return;
    }
    getDevicesByCustomer(customerId).then(setDevices);
  }, [customerId]);

  async function handleSelect(device) {
    onDeviceSelect(device);

    // Build repair history banner
    if (device) {
      const jobs = await getRepairJobs();
      const deviceJobs = jobs.filter((j) => j.deviceId === device.id);
      if (deviceJobs.length > 0) {
        const lastJob = deviceJobs[0];
        setRepairHistory({
          count: deviceJobs.length,
          lastDate: lastJob.receivedAt,
          lastProblem: lastJob.problemDescription?.slice(0, 60),
        });
      } else {
        setRepairHistory(null);
      }
    } else {
      setRepairHistory(null);
    }
  }

  if (!customerId) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Device
      </label>
      <select
        value={selectedDevice?.id || ''}
        onChange={(e) => {
          const id = e.target.value;
          if (!id) {
            handleSelect(null);
          } else {
            const device = devices.find((d) => d.id === Number(id));
            handleSelect(device || null);
          }
        }}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">＋ New device</option>
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {d.brand} {d.model}{d.imei ? ` — ${d.imei}` : ' — No IMEI'}
          </option>
        ))}
      </select>

      {repairHistory && (
        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800">
          This device has been repaired{' '}
          <strong>{repairHistory.count}</strong> time(s). Last visit:{' '}
          {formatDate(repairHistory.lastDate)} — {repairHistory.lastProblem}
        </div>
      )}
    </div>
  );
}
