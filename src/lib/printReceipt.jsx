import ReactDOM from 'react-dom/client';
import PrintReceipt from '../components/PrintReceipt';

export function printReceiptDocument({ shop, type, data, layout = 'a4' }) {
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return false;

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
    <PrintReceipt shop={shop} type={type} data={data} layout={layout} />
  );

  setTimeout(() => {
    win.print();
  }, 300);

  return true;
}
