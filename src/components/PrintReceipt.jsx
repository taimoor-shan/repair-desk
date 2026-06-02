import { formatCurrency } from '../lib/helpers';

export default function PrintReceipt({ shop, type, data }) {
  if (!data) return null;

  const isRepair = type === 'repair';
  const isSale = type === 'sale';

  return (
    <div className="print-area p-6 max-w-md mx-auto bg-white text-black text-sm">
      {/* Shop Header */}
      <div className="text-center mb-4 pb-3 border-b border-dashed border-gray-300">
        {shop?.shopLogo && (
          <img
            src={shop.shopLogo}
            alt="Logo"
            className="h-16 mx-auto mb-2 object-contain"
          />
        )}
        <h2 className="text-base font-bold">
          {shop?.shopName || 'Repair Desk'}
        </h2>
        {shop?.shopAddress && (
          <p className="text-xs text-gray-600">{shop.shopAddress}</p>
        )}
        {shop?.shopPhone && (
          <p className="text-xs text-gray-600">{shop.shopPhone}</p>
        )}
      </div>

      {/* Receipt Info */}
      <div className="text-xs mb-3">
        <span>
          Receipt: <strong>{data.receiptNumber}</strong>
        </span>
      </div>

      {/* Customer Info */}
      {data._customer && (
        <div className="mb-3 text-xs">
          <p>
            <strong>Customer:</strong> {data._customer.name}
          </p>
          {data._customer.phone && <p>Phone: {data._customer.phone}</p>}
        </div>
      )}

      {/* Repair Details */}
      {isRepair && (
        <div className="mb-3">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="font-medium pr-2 py-1 w-16">Brand</td>
                <td>{data.mobileBrand}</td>
              </tr>
              <tr>
                <td className="font-medium pr-2 py-1 w-16">Model</td>
                <td>{data.mobileModel}</td>
              </tr>
              {data.imei && (
                <tr>
                  <td className="font-medium pr-2 py-1 w-16">IMEI</td>
                  <td>{data.imei}</td>
                </tr>
              )}
              <tr>
                <td className="font-medium pr-2 py-1 w-16">Problem</td>
                <td>{data.problemDescription}</td>
              </tr>
              <tr>
                <td className="font-medium pr-2 py-1 w-16">Status</td>
                <td>{data.status}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Sale Items */}
      {isSale && data.items && (
        <div className="mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1">{item.productName}</td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-right py-1">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="text-right py-1">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="border-t border-dashed border-gray-300 pt-2 text-xs">
        {isRepair && (
          <>
            <div className="flex justify-between">
              <span>Estimated Cost:</span>
              <span>{formatCurrency(data.estimatedCost)}</span>
            </div>
            {data.finalCost != null && (
              <div className="flex justify-between font-bold mt-1">
                <span>Final Cost:</span>
                <span>{formatCurrency(data.finalCost)}</span>
              </div>
            )}
          </>
        )}
        {isSale && (
          <>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(data.totalAmount)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>{formatCurrency(data.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base mt-1">
              <span>Total:</span>
              <span>
                {formatCurrency(data.totalAmount - (data.discount || 0))}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Payment:</span>
              <span>{data.paymentMethod}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-300 text-xs text-gray-500">
        <p>Thank you!</p>
        <p>{new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
