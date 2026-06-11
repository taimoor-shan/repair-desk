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

// v7 - add lightweight FIFO inventory costing fields on stock purchase rows
db.version(7).stores({
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
  const products = await tx.table('products').toArray();
  const purchases = await tx.table('stockPurchases').toArray();

  for (const purchase of purchases) {
    if (purchase.remainingQuantity === undefined) {
      await tx.table('stockPurchases').update(purchase.id, {
        remainingQuantity: Number(purchase.quantity) || 0,
        cashOutflow: purchase.cashOutflow !== false,
      });
    }
  }

  const purchasesByProduct = new Map();
  for (const purchase of purchases) {
    const list = purchasesByProduct.get(purchase.productId) || [];
    list.push({
      ...purchase,
      remainingQuantity: purchase.remainingQuantity === undefined
        ? Number(purchase.quantity) || 0
        : Number(purchase.remainingQuantity) || 0,
    });
    purchasesByProduct.set(purchase.productId, list);
  }

  for (const product of products) {
    const targetStock = Math.max(0, Number(product.stock) || 0);
    const lots = (purchasesByProduct.get(product.id) || [])
      .sort((a, b) => `${a.date || ''}:${a.id}`.localeCompare(`${b.date || ''}:${b.id}`));
    let remainingTotal = lots.reduce((sum, lot) => sum + (Number(lot.remainingQuantity) || 0), 0);

    if (remainingTotal > targetStock) {
      let excess = remainingTotal - targetStock;
      for (const lot of lots) {
        if (excess <= 0) break;
        const current = Number(lot.remainingQuantity) || 0;
        const take = Math.min(current, excess);
        await tx.table('stockPurchases').update(lot.id, {
          remainingQuantity: current - take,
        });
        excess -= take;
      }
    } else if (targetStock > remainingTotal && Number(product.costPrice) > 0) {
      const quantity = targetStock - remainingTotal;
      await tx.table('stockPurchases').add({
        productId: product.id,
        productName: product.name,
        quantity,
        remainingQuantity: quantity,
        unitCost: Number(product.costPrice),
        totalCost: quantity * Number(product.costPrice),
        supplier: null,
        note: 'Opening balance reconciliation',
        date: new Date().toISOString().slice(0, 10),
        cashOutflow: true,
        createdAt: new Date().toISOString(),
      });
    }
  }
});

// v8 - fix: opening-balance reconciliation entries should count as cash outflow
db.version(8).stores({
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
  const purchases = await tx.table('stockPurchases').toArray();
  for (const purchase of purchases) {
    if (
      purchase.note === 'Opening balance reconciliation' &&
      purchase.cashOutflow === false
    ) {
      await tx.table('stockPurchases').update(purchase.id, {
        cashOutflow: true,
      });
    }
  }
});

function sortLots(a, b) {
  return `${a.date || ''}:${a.id || 0}`.localeCompare(`${b.date || ''}:${b.id || 0}`);
}

function lineCost(item) {
  const total = item.totalCost ?? item.total_cost;
  if (total != null) return Number(total) || 0;
  const unit = item.unitCost ?? item.unit_cost ?? item.costPrice ?? item.cost_price ?? 0;
  const qty = item.quantity ?? 0;
  return (Number(unit) || 0) * (Number(qty) || 0);
}

function normalizeCostedItem(item, allocation) {
  return {
    ...item,
    quantity: Number(item.quantity) || 0,
    unitCost: allocation.unitCost,
    costPrice: allocation.unitCost,
    totalCost: allocation.totalCost,
    costLayers: allocation.layers,
  };
}

async function ensureCostLayersForProduct(product) {
  const lots = await db.stockPurchases.where('productId').equals(Number(product.id)).toArray();
  const remainingTotal = lots.reduce(
    (sum, lot) => sum + (Number(lot.remainingQuantity ?? lot.quantity) || 0),
    0
  );
  const stock = Math.max(0, Number(product.stock) || 0);
  if (remainingTotal >= stock) return;

  const cost = Number(product.costPrice) || 0;
  if (cost <= 0) {
    throw new Error(`Set a cost price for "${product.name}" before selling or using stock.`);
  }

  const quantity = stock - remainingTotal;
  await db.stockPurchases.add({
    productId: product.id,
    productName: product.name,
    quantity,
    remainingQuantity: quantity,
    unitCost: cost,
    totalCost: quantity * cost,
    supplier: null,
    note: 'Opening balance reconciliation',
    date: new Date().toISOString().slice(0, 10),
    cashOutflow: true,
    createdAt: new Date().toISOString(),
  });
}

async function consumeInventory(productId, quantity) {
  const qty = Number(quantity) || 0;
  if (qty <= 0) throw new Error('Quantity must be greater than zero.');

  const product = await db.products.get(Number(productId));
  if (!product) throw new Error('Product not found.');
  if ((Number(product.stock) || 0) < qty) {
    throw new Error(`Only ${product.stock || 0} in stock for "${product.name}".`);
  }

  await ensureCostLayersForProduct(product);

  const lots = (await db.stockPurchases.where('productId').equals(Number(productId)).toArray())
    .filter((lot) => (Number(lot.remainingQuantity ?? lot.quantity) || 0) > 0)
    .sort(sortLots);

  let remaining = qty;
  let totalCost = 0;
  const layers = [];

  for (const lot of lots) {
    if (remaining <= 0) break;
    const lotRemaining = Number(lot.remainingQuantity ?? lot.quantity) || 0;
    const take = Math.min(lotRemaining, remaining);
    if (take <= 0) continue;

    const unitCost = Number(lot.unitCost) || 0;
    await db.stockPurchases.update(lot.id, {
      remainingQuantity: lotRemaining - take,
    });

    layers.push({ purchaseId: lot.id, quantity: take, unitCost });
    totalCost += take * unitCost;
    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error(`Not enough costed stock for "${product.name}". Add a purchase with unit cost first.`);
  }

  await db.products.update(Number(productId), {
    stock: (Number(product.stock) || 0) - qty,
  });

  return {
    layers,
    totalCost,
    unitCost: qty > 0 ? totalCost / qty : 0,
  };
}

async function restoreInventory(item) {
  const qty = Number(item.quantity) || 0;
  if (qty <= 0) return;

  const product = await db.products.get(Number(item.productId));
  if (product) {
    await db.products.update(Number(item.productId), {
      stock: (Number(product.stock) || 0) + qty,
    });
  }

  if (Array.isArray(item.costLayers) && item.costLayers.length > 0) {
    for (const layer of item.costLayers) {
      const purchase = await db.stockPurchases.get(Number(layer.purchaseId));
      if (!purchase) continue;
      await db.stockPurchases.update(Number(layer.purchaseId), {
        remainingQuantity:
          (Number(purchase.remainingQuantity ?? purchase.quantity) || 0) +
          (Number(layer.quantity) || 0),
      });
    }
    return;
  }

  const unitCost = Number(item.unitCost ?? item.costPrice ?? product?.costPrice) || 0;
  if (unitCost > 0) {
    await db.stockPurchases.add({
      productId: item.productId,
      productName: item.productName || product?.name || 'Restored item',
      quantity: qty,
      remainingQuantity: qty,
      unitCost,
      totalCost: qty * unitCost,
      supplier: null,
      note: 'Legacy stock return',
      date: new Date().toISOString().slice(0, 10),
      cashOutflow: false,
      createdAt: new Date().toISOString(),
    });
  }
}

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

  if (product.stock > 0) {
    if (!(Number(product.costPrice) > 0)) {
      throw new Error('Cost price is required when adding opening stock.');
    }
    await db.stockPurchases.add({
      productId,
      productName: product.name,
      quantity: product.stock,
      remainingQuantity: product.stock,
      unitCost: product.costPrice,
      totalCost: product.stock * product.costPrice,
      supplier: null,
      note: 'Initial stock',
      date: new Date().toISOString().slice(0, 10),
      cashOutflow: true,
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
  const amount = Number(delta) || 0;
  if (amount === 0) return;
  if (amount > 0) {
    throw new Error('Use Restock or New Purchase to increase stock with a unit cost.');
  }

  return db.transaction('rw', db.products, db.stockPurchases, db.expenses, async () => {
    const product = await db.products.get(Number(id));
    if (!product) return;
    const allocation = await consumeInventory(id, Math.abs(amount));
    await db.expenses.add({
      category: 'Inventory Adjustment',
      amount: allocation.totalCost,
      note: `Stock decreased: ${product.name}`,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    });
  });
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
  return db.transaction('rw', db.products, db.stockPurchases, db.repairParts, db.repairJobs, async () => {
    const parts = await db.repairParts.where('repairJobId').equals(Number(id)).toArray();
    for (const part of parts) {
      await restoreInventory(part);
    }
    await db.repairParts.where('repairJobId').equals(Number(id)).delete();
    return db.repairJobs.delete(Number(id));
  });
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
  return db.transaction('rw', db.products, db.stockPurchases, db.sales, async () => {
    const items = [];
    for (const item of sale.items || []) {
      const allocation = await consumeInventory(item.productId, item.quantity);
      items.push(normalizeCostedItem(item, allocation));
    }
    return db.sales.add({ ...sale, items });
  });
}

export async function updateSale(id, data) {
  return db.transaction('rw', db.products, db.stockPurchases, db.sales, async () => {
    const existing = await db.sales.get(Number(id));
    if (existing?.items?.length) {
      for (const item of existing.items) {
        await restoreInventory(item);
      }
    }

    const items = [];
    for (const item of data.items || []) {
      const allocation = await consumeInventory(item.productId, item.quantity);
      items.push(normalizeCostedItem(item, allocation));
    }

    return db.sales.update(Number(id), { ...data, items });
  });
}

export async function deleteSale(id) {
  return db.transaction('rw', db.products, db.stockPurchases, db.sales, async () => {
    const sale = await db.sales.get(Number(id));
    if (sale?.items?.length) {
      for (const item of sale.items) {
        await restoreInventory(item);
      }
    }
    return db.sales.delete(Number(id));
  });
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

      if (json.customers) {
        const rows = json.customers.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          address: c.address,
          email: c.email,
          createdAt: c.createdAt || c.created_at || new Date().toISOString(),
          updatedAt: c.updatedAt || c.updated_at || new Date().toISOString(),
        }));
        await db.customers.bulkAdd(rows);
      }
      if (json.products) {
        // Normalize SKUs and auto-map snake_case → camelCase from Supabase exports
        const seen = new Set();
        const normalized = json.products.map((p, i) => {
          // Auto-detect snake_case Supabase export and convert field names
          const product = {
            id: p.id,
            name: p.name,
            category: p.category,
            sku: (p.sku && typeof p.sku === 'string' ? p.sku.trim() : ''),
            stock: Number(p.stock ?? 0),
            costPrice: p.costPrice != null ? Number(p.costPrice) : (p.cost_price != null ? Number(p.cost_price) : null),
            sellingPrice: p.sellingPrice != null ? Number(p.sellingPrice) : (p.selling_price != null ? Number(p.selling_price) : null),
            lowStockThreshold: Number(p.lowStockThreshold ?? p.low_stock_threshold ?? 0),
            createdAt: p.createdAt || p.created_at || new Date().toISOString(),
          };
          // Generate a fallback SKU if empty
          if (!product.sku) {
            product.sku = `SKU-${String(i + 1).padStart(4, '0')}`;
          }
          // Deduplicate
          if (seen.has(product.sku)) {
            let suffix = 2;
            let newSku;
            do { newSku = `${product.sku}-${suffix}`; suffix++; } while (seen.has(newSku));
            product.sku = newSku;
          }
          seen.add(product.sku);
          return product;
        });
        await db.products.bulkAdd(normalized);
      }
      if (json.repairJobs) {
        const rows = json.repairJobs.map((r) => ({
          id: r.id,
          customerId: r.customerId ?? r.customer_id,
          deviceId: r.deviceId ?? r.device_id,
          mobileBrand: r.mobileBrand ?? r.mobile_brand,
          mobileModel: r.mobileModel ?? r.mobile_model,
          imei: r.imei,
          color: r.color || '',
          phonePassword: r.phonePassword ?? r.phone_password ?? '',
          problemDescription: r.problemDescription ?? r.problem_description,
          repairNotes: r.repairNotes ?? r.repair_notes,
          estimatedCost: r.estimatedCost ?? r.estimated_cost,
          laborCost: r.laborCost ?? r.labor_cost,
          extraCost: r.extraCost ?? r.extra_cost,
          extraCostLabel: r.extraCostLabel ?? r.extra_cost_label ?? '',
          finalCost: r.finalCost ?? r.final_cost,
          status: r.status,
          receiptNumber: r.receiptNumber ?? r.receipt_number,
          receivedAt: r.receivedAt ?? r.received_at,
          deliveredAt: r.deliveredAt ?? r.delivered_at,
        }));
        await db.repairJobs.bulkAdd(rows);
      }
      if (json.sales) {
        const rows = json.sales.map((s) => ({
          id: s.id,
          customerId: s.customerId ?? s.customer_id,
          saleType: s.saleType ?? s.sale_type,
          items: s.items,
          totalAmount: s.totalAmount != null ? Number(s.totalAmount) : (s.total_amount != null ? Number(s.total_amount) : null),
          discount: s.discount != null ? Number(s.discount) : 0,
          paymentMethod: s.paymentMethod ?? s.payment_method,
          receiptNumber: s.receiptNumber ?? s.receipt_number,
          createdAt: s.createdAt ?? s.created_at,
        }));
        await db.sales.bulkAdd(rows);
      }
      if (json.settings) {
        const rows = json.settings.map((s) => ({
          id: s.id,
          shopName: s.shopName ?? s.shop_name,
          shopPhone: s.shopPhone ?? s.shop_phone,
          shopAddress: s.shopAddress ?? s.shop_address,
          shopLogo: s.shopLogo ?? s.shop_logo ?? '',
          shopHours: s.shopHours ?? s.shop_hours ?? '',
          currency: s.currency || 'EUR',
          lastRepairSeq: s.lastRepairSeq ?? s.last_repair_seq,
          lastRepairDate: s.lastRepairDate ?? s.last_repair_date,
          lastSaleSeq: s.lastSaleSeq ?? s.last_sale_seq,
          lastSaleDate: s.lastSaleDate ?? s.last_sale_date,
        }));
        await db.settings.bulkAdd(rows);
      }
      if (json.devices) {
        const rows = json.devices.map((d) => ({
          id: d.id,
          customerId: d.customerId ?? d.customer_id,
          brand: d.brand,
          model: d.model,
          imei: d.imei,
          color: d.color,
          notes: d.notes,
          createdAt: d.createdAt ?? d.created_at ?? new Date().toISOString(),
        }));
        await db.devices.bulkAdd(rows);
      }
      if (json.repairParts) {
        const rows = json.repairParts.map((rp) => ({
          id: rp.id,
          repairJobId: rp.repairJobId ?? rp.repair_job_id,
          productId: rp.productId ?? rp.product_id,
          productName: rp.productName ?? rp.product_name,
          costPrice: rp.costPrice != null ? Number(rp.costPrice) : (rp.cost_price != null ? Number(rp.cost_price) : 0),
          sellingPrice: rp.sellingPrice != null ? Number(rp.sellingPrice) : (rp.selling_price != null ? Number(rp.selling_price) : 0),
          quantity: Number(rp.quantity),
          totalCost: rp.totalCost != null ? Number(rp.totalCost) : (rp.total_cost != null ? Number(rp.total_cost) : null),
          costLayers: rp.costLayers ?? rp.cost_layers ?? [],
        }));
        await db.repairParts.bulkAdd(rows);
      }
      if (json.expenses) {
        const rows = json.expenses.map((e) => ({
          id: e.id,
          category: e.category,
          amount: Number(e.amount),
          note: e.note,
          date: e.date,
          createdAt: e.createdAt ?? e.created_at ?? new Date().toISOString(),
        }));
        await db.expenses.bulkAdd(rows);
      }
      if (json.stockPurchases) {
        const rows = json.stockPurchases.map((p) => ({
          id: p.id,
          productId: p.productId ?? p.product_id,
          productName: p.productName ?? p.product_name,
          quantity: Number(p.quantity),
          remainingQuantity: p.remainingQuantity != null ? Number(p.remainingQuantity) : (p.remaining_quantity != null ? Number(p.remaining_quantity) : Number(p.quantity)),
          unitCost: p.unitCost != null ? Number(p.unitCost) : (p.unit_cost != null ? Number(p.unit_cost) : 0),
          totalCost: p.totalCost != null ? Number(p.totalCost) : (p.total_cost != null ? Number(p.total_cost) : 0),
          supplier: p.supplier,
          note: p.note,
          date: p.date,
          cashOutflow: p.cashOutflow !== undefined ? p.cashOutflow : (p.cash_outflow !== undefined ? p.cash_outflow : true),
          createdAt: p.createdAt ?? p.created_at ?? new Date().toISOString(),
        }));
        await db.stockPurchases.bulkAdd(rows);
      }
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
  return db.transaction('rw', db.products, db.stockPurchases, db.repairParts, async () => {
    const rows = [];
    for (const part of parts) {
      const allocation = await consumeInventory(part.productId, part.quantity);
      rows.push({
        repairJobId: Number(repairJobId),
        productId: part.productId,
        productName: part.productName,
        costPrice: allocation.unitCost,
        sellingPrice: part.sellingPrice,
        quantity: Number(part.quantity) || 0,
        totalCost: allocation.totalCost,
        costLayers: allocation.layers,
      });
    }
    if (rows.length === 0) return;
    return db.repairParts.bulkAdd(rows);
  });
}

export async function deleteRepairParts(repairJobId) {
  return db.transaction('rw', db.products, db.stockPurchases, db.repairParts, async () => {
    const parts = await getRepairParts(repairJobId);
    for (const part of parts) {
      await restoreInventory(part);
    }
    return db.repairParts.where('repairJobId').equals(Number(repairJobId)).delete();
  });
}

export async function restoreRepairPartsStock(repairJobId) {
  const parts = await getRepairParts(repairJobId);
  for (const part of parts) {
    await restoreInventory(part);
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
  const unitCost = Number(purchase.unitCost) || 0;
  const quantity = Number(purchase.quantity) || 0;
  if (quantity <= 0) throw new Error('Purchase quantity must be greater than zero.');
  if (unitCost <= 0) throw new Error('Unit cost is required for stock purchases.');

  const id = await db.stockPurchases.add({
    ...purchase,
    quantity,
    unitCost,
    totalCost: quantity * unitCost,
    remainingQuantity: quantity,
    cashOutflow: true,
    createdAt: new Date().toISOString(),
  });
  // Increment stock
  const product = await db.products.get(Number(purchase.productId));
  if (product) {
    await db.products.update(Number(purchase.productId), {
      stock: product.stock + quantity,
      costPrice: unitCost,
    });
  }
  return id;
}

export async function deleteStockPurchase(id) {
  const purchase = await db.stockPurchases.get(Number(id));
  if (!purchase) return;
  const remainingQuantity = Number(purchase.remainingQuantity ?? purchase.quantity) || 0;
  if (remainingQuantity < (Number(purchase.quantity) || 0)) {
    throw new Error('This purchase has already been sold or used. Void the related sale/repair first.');
  }
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
      return sum + s.items.reduce((is, item) => is + lineCost(item), 0);
    }, 0);

  // Repair COGS: all repair_parts whose repair job was delivered in range
  const deliveredJobIds = new Set(
    allRepairs
      .filter((r) => r.status === 'Delivered' && inRange(r.deliveredAt?.slice(0, 10)))
      .map((r) => r.id)
  );
  const repairCOGS = allRepairParts
    .filter((rp) => deliveredJobIds.has(rp.repairJobId))
    .reduce((sum, rp) => sum + lineCost(rp), 0);

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
    .filter((p) => inRange(p.date) && (p.cashOutflow ?? p.cash_outflow) !== false)
    .reduce((sum, p) => sum + (p.totalCost ?? p.total_cost ?? 0), 0);

  // --- Charts: daily breakdown ---
  const dailyMap = {};
  allSales.filter((s) => inRange(s.createdAt?.slice(0, 10))).forEach((s) => {
    const d = s.createdAt?.slice(0, 10);
    if (!dailyMap[d]) dailyMap[d] = { revenue: 0, cogs: 0, expenses: 0 };
    dailyMap[d].revenue += (s.totalAmount || 0) - (s.discount || 0);
    dailyMap[d].cogs += (s.items || []).reduce((is, item) => is + lineCost(item), 0);
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
    dailyMap[d].cogs += parts.reduce((sum, rp) => sum + lineCost(rp), 0);
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
      monthlyMap[m].cogs += (s.items || []).reduce((is, item) => is + lineCost(item), 0);
    }
  });
  allRepairs.filter((r) => r.status === 'Delivered' && r.finalCost != null).forEach((r) => {
    if (!r.deliveredAt) return;
    const m = r.deliveredAt.slice(0, 7);
    if (monthlyMap[m]) {
      monthlyMap[m].revenue += r.finalCost || 0;
      const parts = allRepairParts.filter((rp) => rp.repairJobId === r.id);
      monthlyMap[m].cogs += parts.reduce((sum, rp) => sum + lineCost(rp), 0);
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
