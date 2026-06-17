import ReactDOM from 'react-dom/client';
import PrintReceipt from '../components/PrintReceipt';

const STACKED_STYLES = `
  @page { size: A4 portrait; margin: 8mm; }

  body {
    margin: 0;
    padding: 0;
  }

  /* ── Screen preview: show one copy ── */
  @media screen {
    .stacked-wrapper {
      display: block;
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
    }

    .stacked-copy {
      width: 100%;
    }

    .stacked-copy .print-area--stacked {
      max-width: 100% !important;
    }

    .stacked-divider {
      display: none;
    }

    .stacked-copy:last-child {
      display: none;
    }

    .stacked-label {
      display: none;
    }
  }

  /* ── Print: stacked vertical with horizontal tear line ── */
  @media print {
    .stacked-wrapper {
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }

    .stacked-copy {
      width: 100%;
      page-break-inside: avoid;
    }

    .stacked-divider {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 20px 0;
      user-select: none;
    }

    .stacked-divider::before,
    .stacked-divider::after {
      content: '';
      flex: 1;
      border-top: 1px dashed #999;
    }

    .stacked-scissors {
      font-size: 20px;
      color: #999;
    }

    .stacked-label {
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px dashed #ccc;
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
      STACKED_STYLES +
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
        <div className="stacked-wrapper">
          <div className="stacked-copy">
            <div className="stacked-label">Customer Copy</div>
            <PrintReceipt shop={shop} type={type} data={data} layout="stacked" />
          </div>
          <div className="stacked-divider">
            <span className="stacked-scissors">✂</span>
          </div>
          <div className="stacked-copy">
            <div className="stacked-label">Shop Copy</div>
            <PrintReceipt shop={shop} type={type} data={data} layout="stacked" />
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
