import { formatCurrency } from '../lib/helpers';

function getPrintStyles(layout) {
  const isA4 = layout === 'a4';
  const isStacked = layout === 'stacked';

  return `
    @media print {
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { margin: 0; }
    }
    @page {
      margin: ${isStacked ? '6mm' : isA4 ? '15mm' : '0'};
      size: ${isStacked || isA4 ? 'A4' : 'auto'};
    }
    @media print {
      .print-area--thermal {
        padding: 16px !important;
        max-width: 320px !important;
        margin: 0 auto !important;
      }
      .print-area--a4 {
        max-width: none !important;
        width: 100% !important;
        padding: 0 !important;
        font-size: 14px !important;
      }
      .print-area--a4 .receipt-shop-name { font-size: 20px !important; }
      .print-area--a4 .receipt-sub { font-size: 13px !important; }
      .print-area--a4 .receipt-sm { font-size: 13px !important; }
      .print-area--a4 .receipt-total { font-size: 15px !important; }
      .print-area--a4 .receipt-footer { font-size: 13px !important; }
      .print-area--a4 .receipt-terms { font-size: 11px !important; }
      .print-area--a4 .receipt-logo {
        max-height: 60px !important;
        max-width: 200px !important;
      }
      .print-area--a4 .receipt-meta-label { min-width: 72px !important; }

      /* Stacked two-column layout — tighter sizes */
      .print-area--stacked {
        max-width: none !important;
        width: 100% !important;
        padding: 0 !important;
        font-size: 13px !important;
      }
      .print-area--stacked .receipt-shop-name { font-size: 17px !important; }
      .print-area--stacked .receipt-sub { font-size: 12px !important; }
      .print-area--stacked .receipt-sm { font-size: 12px !important; }
      .print-area--stacked .receipt-total { font-size: 16px !important; }
      .print-area--stacked .receipt-footer { font-size: 12px !important; }
      .print-area--stacked .receipt-terms { font-size: 11px !important; }
      .print-area--stacked .receipt-logo {
        max-height: 64px !important;
        max-width: 160px !important;
      }
      .print-area--stacked .receipt-meta-label { min-width: 62px !important; }
    }
  `;
}

export default function PrintReceipt({ shop, type, data, layout = 'a4', showTerms = true }) {
  if (!data) return null;

  const isRepair = type === 'repair' || type === 'initial' || type === 'final';
  const isSale = type === 'sale';
  const isFinal = type === 'final';
  const isStacked = layout === 'stacked';
  const tableDense = isStacked && data.items?.length > 5;

  const s = {
    wrap: {
      fontFamily: "'Roboto', sans-serif",
      fontSize: '12px',
      lineHeight: '1.5',
      color: '#000',
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

  const wrapStyle = isStacked
    ? { ...s.wrap, maxWidth: '100%', padding: '12px 18px', fontSize: '13px', lineHeight: '1.35' }
    : s.wrap;

  const stackedS = isStacked ? {
    shopName: { ...s.shopName, fontSize: '17px', margin: '2px 0 2px' },
    sub: { ...s.sub, fontSize: '12px' },
    divider: { borderTop: '1px dashed #aaa', margin: '6px 0' },
    row: { ...s.row, padding: '2px 0' },
    totalRow: { ...s.totalRow, padding: '2px 0', fontSize: '16px' },
    th: { ...s.th, paddingBottom: '2px', fontSize: '12px' },
    thRight: { ...s.thRight, paddingBottom: '2px', fontSize: '12px' },
    td: { ...s.td, padding: '2px 0', fontSize: tableDense ? '11px' : '12px' },
    tdRight: { ...s.tdRight, padding: '2px 0', fontSize: tableDense ? '11px' : '12px' },
    tdCenter: { ...s.tdCenter, padding: '2px 0', fontSize: tableDense ? '11px' : '12px' },
    metaRow: { ...s.metaRow, gap: '10px', padding: '1px 0' },
    metaLabel: { ...s.metaLabel, minWidth: '60px' },
    footer: { ...s.footer, marginTop: '6px', paddingTop: '4px', fontSize: '11px' },
    table: { ...s.table, marginBottom: '4px' },
  } : {};

  // ── Stacked two-column grid layout ──
  if (isStacked) {
    return (
      <>
        <style>{getPrintStyles(layout)}</style>
        <div className={`print-area print-area--${layout}`} style={wrapStyle}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'auto auto auto',
            rowGap: '10px',
            columnGap: '18px',
          }}>
            {/* ── LEFT COLUMN: header*/}
            <div style={{ gridColumn: '1', gridRow: '1' }}>
              {/* Shop header */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'start',
                marginBottom: '8px',
                paddingBottom: '6px',
                borderBottom: '1px dashed #aaa',
              }}>
                {shop?.shopLogo && (
                  <div style={{ flexShrink: 0 }}>
                    <img
                      src={shop.shopLogo}
                      alt="Logo"
                      className="receipt-logo"
                      style={{ maxHeight: '64px', objectFit: 'contain' }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p className="receipt-shop-name" style={stackedS.shopName}>{shop?.shopName || 'Repair Desk'}</p>
                  {shop?.shopAddress && <p className="receipt-sub" style={stackedS.sub}>{shop.shopAddress}</p>}
                  {shop?.shopPhone && <p className="receipt-sub" style={stackedS.sub}>{shop.shopPhone}</p>}
                  {shop?.shopHours && <p className="receipt-sub" style={stackedS.sub}>{shop.shopHours}</p>}
                </div>
                
              </div>
            </div>

            {/* ── RIGHT COLUMN: repair/sale details + receipt# + customer ──  + totals ── */}
            <div style={{ gridColumn: '2', gridRow: '1' }}>
                    {/* Receipt number + date */}
              <div style={{ ...stackedS.row, marginBottom: '4px' }}>
                <span>Receipt: <strong>{data.receiptNumber}</strong></span>
                <span style={s.label}>{new Date().toLocaleDateString()}</span>
              </div>

              {/* Customer */}
              {data._customer && (
                <div style={{ marginBottom: '4px' }}>
                  {/* <div style={stackedS.divider} /> */}
                  <div style={stackedS.metaRow}>
                    <span className="receipt-meta-label" style={stackedS.metaLabel}>Customer:</span>
                    <span>{data._customer.name}</span>
                  </div>
                  {data._customer.phone && (
                    <div style={stackedS.metaRow}>
                      <span className="receipt-meta-label" style={stackedS.metaLabel}>Phone:</span>
                      <span>{data._customer.phone}</span>
                    </div>
                  )}
                </div>
              )}
              {/* Repair details */}
              {isRepair && (
                <div style={{ marginBottom: '6px' }}>
                  {[
                    ['Brand', data.mobileBrand],
                    ['Model', data.mobileModel],
                    data.imei ? ['IMEI', data.imei] : null,
                    ['Problem', data.problemDescription],
                    ['Status', data.status],
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label} style={stackedS.metaRow}>
                      <span className="receipt-meta-label" style={stackedS.metaLabel}>{label}:</span>
                      <span style={{ wordBreak: 'break-word' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sale items table */}
              {isSale && data.items && (
                <table style={stackedS.table}>
                  <thead>
                    <tr>
                      <th className="receipt-sm" style={{ ...stackedS.th, width: '44%' }}>Item</th>
                      <th className="receipt-sm" style={{ ...stackedS.th, ...stackedS.tdCenter, width: '12%' }}>Qty</th>
                      <th className="receipt-sm" style={{ ...stackedS.thRight, width: '22%' }}>Price</th>
                      <th className="receipt-sm" style={{ ...stackedS.thRight, width: '22%' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td className="receipt-sm" style={stackedS.td}>{item.productName}</td>
                        <td className="receipt-sm" style={stackedS.tdCenter}>{item.quantity}</td>
                        <td className="receipt-sm" style={stackedS.tdRight}>{formatCurrency(item.unitPrice)}</td>
                        <td className="receipt-sm" style={stackedS.tdRight}>{formatCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Totals */}
              <div style={stackedS.divider} />
              <div style={{ paddingTop: '4px' }}>
                {isRepair && isFinal && (
                  <>
                    {data.laborCost > 0 && (
                      <div style={stackedS.row}>
                        <span style={s.label}>Labor</span>
                        <span>{formatCurrency(data.laborCost)}</span>
                      </div>
                    )}
                    {data.extraCost > 0 && (
                      <div style={stackedS.row}>
                        <span style={s.label}>{data.extraCostLabel || 'Extra Cost'}</span>
                        <span>{formatCurrency(data.extraCost)}</span>
                      </div>
                    )}
                    {data.finalCost != null && (
                      <div className="receipt-total" style={stackedS.totalRow}>
                        <span>Final Cost</span>
                        <span>{formatCurrency(data.finalCost)}</span>
                      </div>
                    )}
                  </>
                )}
                {isSale && (
                  <>
                    <div style={stackedS.row}>
                      <span style={s.label}>Subtotal</span>
                      <span>{formatCurrency(data.totalAmount)}</span>
                    </div>
                    {data.discount > 0 && (
                      <div style={stackedS.row}>
                        <span style={s.label}>Discount</span>
                        <span>−{formatCurrency(data.discount)}</span>
                      </div>
                    )}
                    <div className="receipt-total" style={stackedS.totalRow}>
                      <span>Total</span>
                      <span>{formatCurrency(data.totalAmount - (data.discount || 0))}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── TERMS & CONDITIONS (full width, split two columns) ── */}
            {showTerms && (
            <div style={{
              gridColumn: '1 / 3',
              gridRow: '2',
              borderTop: '1px dashed #aaa',
              marginTop: '6px',
              paddingTop: '8px',
            }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 8px', textAlign: 'start', fontSize: '11px' }}>TERMS AND CONDITIONS</p>
              <ol style={{
                margin: 0,
                paddingLeft: '14px',
                columnCount: 2,
                columnGap: '18px',
                fontSize: '10px',
                lineHeight: '1.55',
                color: '#555',
              }}>
                <li>All phones to be tested and paid for at collection</li>
                <li>We are not responsible for the loss of ANY data</li>
                <li>It is the owner's responsibility to remove SIM and memory cards; we are not responsible for loss or damage</li>
                <li>No warranty provided on LCDs or Touch if it has marks, scratches or cracks</li>
                <li>We will only repair the fault booked in for</li>
                <li>Devices to be collected within 90 days of booking. Devices left longer than 90 days will become property of Sigma Mobiles to recover costs</li>
                <li>Please ask us for our T&Cs</li>
              </ol>
            </div>
            )}

            {/* ── FOOTER (full width) ── */}
            <div className="receipt-footer" style={{
              gridColumn: '1 / 3',
              gridRow: '3',
              ...stackedS.footer,
            }}>
              <p style={{ margin: '0 0 1px' }}>Thank you for your business!</p>
              <p style={{ margin: 0 }}>{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Original single-column layout (thermal / a4) ──
  return (
    <>
      <style>{getPrintStyles(layout)}</style>
      <div className={`print-area print-area--${layout}`} style={s.wrap}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection:'column', alignItems: 'start', marginBottom: '12px', paddingBottom: '10px', gap: '16px' }}>
            {shop?.shopLogo && (
            <div style={{ flexShrink: 0 }}>
              <img
                src={shop.shopLogo}
                alt="Logo"
                className="receipt-logo"
                style={{ maxHeight: '46px', objectFit: 'contain' }}
              />
            </div>
          )}
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p className="receipt-shop-name" style={s.shopName}>{shop?.shopName || 'Repair Desk'}</p>
            {shop?.shopAddress && <p className="receipt-sub" style={s.sub}>{shop.shopAddress}</p>}
            {shop?.shopPhone && <p className="receipt-sub" style={s.sub}>{shop.shopPhone}</p>}
            {shop?.shopHours && <p className="receipt-sub" style={s.sub}>{shop.shopHours}</p>}
          </div>
        
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
              <span className="receipt-meta-label" style={s.metaLabel}>Customer:</span>
              <span>{data._customer.name}</span>
            </div>
            {data._customer.phone && (
              <div style={s.metaRow}>
                <span className="receipt-meta-label" style={s.metaLabel}>Phone:</span>
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
                <span className="receipt-meta-label" style={s.metaLabel}>{label}:</span>
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
                <th className="receipt-sm" style={{ ...s.th, width: '44%' }}>Item</th>
                <th className="receipt-sm" style={{ ...s.th, ...s.tdCenter, width: '12%' }}>Qty</th>
                <th className="receipt-sm" style={{ ...s.thRight, width: '22%' }}>Price</th>
                <th className="receipt-sm" style={{ ...s.thRight, width: '22%' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td className="receipt-sm" style={s.td}>{item.productName}</td>
                  <td className="receipt-sm" style={s.tdCenter}>{item.quantity}</td>
                  <td className="receipt-sm" style={s.tdRight}>{formatCurrency(item.unitPrice)}</td>
                  <td className="receipt-sm" style={s.tdRight}>{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Totals */}
        <div style={s.divider} />
        <div style={{ paddingTop: '4px' }}>
          {isRepair && isFinal && (
            <>
              {data.laborCost > 0 && (
                <div style={s.row}>
                  <span style={s.label}>Labor</span>
                  <span>{formatCurrency(data.laborCost)}</span>
                </div>
              )}
              {data.extraCost > 0 && (
                <div style={s.row}>
                  <span style={s.label}>{data.extraCostLabel || 'Extra Cost'}</span>
                  <span>{formatCurrency(data.extraCost)}</span>
                </div>
              )}
              {data.finalCost != null && (
                <div className="receipt-total" style={s.totalRow}>
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
              <div className="receipt-total" style={s.totalRow}>
                <span>Total</span>
                <span>{formatCurrency(data.totalAmount - (data.discount || 0))}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="receipt-footer" style={s.footer}>
          <p style={{ margin: '0 0 2px' }}>Thank you for your business!</p>
          <p style={{ margin: 0 }}>{new Date().toLocaleString()}</p>
        </div>

        {/* Terms & Conditions */}
        {showTerms && (
        <div className="receipt-footer receipt-terms" style={{ ...s.footer, fontSize: '9px', color: '#555', textAlign: 'left', lineHeight: '1.4' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px', textAlign: 'center' }}>TERMS AND CONDITIONS</p>
          <ol style={{ margin: 0, paddingLeft: '14px' }}>
            <li>All phones to be tested and paid for at collection</li>
            <li>We are not responsible for the loss of ANY data</li>
            <li>It is the owner's responsibility to remove SIM and memory cards; we are not responsible for loss or damage</li>
            <li>No warranty provided on LCDs or Touch if it has marks, scratches or cracks</li>
            <li>We will only repair the fault booked in for</li>
            <li>Devices to be collected within 90 days of booking. Devices left longer than 90 days will become property of Sigma Mobiles to recover costs</li>
            <li>Please ask us for our T&Cs</li>
          </ol>
        </div>
        )}

      </div>
    </>
  );
}
