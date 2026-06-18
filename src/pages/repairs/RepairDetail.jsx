import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRepairJob, updateRepairJob, deleteRepairJob, getRepairParts, addRepairParts, deleteRepairParts, getCustomer, getSettings } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/helpers';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import StatusBadge from '../../components/StatusBadge';
import RepairPartsPicker from '../../components/RepairPartsPicker';
import PrintReceiptButton from '../../components/PrintReceiptButton';
import WhatsAppButton from '../../components/WhatsAppButton';
import { formatRepairReceiptText } from '../../lib/whatsapp';
import { printReceiptDocument } from '../../lib/printReceipt';

export default function RepairDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToast();
  const confirm = useConfirm();
  const [repair, setRepair] = useState(null);
  const [repairParts, setRepairParts] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [shop, setShop] = useState(null);
  const [laborCost, setLaborCost] = useState('');
  const [extraCost, setExtraCost] = useState('');
  const [extraCostLabel, setExtraCostLabel] = useState('Extra Cost');
  const [editingParts, setEditingParts] = useState(false);
  const [tempParts, setTempParts] = useState([]);

  const partsTotal = repairParts.reduce((s, p) => s + (p.sellingPrice || p.costPrice || 0) * p.quantity, 0);
  const finalCost = (Number(laborCost) || 0) + partsTotal + (Number(extraCost) || 0);

  useEffect(() => {
    getRepairJob(id).then((r) => {
      if (!r) return navigate('/repairs');
      setRepair(r);
      setLaborCost(r.laborCost != null ? String(r.laborCost) : '');
      setExtraCost(r.extraCost != null ? String(r.extraCost) : '');
      setExtraCostLabel(r.extraCostLabel || 'Extra Cost');
      if (r.customerId) {
        getCustomer(r.customerId).then(setCustomer);
      }
    });
    getRepairParts(id).then(setRepairParts);
    getSettings().then(setShop);
  }, [id, navigate]);

  async function updateStatus(status) {
    const updates = { status };
    if (status === 'Delivered') {
      updates.deliveredAt = new Date().toISOString();
      const labor = Number(laborCost) || 0;
      const extra = Number(extraCost) || 0;
      updates.laborCost = labor;
      updates.extraCost = extra;
      updates.extraCostLabel = extraCostLabel;
      updates.finalCost = labor + partsTotal + extra;
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

  async function saveLaborExtra() {
    const labor = Number(laborCost) || 0;
    const extra = Number(extraCost) || 0;
    const total = labor + partsTotal + extra;
    await updateRepairJob(id, { laborCost: labor, extraCost: extra, extraCostLabel, finalCost: total });
    setRepair((prev) => ({ ...prev, laborCost: labor, extraCost: extra, extraCostLabel, finalCost: total }));
    addToast('Costs updated');
  }

  function printReceipt(type, layout = 'a4') {
    printReceiptDocument({
      shop,
      type,
      layout,
      data: { ...repair, _customer: customer, _parts: repairParts },
    });
  }

  async function saveParts() {
    const id = Number(repair.id);

    try {
      await deleteRepairParts(id);
      if (tempParts.length > 0) {
        await addRepairParts(id, tempParts);
      }

      const updatedParts = await getRepairParts(id);
      setRepairParts(updatedParts);
      const newPartsTotal = updatedParts.reduce((s, p) => s + (p.sellingPrice || p.costPrice || 0) * p.quantity, 0);
      const labor = Number(laborCost) || 0;
      const extra = Number(extraCost) || 0;
      const total = labor + newPartsTotal + extra;
      await updateRepairJob(id, { finalCost: total });
      setRepair((prev) => ({ ...prev, finalCost: total }));
      setEditingParts(false);
      setTempParts([]);
      addToast('Parts updated');
    } catch (err) {
      addToast(err.message || 'Unable to update parts', 'error');
    }
  }

  async function handleDelete() {
    const ok = await confirm(
      'Delete Repair',
      `Delete repair "${repair.receiptNumber}"? All parts will be returned to inventory. This cannot be undone.`,
      { confirmLabel: 'Delete', confirmVariant: 'red' }
    );
    if (!ok) return;
    try {
      await deleteRepairJob(id);
      addToast(`Repair "${repair.receiptNumber}" deleted — parts returned to inventory`);
      navigate('/repairs');
    } catch (err) {
      addToast(err.message || 'Unable to delete repair', 'error');
    }
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
      <div className="flex flex-wrap items-center justify-between mb-6 gap-2 flex-wrap gap-4">
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
        <div className="flex items-center gap-2">
          <Link
            to={`/repairs/${repair.id}/edit`}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Edit Details
          </Link>
          <StatusBadge status={repair.status} />
        </div>
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
            {repair.phonePassword && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Phone Password</dt>
                <dd className="font-medium">{repair.phonePassword}</dd>
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

          {repair.status !== 'Pending' && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-gray-500 text-sm">Labor</dt>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-28 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                    placeholder="0"
                    min="0"
                  />
                  <button
                    onClick={saveLaborExtra}
                    className="text-xs text-blue-600 font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={extraCostLabel}
                    onChange={(e) => setExtraCostLabel(e.target.value)}
                    className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-gray-500"
                    placeholder="Extra Cost"
                  />
                  <input
                    type="number"
                    value={extraCost}
                    onChange={(e) => setExtraCost(e.target.value)}
                    className="w-28 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                    placeholder="0"
                    min="0"
                  />
                  <button
                    onClick={saveLaborExtra}
                    className="text-xs text-blue-600 font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <dt className="text-sm font-semibold text-gray-900">Final Cost</dt>
                <dd className="font-bold text-green-700 text-base">
                  {formatCurrency(finalCost)}
                </dd>
              </div>
            </div>
          )}
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

          {/* Parts Used */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Parts Used
            </h3>

            {repair.status === 'Pending' && repairParts.length === 0 && !editingParts && (
              <p className="text-sm text-gray-400 italic">Start repair to add parts.</p>
            )}

            {editingParts ? (
              <div>
                <RepairPartsPicker
                  parts={tempParts}
                  onAdd={(part) => setTempParts((prev) => [...prev, part])}
                  onUpdate={(productId, field, value) =>
                    setTempParts((prev) =>
                      prev.map((p) =>
                        p.productId === productId ? { ...p, [field]: value } : p
                      )
                    )
                  }
                  onRemove={(productId) =>
                    setTempParts((prev) => prev.filter((p) => p.productId !== productId))
                  }
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={saveParts}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Save Parts
                  </button>
                  <button
                    onClick={() => { setEditingParts(false); setTempParts([]); }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {repairParts.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {repairParts.map((part) => (
                      <div key={part.id} className="flex justify-between">
                        <span className="text-gray-600">
                          {part.productName} × {part.quantity}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency((part.sellingPrice || part.costPrice || 0) * part.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-gray-900">
                      <span>Parts Cost</span>
                      <span>
                        {formatCurrency(
                          repairParts.reduce(
                            (s, p) => s + (p.sellingPrice || p.costPrice || 0) * p.quantity,
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  repair.status !== 'Pending' && (
                    <p className="text-sm text-gray-400 italic">No parts added yet.</p>
                  )
                )}

                {repair.status !== 'Pending' && (
                  <button
                    onClick={() => {
                      setTempParts([...repairParts]);
                      setEditingParts(true);
                    }}
                    className="mt-3 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    {repairParts.length > 0 ? 'Edit Parts' : 'Add Parts'}
                  </button>
                )}

                {repair.status === 'Pending' && (
                  <p className="mt-2 text-xs text-gray-400">Parts can be added after starting the repair.</p>
                )}
              </>
            )}
          </div>

          {/* Delete Repair */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Deleting this repair will return all used parts to inventory. This cannot be undone.
            </p>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Delete Repair
            </button>
          </div>

          {/* Print Receipts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Receipts
            </h3>
            <div className="space-y-2">
              {repair.status === 'Pending' && (
                <PrintReceiptButton
                  label="Print Initial Receipt (2 Copies, A4)"
                  variant="muted"
                  fullWidth
                  onPrint={(layout) => printReceipt('initial', layout)}
                />
              )}
              {repair.status === 'Delivered' && (
                <PrintReceiptButton
                  label="Print Final Receipt (2 Copies, A4)"
                  variant="success"
                  fullWidth
                  onPrint={(layout) => printReceipt('final', layout)}
                />
              )}

              {(repair.status === 'Pending' || repair.status === 'Delivered') && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-xs text-gray-400 mb-2">Share via WhatsApp</p>
                  <div className="flex gap-2">
                    {repair.status === 'Pending' && (
                      <WhatsAppButton
                        phone={customer?.phone}
                        text={formatRepairReceiptText(shop, repair, customer, repairParts, 'initial')}
                        label="Initial"
                        variant="solid"
                        className="flex-1"
                      />
                    )}
                    {repair.status === 'Delivered' && (
                      <WhatsAppButton
                        phone={customer?.phone}
                        text={formatRepairReceiptText(shop, repair, customer, repairParts, 'final')}
                        label="Final"
                        variant="outline"
                        className="flex-1"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
