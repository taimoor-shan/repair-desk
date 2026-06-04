import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRepairJob, updateRepairJob, getCustomer, getSettings } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/helpers';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import StatusBadge from '../../components/StatusBadge';
import PrintReceipt from '../../components/PrintReceipt';
import ReactDOM from 'react-dom/client';

export default function RepairDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToast();
  const confirm = useConfirm();
  const [repair, setRepair] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [shop, setShop] = useState(null);
  const [editingCost, setEditingCost] = useState(false);
  const [finalCost, setFinalCost] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    getRepairJob(id).then((r) => {
      if (!r) return navigate('/repairs');
      setRepair(r);
      setFinalCost(r.finalCost != null ? String(r.finalCost) : '');
      if (r.customerId) {
        getCustomer(r.customerId).then(setCustomer);
      }
    });
    getSettings().then(setShop);
  }, [id, navigate]);

  async function updateStatus(status) {
    const updates = { status };
    if (status === 'Delivered') {
      updates.deliveredAt = new Date().toISOString();
    }
    await updateRepairJob(id, updates);
    setRepair((prev) => ({ ...prev, ...updates }));
    addToast(`Status updated to ${status}`);
  }

  async function handleStatusChange(status) {
    const labels = {
      InProgress: 'In Progress',
      Ready: 'Ready',
      Delivered: 'Delivered',
    };
    const ok = await confirm(
      'Update Status',
      `Mark this repair as "${labels[status] || status}"?`,
      { confirmLabel: 'Confirm', confirmVariant: 'blue' }
    );
    if (!ok) return;
    updateStatus(status);
  }

  async function saveFinalCost() {
    const cost = Number(finalCost) || 0;
    await updateRepairJob(id, { finalCost: cost });
    setRepair((prev) => ({ ...prev, finalCost: cost }));
    setEditingCost(false);
    addToast('Final cost updated');
  }

  function printReceipt(type) {
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    const doc = win.document;
    doc.write(
      '<!DOCTYPE html><html><head><title>Receipt</title><style>' +
        'body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }' +
        '@media print { body { margin: 0; padding: 0; } }' +
        '</style></head><body><div id="print-root"></div></body></html>'
    );
    doc.close();

    const root = ReactDOM.createRoot(doc.getElementById('print-root'));
    root.render(
      <PrintReceipt
        shop={shop}
        type="repair"
        data={{ ...repair, _customer: customer }}
      />
    );

    setTimeout(() => {
      win.print();
    }, 300);
  }

  if (!repair) return null;

  const nextStatus =
    repair.status === 'Pending'
      ? 'InProgress'
      : repair.status === 'InProgress'
      ? 'Ready'
      : repair.status === 'Ready'
      ? 'Delivered'
      : null;

  const nextLabel =
    repair.status === 'Pending'
      ? 'Start Repair'
      : repair.status === 'InProgress'
      ? 'Mark Ready'
      : repair.status === 'Ready'
      ? 'Mark Delivered'
      : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/repairs"
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            ← Back to Repairs
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            Repair {repair.receiptNumber}
          </h2>
        </div>
        <StatusBadge status={repair.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repair Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Repair Details
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Customer</dt>
              <dd className="font-medium">
                {customer ? (
                  <Link
                    to={`/customers/${customer.id}`}
                    className="text-blue-600"
                  >
                    {customer.name}
                  </Link>
                ) : (
                  'Walk-in'
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Device</dt>
              <dd className="font-medium">
                {repair.mobileBrand} {repair.mobileModel}
              </dd>
            </div>
            {repair.imei && (
              <div className="flex justify-between">
                <dt className="text-gray-500">IMEI</dt>
                <dd className="font-medium">{repair.imei}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Received</dt>
              <dd>{formatDate(repair.receivedAt)}</dd>
            </div>
            {repair.deliveredAt && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Delivered</dt>
                <dd>{formatDate(repair.deliveredAt)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Problem</h4>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {repair.problemDescription}
            </p>
          </div>

          {repair.repairNotes && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Repair Notes
              </h4>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {repair.repairNotes}
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <dt className="text-gray-500 text-sm">Estimated Cost</dt>
              <dd className="font-medium">
                {formatCurrency(repair.estimatedCost)}
              </dd>
            </div>

            <div className="flex justify-between items-center mt-3">
              <dt className="text-gray-500 text-sm">Final Cost</dt>
              {editingCost ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={finalCost}
                    onChange={(e) => setFinalCost(e.target.value)}
                    className="w-28 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                    autoFocus
                  />
                  <button
                    onClick={saveFinalCost}
                    className="text-xs text-blue-600 font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingCost(false);
                      setFinalCost(
                        repair.finalCost != null
                          ? String(repair.finalCost)
                          : ''
                      );
                    }}
                    className="text-xs text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : repair.finalCost != null ? (
                <dd
                  className="font-bold text-green-700 cursor-pointer hover:underline"
                  onClick={() => setEditingCost(true)}
                >
                  {formatCurrency(repair.finalCost)}
                </dd>
              ) : (
                <button
                  onClick={() => setEditingCost(true)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  + Set Final Cost
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Status Update */}
          {nextStatus && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Update Status
              </h3>
              <button
                onClick={() => handleStatusChange(nextStatus)}
                className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                {nextLabel}
              </button>
              {repair.status === 'Pending' && (
                <p className="mt-2 text-xs text-gray-400 text-center">
                  Status will change: Pending → In Progress → Ready →
                  Delivered
                </p>
              )}
            </div>
          )}

          {/* Print Receipts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Print Receipts
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => printReceipt('initial')}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Print Initial Receipt (Job Received)
              </button>
              {repair.status === 'Delivered' && (
                <button
                  onClick={() => printReceipt('final')}
                  className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-green-50 rounded-lg hover:bg-green-100"
                >
                  Print Final Receipt (Delivery + Payment)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden print view for inline printing */}
      <div className="hidden">
        <div ref={printRef}>
          <PrintReceipt
            shop={shop}
            type="repair"
            data={{ ...repair, _customer: customer }}
          />
        </div>
      </div>
    </div>
  );
}
