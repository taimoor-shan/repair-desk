import { formatCurrency } from '../lib/helpers';

const labelClass = 'font-medium pr-3 py-1.5 w-20 text-gray-600 align-top';

export default function PrintReceipt({ shop, type, data }) {
  if (!data) return null;

  const isRepair = type === 'repair';
  const isSale = type === 'sale';

  return (
    <div className="print-area p-6 max-w-md mx-auto bg-white text-black text-sm leading-relaxed">
      {/* Shop Header */}
      <div className="text-center mb-5 pb-4 border-b border-dashed border-gray-300">
        {shop?.shopLogo && (
          <img
            src={shop.shopLogo}
            alt="Logo"
            style={{ maxHeight: '48px', maxWidth: '200px', objectFit: 'contain' }}
            className="mx-auto mb-3"
          />
        )}
        <h2 className="text-base font-bold">
          {shop?.shopName || 'Repair Desk'}
        </h2>
        {shop?.shopAddress && (
          <p className="text-xs text-gray-600 mt-0.5">{shop.shopAddress}</p>
        )}
        {shop?.shopPhone && (
          <p className="text-xs text-gray-600">{shop.shopPhone}</p>
        )}
      </div>

      {/* Receipt Info */}
      <div className="text-xs mb-4">
        <span>
          Receipt: <strong>{data.receiptNumber}</strong>
        </span>
      </div>

      {/* Customer Info */}
      {data._customer && (
        <div className="mb-4 text-xs space-y-0.5">
          <p>
            <strong>Customer:</strong> {data._customer.name}
          </p>
          {data._customer.phone && (
            <p>
              <strong>Phone:</strong> {data._customer.phone}
            </p>
          )}
        </div>
      )}

      {/* Repair Details */}
      {isRepair && (
        <div className="mb-4">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className={labelClass}>Brand</td>
                <td className="py-1.5">{data.mobileBrand}</td>
              </tr>
              <tr>
                <td className={labelClass}>Model</td>
                <td className="py-1.5">{data.mobileModel}</td>
              </tr>
              {data.imei && (
                <tr>
                  <td className={labelClass}>IMEI</td>
                  <td className="py-1.5 break-all">{data.imei}</td>
                </tr>
              )}
              <tr>
                <td className={labelClass}>Problem</td>
                <td className="py-1.5">{data.problemDescription}</td>
              </tr>
              <tr>
                <td className={labelClass}>Status</td>
                <td className="py-1.5">{data.status}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Sale Items */}
      {isSale && data.items && (
        <div className="mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1.5">Item</th>
                <th className="text-center py-1.5">Qty</th>
                <th className="text-right py-1.5">Price</th>
                <th className="text-right py-1.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1.5">{item.productName}</td>
                  <td className="text-center py-1.5">{item.quantity}</td>
                  <td className="text-right py-1.5">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="text-right py-1.5">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="border-t border-dashed border-gray-300 pt-3 space-y-2 text-xs">
        {isRepair && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Cost</span>
              <span className="font-medium">
                {formatCurrency(data.estimatedCost)}
              </span>
            </div>
            {data.finalCost != null && (
              <div className="flex justify-between font-bold text-sm">
                <span>Final Cost</span>
                <span>{formatCurrency(data.finalCost)}</span>
              </div>
            )}
          </>
        )}
        {isSale && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(data.totalAmount)}
              </span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="text-red-600">
                  −{formatCurrency(data.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1">
              <span>Total</span>
              <span>
                {formatCurrency(data.totalAmount - (data.discount || 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment</span>
              <span className="font-medium">{data.paymentMethod}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-5 pt-3 border-t border-dashed border-gray-300 text-xs text-gray-400">
        <p className="mb-0.5">Thank you!</p>
        <p>{new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
