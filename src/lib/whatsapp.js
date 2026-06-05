import { formatCurrency } from './helpers';

const termsText = [
  'TERMS AND CONDITIONS',
  '1) All phones to be tested and paid for at collection',
  '2) We are not responsible for the loss of ANY data',
  "3) It is the owner's responsibility to remove SIM and memory cards; we are not responsible for loss or damage",
  '4) No warranty provided on LCDs or Touch if it has marks, scratches or cracks',
  '5) We will only repair the fault booked in for',
  '6) Devices to be collected within 90 days of booking. Devices left longer than 90 days will become property of Sigma Mobiles to recover costs',
  '7) Please ask us for our T&Cs',
].join('\n');

export function buildWhatsAppUrl(phone, text) {
  let digits = phone.replace(/\D/g, '');

  // Normalize Pakistani numbers: 03XX... → 923XX...
  if (digits.startsWith('0')) {
    digits = '92' + digits.slice(1);
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function formatRepairReceiptText(shop, repair, customer, parts) {
  const lines = [
    `*${shop?.shopName || 'Repair Desk'}*`,
    shop?.shopAddress,
    shop?.shopPhone && `Tel: ${shop.shopPhone}`,
    '',
    `Receipt: ${repair.receiptNumber}`,
    `Date: ${new Date().toLocaleDateString()}`,
    '',
    customer ? `Customer: ${customer.name}` : 'Customer: Walk-in',
    customer?.phone && `Phone: ${customer.phone}`,
    '',
    '--- REPAIR DETAILS ---',
    `Brand: ${repair.mobileBrand}`,
    `Model: ${repair.mobileModel}`,
    repair.imei && `IMEI: ${repair.imei}`,
    `Problem: ${repair.problemDescription}`,
    `Status: ${repair.status}`,
    '',
    `Estimated Cost: ${formatCurrency(repair.estimatedCost)}`,
    repair.finalCost != null && `Final Cost: ${formatCurrency(repair.finalCost)}`,
  ];

  if (parts && parts.length > 0) {
    lines.push('');
    lines.push('--- PARTS USED ---');
    parts.forEach((part) => {
      lines.push(`${part.productName}  x${part.quantity}  ${formatCurrency((part.costPrice || 0) * part.quantity)}`);
    });
    const partsTotal = parts.reduce((s, p) => s + (p.costPrice || 0) * p.quantity, 0);
    lines.push(`Parts Total: ${formatCurrency(partsTotal)}`);
  }

  lines.push('');
  lines.push('Thank you for your business!');
  lines.push('');
  lines.push(termsText);

  return lines.filter(Boolean).join('\n');
}

export function formatSaleReceiptText(shop, sale, customer) {
  const lines = [
    `*${shop?.shopName || 'Repair Desk'}*`,
    shop?.shopAddress,
    shop?.shopPhone && `Tel: ${shop.shopPhone}`,
    '',
    `Receipt: ${sale.receiptNumber}`,
    `Date: ${new Date().toLocaleDateString()}`,
    '',
    customer ? `Customer: ${customer.name}` : 'Customer: Walk-in',
    customer?.phone && `Phone: ${customer.phone}`,
    '',
    '--- ITEMS ---',
  ];

  if (sale.items) {
    sale.items.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      lines.push(`${item.productName}  x${item.quantity}  ${formatCurrency(itemTotal)}`);
    });
  }

  lines.push('');

  lines.push(`Subtotal: ${formatCurrency(sale.totalAmount)}`);

  if (sale.discount > 0) {
    lines.push(`Discount: -${formatCurrency(sale.discount)}`);
  }

  const total = sale.totalAmount - (sale.discount || 0);
  lines.push(`*Total: ${formatCurrency(total)}*`);
  lines.push('');
  lines.push('Thank you for your business!');
  lines.push('');
  lines.push(termsText);

  return lines.join('\n');
}
