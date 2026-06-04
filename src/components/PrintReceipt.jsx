import { formatCurrency } from '../lib/helpers';

const printStyles = `
  @media print {
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .print-area { padding: 16px !important; }
    body { margin: 0; }
  }
  @page {
    margin: 0;
    size: auto;
  }
`;

export default function PrintReceipt({ shop, type, data }) {
  if (!data) return null;

  const isRepair = type === 'repair';
  const isSale = type === 'sale';

  const s = {
    wrap: {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: '12px',
      lineHeight: '1.5',
      color: '#111',
      background: '#fff',
      maxWidth: '320px',
      margin: '0 auto',
      padding: '20px 16px',
    },
    center: { textAlign: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px dashed #aaa' },
    shopName: { fontSize: '14px', fontWeight: 'bold', margin: '4px 0 2px' },
    sub: { fontSize: '11px', color: '#555', margin: '1px 0' },
    divider: { borderTop: '1px dashed #aaa', margin: '10px 0' },
    row: { display: 'flex', justifyContent: 'space-between', padding: '2px 0' },
    label: { color: '#555' },
    bold: { fontWeight: 'bold' },
    totalRow: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: 'bold', fontSize: '13px' },
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '8px' },
    th: { textAlign: 'left', fontWeight: 'bold', paddingBottom: '4px', borderBottom: '1px solid #ccc', fontSize: '11px' },
    thRight: { textAlign: 'right', fontWeight: 'bold', paddingBottom: '4px', borderBottom: '1px solid #ccc', fontSize: '11px' },
    td: { padding: '3px 0', verticalAlign: 'top', fontSize: '11px' },
    tdRight: { padding: '3px 0', textAlign: 'right', verticalAlign: 'top', fontSize: '11px' },
    tdCenter: { padding: '3px 0', textAlign: 'center', verticalAlign: 'top', fontSize: '11px' },
    metaRow: { display: 'flex', gap: '8px', padding: '2px 0' },
    metaLabel: { color: '#555', minWidth: '52px' },
    footer: { textAlign: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #aaa', fontSize: '11px', color: '#777' },
  };

  return (
    <>
      <style>{printStyles}</style>
      <div className="print-area" style={s.wrap}>

        {/* Header */}
        <div style={s.center}>
          {shop?.shopLogo && (
            <img src={shop.shopLogo} alt="Logo"
              style={{ maxHeight: '44px', maxWidth: '180px', objectFit: 'contain', display: 'block', margin: '0 auto 6px' }} />
          )}
          <p style={s.shopName}>{shop?.shopName || 'Repair Desk'}</p>
          {shop?.shopAddress && <p style={s.sub}>{shop.shopAddress}</p>}
          {shop?.shopPhone && <p style={s.sub}>{shop.shopPhone}</p>}
        </div>

        {/* Receipt number + date */}
        <div style={{ ...s.row, marginBottom: '2px' }}>
          <span>Receipt: <strong>{data.receiptNumber}</strong></span>
          <span style={s.label}>{new Date().toLocaleDateString()}</span>
        </div>

        {/* Customer */}
        {data._customer && (
          <div style={{ marginBottom: '8px' }}>
            <div style={s.divider} />
            <div style={s.metaRow}>
              <span style={s.metaLabel}>Customer:</span>
              <span>{data._customer.name}</span>
            </div>
            {data._customer.phone && (
              <div style={s.metaRow}>
                <span style={s.metaLabel}>Phone:</span>
                <span>{data._customer.phone}</span>
              </div>
            )}
          </div>
        )}

        <div style={s.divider} />

        {/* Repair details */}
        {isRepair && (
          <div style={{ marginBottom: '8px' }}>
            {[
              ['Brand', data.mobileBrand],
              ['Model', data.mobileModel],
              data.imei ? ['IMEI', data.imei] : null,
              ['Problem', data.problemDescription],
              ['Status', data.status],
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} style={s.metaRow}>
                <span style={s.metaLabel}>{label}:</span>
                <span style={{ wordBreak: 'break-word' }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sale items */}
        {isSale && data.items && (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: '44%' }}>Item</th>
                <th style={{ ...s.th, ...s.tdCenter, width: '12%' }}>Qty</th>
                <th style={{ ...s.thRight, width: '22%' }}>Price</th>
                <th style={{ ...s.thRight, width: '22%' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={s.td}>{item.productName}</td>
                  <td style={s.tdCenter}>{item.quantity}</td>
                  <td style={s.tdRight}>{formatCurrency(item.unitPrice)}</td>
                  <td style={s.tdRight}>{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Totals */}
        <div style={s.divider} />
        <div style={{ paddingTop: '4px' }}>
          {isRepair && (
            <>
              <div style={s.row}>
                <span style={s.label}>Estimated Cost</span>
                <span>{formatCurrency(data.estimatedCost)}</span>
              </div>
              {data.finalCost != null && (
                <div style={s.totalRow}>
                  <span>Final Cost</span>
                  <span>{formatCurrency(data.finalCost)}</span>
                </div>
              )}
            </>
          )}
          {isSale && (
            <>
              <div style={s.row}>
                <span style={s.label}>Subtotal</span>
                <span>{formatCurrency(data.totalAmount)}</span>
              </div>
              {data.discount > 0 && (
                <div style={s.row}>
                  <span style={s.label}>Discount</span>
                  <span>−{formatCurrency(data.discount)}</span>
                </div>
              )}
              <div style={s.totalRow}>
                <span>Total</span>
                <span>{formatCurrency(data.totalAmount - (data.discount || 0))}</span>
              </div>
              <div style={s.row}>
                <span style={s.label}>Payment</span>
                <span>{data.paymentMethod}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <p style={{ margin: '0 0 2px' }}>Thank you for your business!</p>
          <p style={{ margin: 0 }}>{new Date().toLocaleString()}</p>
        </div>

      </div>
    </>
  );
}