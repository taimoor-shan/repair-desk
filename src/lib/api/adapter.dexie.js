import Dexie from 'dexie';

const db = new Dexie('RepairDesk');

db.version(3).stores({
  customers:      '++id, &phone, name',
  products:       '++id, name, category, stock',
  repairJobs:     '++id, customerId, deviceId, status, receivedAt',
  sales:          '++id, customerId, saleType, createdAt',
  settings:       'id',
  devices:        '++id, customerId, imei',
  repairParts:    '++id, repairJobId, productId',
  expenses:       '++id, date, category',
  stockPurchases: '++id, productId, date',
});

// v4 — add shopHours to settings
db.version(4).stores({
  customers:      '++id, &phone, name',
  products:       '++id, name, category, stock',
  repairJobs:     '++id, customerId, deviceId, status, receivedAt',
  sales:          '++id, customerId, saleType, createdAt',
  settings:       'id',
  devices:        '++id, customerId, imei',
  repairParts:    '++id, repairJobId, productId',
  expenses:       '++id, date, category',
  stockPurchases: '++id, productId, date',
}).upgrade(async (tx) => {
  const s = await tx.table('settings').get(1);
  if (s && s.shopHours === undefined) {
    await tx.table('settings').update(1, { shopHours: '' });
  }
});

// v5 — unique SKU index on products (may be broken for some users with empty SKUs)
// v6 — fixed upgrade: normalizes empty strings + deduplicates before applying &sku
db.version(6).stores({
  customers:      '++id, &phone, name',
  products:       '++id, &sku, name, category, stock',
  repairJobs:     '++id, customerId, deviceId, status, receivedAt',
  sales:          '++id, customerId, saleType, createdAt',
  settings:       'id',
  devices:        '++id, customerId, imei',
  repairParts:    '++id, repairJobId, productId',
  expenses:       '++id, date, category',
  stockPurchases: '++id, productId, date',
}).upgrade(async (tx) => {
  // Fetch all existing products
  const products = await tx.table('products').orderBy('id').toArray();

  // Normalize every product's SKU: empty string → undefined, trim whitespace
  for (const p of products) {
    const raw = p.sku;
    if (raw === '' || raw === null) {
      await tx.table('products').update(p.id, { sku: undefined });
    } else if (typeof raw === 'string' && raw !== raw.trim()) {
      await tx.table('products').update(p.id, { sku: raw.trim() });
    }
  }

  // Deduplicate non-empty SKUs — keep first by ID, append "-DUP-N" to rest
  const seen = new Set();
  for (const p of products) {
    const sku = p.sku && typeof p.sku === 'string' ? p.sku.trim() : '';
    if (!sku) continue;

    if (seen.has(sku)) {
      let suffix = 2;
      let newSku;
      do {
        newSku = `${sku}-DUP-${suffix}`;
        suffix++;
      } while (seen.has(newSku));
      await tx.table('products').update(p.id, { sku: newSku });
      seen.add(newSku);
    } else {
      seen.add(sku);
    }
  }
});

// --- Customers ---

export async function getCustomers() {
  return db.customers.orderBy('name').toArray();
}

export async function getCustomer(id) {
  return db.customers.get(Number(id));
}

export async function searchCustomers(query) {
  const q = query.toLowerCase();
  return db.customers
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) || (c.phone || '').includes(q)
    )
    .toArray();
}

export async function addCustomer(customer) {
  const now = new Date().toISOString();
  return db.customers.add({ ...customer, createdAt: now, updatedAt: now });
}

export async function updateCustomer(id, data) {
  return db.customers.update(Number(id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCustomer(id) {
  return db.customers.delete(Number(id));
}

export async function getCustomerByPhone(phone) {
  return db.customers.where('phone').equals(phone).first();
}

// --- Products ---

export async function getProducts() {
  return db.products.orderBy('name').toArray();
}

export async function getProduct(id) {
  return db.products.get(Number(id));
}

export async function getProductBySku(sku) {
  return db.products.where('sku').equals(sku).first();
}

export async function addProduct(product) {
  return db.products.add({ ...product, createdAt: new Date().toISOString() });
}

export async function addProductWithInitialStock(product) {
  // Normalize empty SKU to undefined so it doesn't collide in unique index
  if (product.sku === '') product.sku = undefined;

  const productId = await addProduct(product);

  // If initial stock > 0 and cost price > 0, record as purchase
  if (product.stock > 0 && product.costPrice > 0) {
    await db.stockPurchases.add({
      productId,
      productName: product.name,
      quantity: product.stock,
      unitCost: product.costPrice,
      totalCost: product.stock * product.costPrice,
      supplier: null,
      note: 'Initial stock',
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    });
  }

  return productId;
}

export async function updateProduct(id, data) {
  return db.products.update(Number(id), data);
}

export async function deleteProduct(id) {
  return db.products.delete(Number(id));
}

export async function adjustStock(id, delta) {
  const product = await db.products.get(Number(id));
  if (!product) return;
  const newStock = Math.max(0, product.stock + delta);
  return db.products.update(Number(id), { stock: newStock });
}

// --- Repair Jobs ---

export async function getRepairJobs() {
  return db.repairJobs.orderBy('receivedAt').reverse().toArray();
}

export async function getRepairJob(id) {
  return db.repairJobs.get(Number(id));
}

export async function addRepairJob(job) {
  return db.repairJobs.add(job);
}

export async function updateRepairJob(id, data) {
  return db.repairJobs.update(Number(id), data);
}

export async function deleteRepairJob(id) {
  return db.repairJobs.delete(Number(id));
}

export async function getRepairJobsByCustomer(customerId) {
  return db.repairJobs
    .where('customerId')
    .equals(Number(customerId))
    .reverse()
    .sortBy('receivedAt');
}

export async function searchRepairJobs(query) {
  const q = query.toLowerCase();
  const allRepairs = await db.repairJobs.orderBy('receivedAt').reverse().toArray();
  const allCustomers = await db.customers.toArray();
  const customerMap = Object.fromEntries(allCustomers.map(c => [c.id, c]));

  return allRepairs.filter(r => {
    const cust = customerMap[r.customerId];
    return (
      (r.receiptNumber || '').toLowerCase().includes(q) ||
      (r.mobileBrand || '').toLowerCase().includes(q) ||
      (r.mobileModel || '').toLowerCase().includes(q) ||
      (r.imei || '').toLowerCase().includes(q) ||
      (r.problemDescription || '').toLowerCase().includes(q) ||
      (cust?.name || '').toLowerCase().includes(q) ||
      (cust?.phone || '').toLowerCase().includes(q)
    );
  });
}

export async function getRepairJobsInRange(startDate, endDate) {
  const results = await db.repairJobs
    .filter(r => {
      const d = (r.receivedAt || '').slice(0, 10);
      return d >= startDate && d <= endDate;
    })
    .toArray();
  return results.sort((a, b) =>
    (b.receivedAt || '').localeCompare(a.receivedAt || '')
  );
}

// --- Sales ---

export async function getSales() {
  return db.sales.orderBy('createdAt').reverse().toArray();
}

export async function getSale(id) {
  return db.sales.get(Number(id));
}

export async function addSale(sale) {
  return db.sales.add(sale);
}

export async function updateSale(id, data) {
  return db.sales.update(Number(id), data);
}

export async function deleteSale(id) {
  const sale = await db.sales.get(Number(id));
  if (sale?.items?.length) {
    for (const item of sale.items) {
      const product = await db.products.get(Number(item.productId));
      if (product) {
        await db.products.update(Number(item.productId), {
          stock: (product.stock || 0) + item.quantity,
        });
      }
    }
  }
  return db.sales.delete(Number(id));
}

export async function getSalesByCustomer(customerId) {
  return db.sales
    .where('customerId')
    .equals(Number(customerId))
    .reverse()
    .sortBy('createdAt');
}

export async function searchSales(query) {
  const q = query.toLowerCase();
  const allSales = await db.sales.orderBy('createdAt').reverse().toArray();
  const allCustomers = await db.customers.toArray();
  const customerMap = Object.fromEntries(allCustomers.map(c => [c.id, c]));

  return allSales.filter(s => {
    const cust = customerMap[s.customerId];
    return (
      (s.receiptNumber || '').toLowerCase().includes(q) ||
      (cust?.name || '').toLowerCase().includes(q) ||
      (cust?.phone || '').toLowerCase().includes(q)
    );
  });
}

export async function getSalesInRange(startDate, endDate) {
  const results = await db.sales
    .filter(s => {
      const d = (s.createdAt || '').slice(0, 10);
      return d >= startDate && d <= endDate;
    })
    .toArray();
  return results.sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );
}

// --- Settings ---

export async function getSettings() {
  let s = await db.settings.get(1);
  if (!s) {
    s = {
      id: 1,
      shopName: '',
      shopPhone: '',
      shopAddress: '',
      shopLogo: '',
      shopHours: '',
      currency: 'EUR',
      lastRepairSeq: 0,
      lastRepairDate: '',
      lastSaleSeq: 0,
      lastSaleDate: '',
    };
    await db.settings.put(s);
  }
  return s;
}

export async function updateSettings(data) {
  return db.settings.update(1, data);
}

// --- Receipt Number Helpers ---

export async function getNextRepairSeq() {
  const s = await getSettings();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  if (s.lastRepairDate !== today) {
    s.lastRepairSeq = 1;
    s.lastRepairDate = today;
  } else {
    s.lastRepairSeq += 1;
  }

  await updateSettings({
    lastRepairSeq: s.lastRepairSeq,
    lastRepairDate: s.lastRepairDate,
  });

  return s.lastRepairSeq;
}

export async function getNextSaleSeq() {
  const s = await getSettings();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  if (s.lastSaleDate !== today) {
    s.lastSaleSeq = 1;
    s.lastSaleDate = today;
  } else {
    s.lastSaleSeq += 1;
  }

  await updateSettings({
    lastSaleSeq: s.lastSaleSeq,
    lastSaleDate: s.lastSaleDate,
  });

  return s.lastSaleSeq;
}

// --- Backup ---

export async function exportData() {
  const [customers, products, repairJobs, sales, settings, devices, repairParts, expenses, stockPurchases] =
    await Promise.all([
      db.customers.toArray(),
      db.products.toArray(),
      db.repairJobs.toArray(),
      db.sales.toArray(),
      db.settings.toArray(),
      db.devices.toArray(),
      db.repairParts.toArray(),
      db.expenses.toArray(),
      db.stockPurchases.toArray(),
    ]);
  return { customers, products, repairJobs, sales, settings, devices, repairParts, expenses, stockPurchases };
}

export async function importData(json) {
  await db.transaction(
    'rw',
    [db.customers, db.products, db.repairJobs, db.sales, db.settings, db.devices, db.repairParts, db.expenses, db.stockPurchases],
    async () => {
      await db.customers.clear();
      await db.products.clear();
      await db.repairJobs.clear();
      await db.sales.clear();
      await db.settings.clear();
      await db.devices.clear();
      await db.repairParts.clear();
      await db.expenses.clear();
      await db.stockPurchases.clear();

      if (json.customers) await db.customers.bulkAdd(json.customers);
      if (json.products) {
        // Normalize SKUs for import: generate for empty, deduplicate, trim
        const seen = new Set();
        const normalized = json.products.map((p, i) => {
          let sku = (p.sku && typeof p.sku === 'string' ? p.sku.trim() : '');
          // Generate a fallback SKU if empty
          if (!sku) sku = `SKU-${String(i + 1).padStart(4, '0')}`;
          // Deduplicate
          if (seen.has(sku)) {
            let suffix = 2;
            let newSku;
            do { newSku = `${sku}-${suffix}`; suffix++; } while (seen.has(newSku));
            sku = newSku;
          }
          seen.add(sku);
          return { ...p, sku };
        });
        await db.products.bulkAdd(normalized);
      }
      if (json.repairJobs) await db.repairJobs.bulkAdd(json.repairJobs);
      if (json.sales) await db.sales.bulkAdd(json.sales);
      if (json.settings) await db.settings.bulkAdd(json.settings);
      if (json.devices) await db.devices.bulkAdd(json.devices);
      if (json.repairParts) await db.repairParts.bulkAdd(json.repairParts);
      if (json.expenses) await db.expenses.bulkAdd(json.expenses);
      if (json.stockPurchases) await db.stockPurchases.bulkAdd(json.stockPurchases);
    }
  );
}

// ============================================================
//  NEW — Devices
// ============================================================

export async function getDevicesByCustomer(customerId) {
  return db.devices.where('customerId').equals(Number(customerId)).toArray();
}

export async function getDeviceByIMEI(imei) {
  if (!imei) return null;
  return db.devices.where('imei').equals(imei).first();
}

export async function addDevice(device) {
  const now = new Date().toISOString();
  const id = await db.devices.add({ ...device, createdAt: now });
  return db.devices.get(id);
}

export async function updateDevice(id, data) {
  await db.devices.update(Number(id), data);
  return db.devices.get(Number(id));
}

// ============================================================
//  NEW — Repair Parts
// ============================================================

export async function getRepairParts(repairJobId) {
  return db.repairParts.where('repairJobId').equals(Number(repairJobId)).toArray();
}

export async function addRepairParts(repairJobId, parts) {
  const rows = parts.map((p) => ({
    repairJobId: Number(repairJobId),
    productId: p.productId,
    productName: p.productName,
    costPrice: p.costPrice,
    sellingPrice: p.sellingPrice,
    quantity: p.quantity,
  }));
  return db.repairParts.bulkAdd(rows);
}

export async function deleteRepairParts(repairJobId) {
  return db.repairParts.where('repairJobId').equals(Number(repairJobId)).delete();
}

export async function restoreRepairPartsStock(repairJobId) {
  const parts = await getRepairParts(repairJobId);
  for (const part of parts) {
    const product = await db.products.get(Number(part.productId));
    if (product) {
      await db.products.update(Number(part.productId), {
        stock: (product.stock || 0) + part.quantity,
      });
    }
  }
}

// ============================================================
//  NEW — Expenses
// ============================================================

export async function getExpenses(rangeStart, rangeEnd) {
  let col = db.expenses.orderBy('date').reverse();
  if (rangeStart && rangeEnd) {
    col = col.filter((e) => e.date >= rangeStart && e.date <= rangeEnd);
  }
  return col.toArray();
}

export async function addExpense(expense) {
  return db.expenses.add({ ...expense, createdAt: new Date().toISOString() });
}

export async function updateExpense(id, data) {
  return db.expenses.update(Number(id), data);
}

export async function deleteExpense(id) {
  return db.expenses.delete(Number(id));
}

// ============================================================
//  NEW — Stock Purchases
// ============================================================

export async function getStockPurchases(rangeStart, rangeEnd) {
  let col = db.stockPurchases.orderBy('date').reverse();
  if (rangeStart && rangeEnd) {
    col = col.filter((e) => e.date >= rangeStart && e.date <= rangeEnd);
  }
  return col.toArray();
}

export async function addStockPurchase(purchase) {
  const id = await db.stockPurchases.add({ ...purchase, createdAt: new Date().toISOString() });
  // Increment stock
  const product = await db.products.get(Number(purchase.productId));
  if (product) {
    await db.products.update(Number(purchase.productId), {
      stock: product.stock + purchase.quantity,
    });
  }
  return id;
}

export async function deleteStockPurchase(id) {
  const purchase = await db.stockPurchases.get(Number(id));
  if (!purchase) return;
  // Decrement stock
  const product = await db.products.get(Number(purchase.productId));
  if (product) {
    await db.products.update(Number(purchase.productId), {
      stock: Math.max(0, product.stock - purchase.quantity),
    });
  }
  return db.stockPurchases.delete(Number(id));
}

// ============================================================
//  NEW — Analytics
// ============================================================

export async function getAnalyticsData(rangeStart, rangeEnd) {
  const [
    allSales,
    allRepairs,
    allRepairParts,
    allExpenses,
    allStockPurchases,
  ] = await Promise.all([
    db.sales.toArray(),
    db.repairJobs.toArray(),
    db.repairParts.toArray(),
    db.expenses.toArray(),
    db.stockPurchases.toArray(),
  ]);

  const inRange = (d) => {
    if (!d) return false;
    return d >= rangeStart && d <= (rangeEnd || '9999');
  };

  // --- Revenue ---
  const salesRevenue = allSales
    .filter((s) => inRange(s.createdAt?.slice(0, 10)))
    .reduce((sum, s) => sum + (s.totalAmount || 0) - (s.discount || 0), 0);

  const repairRevenue = allRepairs
    .filter((r) => r.status === 'Delivered' && r.finalCost != null && inRange(r.deliveredAt?.slice(0, 10)))
    .reduce((sum, r) => sum + (r.finalCost || 0), 0);

  // --- COGS ---
  const salesCOGS = allSales
    .filter((s) => inRange(s.createdAt?.slice(0, 10)))
    .reduce((sum, s) => {
      if (!s.items) return sum;
      return sum + s.items.reduce((is, item) => is + (item.unitCost || 0) * (item.quantity || 0), 0);
    }, 0);

  // Repair COGS: all repair_parts whose repair job was delivered in range
  const deliveredJobIds = new Set(
    allRepairs
      .filter((r) => r.status === 'Delivered' && inRange(r.deliveredAt?.slice(0, 10)))
      .map((r) => r.id)
  );
  const repairCOGS = allRepairParts
    .filter((rp) => deliveredJobIds.has(rp.repairJobId))
    .reduce((sum, rp) => sum + (rp.costPrice || 0) * (rp.quantity || 0), 0);

  const totalCOGS = salesCOGS + repairCOGS;
  const totalRevenue = salesRevenue + repairRevenue;
  const grossProfit = totalRevenue - totalCOGS;

  // --- Expenses ---
  const filteredExpenses = allExpenses.filter((e) => inRange(e.date));
  const expensesTotal = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const byCategory = {};
  filteredExpenses.forEach((e) => {
    const cat = e.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
  });

  const netProfit = grossProfit - expensesTotal;

  // --- Stock Cash Flow ---
  const stockCashFlow = allStockPurchases
    .filter((p) => inRange(p.date))
    .reduce((sum, p) => sum + (p.totalCost || 0), 0);

  // --- Charts: daily breakdown ---
  const dailyMap = {};
  allSales.filter((s) => inRange(s.createdAt?.slice(0, 10))).forEach((s) => {
    const d = s.createdAt?.slice(0, 10);
    if (!dailyMap[d]) dailyMap[d] = { revenue: 0, cogs: 0, expenses: 0 };
    dailyMap[d].revenue += (s.totalAmount || 0) - (s.discount || 0);
    dailyMap[d].cogs += (s.items || []).reduce((is, item) => is + (item.unitCost || 0) * (item.quantity || 0), 0);
  });
  allRepairs.filter((r) => r.status === 'Delivered' && r.finalCost != null && inRange(r.deliveredAt?.slice(0, 10))).forEach((r) => {
    const d = r.deliveredAt?.slice(0, 10);
    if (!dailyMap[d]) dailyMap[d] = { revenue: 0, cogs: 0, expenses: 0 };
    dailyMap[d].revenue += r.finalCost || 0;
  });
  // COGS from repair parts mapped to delivery date
  allRepairs.filter((r) => r.status === 'Delivered' && inRange(r.deliveredAt?.slice(0, 10))).forEach((r) => {
    const d = r.deliveredAt?.slice(0, 10);
    if (!dailyMap[d]) dailyMap[d] = { revenue: 0, cogs: 0, expenses: 0 };
    const parts = allRepairParts.filter((rp) => rp.repairJobId === r.id);
    dailyMap[d].cogs += parts.reduce((sum, rp) => sum + (rp.costPrice || 0) * (rp.quantity || 0), 0);
  });
  filteredExpenses.forEach((e) => {
    if (!dailyMap[e.date]) dailyMap[e.date] = { revenue: 0, cogs: 0, expenses: 0 };
    dailyMap[e.date].expenses += e.amount || 0;
  });

  const daily = Object.entries(dailyMap)
    .map(([date, vals]) => ({ date, ...vals }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // --- Charts: monthly (last 6 months) ---
  const monthlyMap = {};
  const last6 = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    last6.push(key);
    monthlyMap[key] = { revenue: 0, cogs: 0, expenses: 0 };
  }

  allSales.forEach((s) => {
    if (!s.createdAt) return;
    const m = s.createdAt.slice(0, 7);
    if (monthlyMap[m]) {
      monthlyMap[m].revenue += (s.totalAmount || 0) - (s.discount || 0);
      monthlyMap[m].cogs += (s.items || []).reduce((is, item) => is + (item.unitCost || 0) * (item.quantity || 0), 0);
    }
  });
  allRepairs.filter((r) => r.status === 'Delivered' && r.finalCost != null).forEach((r) => {
    if (!r.deliveredAt) return;
    const m = r.deliveredAt.slice(0, 7);
    if (monthlyMap[m]) {
      monthlyMap[m].revenue += r.finalCost || 0;
      const parts = allRepairParts.filter((rp) => rp.repairJobId === r.id);
      monthlyMap[m].cogs += parts.reduce((sum, rp) => sum + (rp.costPrice || 0) * (rp.quantity || 0), 0);
    }
  });
  allExpenses.forEach((e) => {
    if (!e.date) return;
    const m = e.date.slice(0, 7);
    if (monthlyMap[m]) monthlyMap[m].expenses += e.amount || 0;
  });

  const monthly = last6.map((m) => ({ month: m, ...monthlyMap[m] }));

  // --- Repair Stats ---
  const problemCount = {};
  allRepairs.forEach((r) => {
    if (!r.problemDescription) return;
    const key = r.problemDescription.slice(0, 60);
    problemCount[key] = (problemCount[key] || 0) + 1;
  });
  const topProblems = Object.entries(problemCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([problem, count]) => ({ problem, count }));

  const deliveredRepairs = allRepairs.filter((r) => r.status === 'Delivered' && r.finalCost != null);
  const avgFinalCost =
    deliveredRepairs.length > 0
      ? deliveredRepairs.reduce((s, r) => s + (r.finalCost || 0), 0) / deliveredRepairs.length
      : 0;

  const avgTurnaroundHours =
    deliveredRepairs.filter((r) => r.receivedAt && r.deliveredAt).length > 0
      ? deliveredRepairs
          .filter((r) => r.receivedAt && r.deliveredAt)
          .reduce((s, r) => s + (new Date(r.deliveredAt) - new Date(r.receivedAt)) / 3600000, 0) /
        deliveredRepairs.filter((r) => r.receivedAt && r.deliveredAt).length
      : 0;

  // --- Sales Stats ---
  const productSales = {};
  allSales.forEach((s) => {
    if (!s.items) return;
    s.items.forEach((item) => {
      const key = item.productName;
      if (!productSales[key]) productSales[key] = { qty: 0, revenue: 0 };
      productSales[key].qty += item.quantity || 0;
      productSales[key].revenue += (item.unitPrice || 0) * (item.quantity || 0);
    });
  });
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
    .map(([name, stats]) => ({ name, qty: stats.qty, revenue: stats.revenue }));

  return {
    revenue: {
      sales: salesRevenue,
      repairs: repairRevenue,
      total: totalRevenue,
    },
    cogs: {
      sales: salesCOGS,
      repairs: repairCOGS,
      total: totalCOGS,
    },
    grossProfit,
    expenses: {
      total: expensesTotal,
      byCategory,
      log: filteredExpenses,
    },
    netProfit,
    stockCashFlow,
    charts: { daily, monthly },
    repairStats: {
      topProblems,
      avgFinalCost: Math.round(avgFinalCost),
      avgTurnaroundHours: Math.round(avgTurnaroundHours),
    },
    salesStats: { topProducts },
  };
}
