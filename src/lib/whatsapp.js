import { formatCurrency } from './helpers';

export function buildWhatsAppUrl(phone, text) {
  let digits = phone.replace(/\D/g, '');

  // Normalize Pakistani numbers: 03XX... → 923XX...
  if (digits.startsWith('0')) {
    digits = '92' + digits.slice(1);
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function formatRepairReceiptText(shop, repair, customer) {
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
    '',
    'Thank you for your business!',
  ];

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
  lines.push(`Payment: ${sale.paymentMethod}`);
  lines.push('');
  lines.push('Thank you for your business!');

  return lines.join('\n');
}
