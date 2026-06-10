import ReactDOM from 'react-dom/client';
import PrintReceipt from '../components/PrintReceipt';

const TWO_UP_STYLES = `
  @page { size: A4 portrait; margin: 8mm; }

  body {
    margin: 0;
    padding: 0;
  }

  /* ── Screen preview: show one full receipt ── */
  @media screen {
    .two-up-wrapper {
      display: block;
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
    }

    .two-up-copy {
      width: 100%;
      font-size: 100%;
      overflow: visible;
    }

    .two-up-copy .print-area--a4 {
      max-width: 100% !important;
      font-size: inherit !important;
    }

    .two-up-divider {
      display: none;
    }

    .two-up-copy:last-child {
      display: none;
    }

    .two-up-label {
      display: none;
    }
  }

  /* ── Print: two-up portrait layout ── */
  @media print {
    .two-up-wrapper {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
      gap: 0;
      height: 100%;
      padding: 0;
    }

    .two-up-copy {
      width: 48%;
      font-size: 85%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .two-up-copy .print-area--a4 {
      max-width: 100% !important;
      font-size: inherit !important;
    }

    .two-up-divider {
      width: 4%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .two-up-divider::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      border-left: 1px dashed #999;
    }

    .two-up-scissors {
      transform: rotate(90deg);
      font-size: 16px;
      color: #999;
      z-index: 1;
      background: white;
      padding: 4px 2px;
      user-select: none;
    }

    .two-up-label {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px dashed #ccc;
      width: 100%;
      letter-spacing: 0.5px;
    }
  }
`;

export function printReceiptDocument({ shop, type, data, layout = 'a4' }) {
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return false;

  const doc = win.document;
  doc.write(
    '<!DOCTYPE html><html><head><title>Receipt</title><meta charset="utf-8"><style>' +
      'body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }' +
      TWO_UP_STYLES +
      '</style></head><body><div id="print-root"></div></body></html>'
  );
  doc.close();

  const root = ReactDOM.createRoot(doc.getElementById('print-root'));

  if (layout === 'thermal') {
    root.render(
      <PrintReceipt shop={shop} type={type} data={data} layout={layout} />
    );
  } else {
    root.render(
      <>
        <div className="two-up-wrapper">
          <div className="two-up-copy">
            <div className="two-up-label">Customer Copy</div>
            <PrintReceipt shop={shop} type={type} data={data} layout="a4" />
          </div>
          <div className="two-up-divider">
            <span className="two-up-scissors">✂</span>
          </div>
          <div className="two-up-copy">
            <div className="two-up-label">Shop Copy</div>
            <PrintReceipt shop={shop} type={type} data={data} layout="a4" />
          </div>
        </div>
        {/* Trailing style to override PrintReceipt's own @page rules */}
        <style>{`@page { size: A4 portrait; margin: 8mm; }`}</style>
      </>
    );
  }

  setTimeout(() => {
    win.print();
  }, 300);

  return true;
}
