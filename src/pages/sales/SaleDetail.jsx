import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSale, getCustomer, getSettings, deleteSale } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/helpers';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import PrintReceipt from '../../components/PrintReceipt';
import WhatsAppButton from '../../components/WhatsAppButton';
import { formatSaleReceiptText } from '../../lib/whatsapp';
import ReactDOM from 'react-dom/client';

export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [shop, setShop] = useState(null);
  const confirm = useConfirm();
  const addToast = useToast();

  async function handleDelete() {
    const itemsDesc = sale?.items?.map((i) => `${i.quantity}× ${i.productName}`).join(', ') || 'no items';
    const ok = await confirm(
      'Delete Sale',
      `Delete ${sale.receiptNumber}?\n\nItems: ${itemsDesc}\nTotal: ${formatCurrency((sale.totalAmount || 0) - (sale.discount || 0))}\n\nStock will be returned to inventory.`
    );
    if (!ok) return;
    await deleteSale(sale.id);
    addToast('Sale deleted, stock restored');
    navigate('/sales');
  }

  useEffect(() => {
    getSale(id).then((s) => {
      if (!s) return navigate('/sales');
      setSale(s);
      if (s.customerId) {
        getCustomer(s.customerId).then(setCustomer);
      }
    });
    getSettings().then(setShop);
  }, [id, navigate]);

  function handlePrint() {
    if (!sale) return;
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
        type="sale"
        data={{ ...sale, _customer: customer }}
      />
    );

    setTimeout(() => {
      win.print();
    }, 300);
  }

  if (!sale) return null;

  const total = sale.totalAmount - (sale.discount || 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/sales"
            className="text-sm text-blue-600 hover:text-blue-800 mb-1 inline-block"
          >
            ← Back to Sales
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            Sale {sale.receiptNumber}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/sales/${sale.id}/edit`}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
          >
            Delete
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Print Receipt
          </button>
          <WhatsAppButton
            phone={customer?.phone}
            text={formatSaleReceiptText(shop, sale, customer)}
            label="WhatsApp"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sale Details
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Date</dt>
              <dd className="font-medium">{formatDate(sale.createdAt)}</dd>
            </div>
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
              <dt className="text-gray-500">Payment Method</dt>
              <dd className="font-medium">{sale.paymentMethod}</dd>
            </div>
          </dl>

          {/* Items */}
          <div className="mt-4 pt-4 border-t border-gray-100 overflow-x-auto">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
            <table className="w-full text-sm min-w-[360px]">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-1 font-normal">Item</th>
                  <th className="py-1 font-normal text-center">Qty</th>
                  <th className="py-1 font-normal text-right">Price</th>
                  <th className="py-1 font-normal text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1.5">{item.productName}</td>
                    <td className="py-1.5 text-center">{item.quantity}</td>
                    <td className="py-1.5 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-1.5 text-right font-medium">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Summary
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-medium">
                {formatCurrency(sale.totalAmount)}
              </dd>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Discount</dt>
                <dd className="font-medium text-red-600">
                  −{formatCurrency(sale.discount)}
                </dd>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold">{formatCurrency(total)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
