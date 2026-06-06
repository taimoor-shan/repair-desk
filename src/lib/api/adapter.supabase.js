import { supabase } from '../supabase';

// ─── Column Mappers ───────────────────────────────────────────────

// ── Customer ──
function toCustomer(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fromCustomer(obj) {
  return {
    name: obj.name,
    phone: obj.phone,
    address: obj.address,
    email: obj.email,
    created_at: obj.createdAt,
    updated_at: obj.updatedAt,
  };
}

// ── Product ──
function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    sku: row.sku,
    stock: Number(row.stock),
    costPrice: row.cost_price != null ? Number(row.cost_price) : null,
    sellingPrice: row.selling_price != null ? Number(row.selling_price) : null,
    lowStockThreshold: Number(row.low_stock_threshold),
    createdAt: row.created_at,
  };
}

function fromProduct(obj) {
  return {
    name: obj.name,
    category: obj.category,
    sku: obj.sku,
    stock: obj.stock,
    cost_price: obj.costPrice,
    selling_price: obj.sellingPrice,
    low_stock_threshold: obj.lowStockThreshold,
    created_at: obj.createdAt,
  };
}

// ── RepairJob ──
function toRepairJob(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    deviceId: row.device_id,
    mobileBrand: row.mobile_brand,
    mobileModel: row.mobile_model,
    imei: row.imei,
    color: row.color || '',
    phonePassword: row.phone_password || '',
    problemDescription: row.problem_description,
    repairNotes: row.repair_notes,
    estimatedCost: row.estimated_cost != null ? Number(row.estimated_cost) : null,
    laborCost: row.labor_cost != null ? Number(row.labor_cost) : null,
    extraCost: row.extra_cost != null ? Number(row.extra_cost) : null,
    extraCostLabel: row.extra_cost_label || '',
    finalCost: row.final_cost != null ? Number(row.final_cost) : null,
    status: row.status,
    receiptNumber: row.receipt_number,
    receivedAt: row.received_at,
    deliveredAt: row.delivered_at,
  };
}

function fromRepairJob(obj) {
  return {
    customer_id: obj.customerId,
    device_id: obj.deviceId,
    mobile_brand: obj.mobileBrand,
    mobile_model: obj.mobileModel,
    imei: obj.imei,
    color: obj.color || '',
    phone_password: obj.phonePassword || '',
    problem_description: obj.problemDescription,
    repair_notes: obj.repairNotes,
    estimated_cost: obj.estimatedCost,
    labor_cost: obj.laborCost,
    extra_cost: obj.extraCost,
    extra_cost_label: obj.extraCostLabel || '',
    final_cost: obj.finalCost,
    status: obj.status,
    receipt_number: obj.receiptNumber,
    received_at: obj.receivedAt,
    delivered_at: obj.deliveredAt,
  };
}

// ── Sale ──
function toSale(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    saleType: row.sale_type,
    items: row.items,
    totalAmount: row.total_amount != null ? Number(row.total_amount) : null,
    discount: row.discount != null ? Number(row.discount) : 0,
    paymentMethod: row.payment_method,
    receiptNumber: row.receipt_number,
    createdAt: row.created_at,
  };
}

function fromSale(obj) {
  return {
    customer_id: obj.customerId,
    sale_type: obj.saleType,
    items: obj.items,
    total_amount: obj.totalAmount,
    discount: obj.discount,
    payment_method: obj.paymentMethod,
    receipt_number: obj.receiptNumber,
    created_at: obj.createdAt,
  };
}

// ── Settings ──
function toSettings(row) {
  return {
    id: row.id,
    shopName: row.shop_name,
    shopPhone: row.shop_phone,
    shopAddress: row.shop_address,
    shopLogo: row.shop_logo || '',
    lastRepairSeq: Number(row.last_repair_seq),
    lastRepairDate: row.last_repair_date,
    lastSaleSeq: Number(row.last_sale_seq),
    lastSaleDate: row.last_sale_date,
  };
}

function fromSettings(obj) {
  return {
    shop_name: obj.shopName,
    shop_phone: obj.shopPhone,
    shop_address: obj.shopAddress,
    shop_logo: obj.shopLogo || null,
    last_repair_seq: obj.lastRepairSeq,
    last_repair_date: obj.lastRepairDate,
    last_sale_seq: obj.lastSaleSeq,
    last_sale_date: obj.lastSaleDate,
  };
}

// ── Device ──
function toDevice(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    brand: row.brand,
    model: row.model,
    imei: row.imei,
    color: row.color,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function fromDevice(obj) {
  return {
    customer_id: obj.customerId,
    brand: obj.brand,
    model: obj.model,
    imei: obj.imei,
    color: obj.color,
    notes: obj.notes,
    created_at: obj.createdAt,
  };
}

// ── RepairPart ──
function toRepairPart(row) {
  return {
    id: row.id,
    repairJobId: row.repair_job_id,
    productId: row.product_id,
    productName: row.product_name,
    costPrice: row.cost_price != null ? Number(row.cost_price) : 0,
    sellingPrice: row.selling_price != null ? Number(row.selling_price) : 0,
    quantity: Number(row.quantity),
  };
}

function fromRepairPart(obj) {
  return {
    repair_job_id: obj.repairJobId,
    product_id: obj.productId,
    product_name: obj.productName,
    cost_price: obj.costPrice,
    selling_price: obj.sellingPrice,
    quantity: obj.quantity,
  };
}

// ── Expense ──
function toExpense(row) {
  return {
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    note: row.note,
    date: row.date,
    createdAt: row.created_at,
  };
}

function fromExpense(obj) {
  return {
    category: obj.category,
    amount: obj.amount,
    note: obj.note,
    date: obj.date,
    created_at: obj.createdAt,
  };
}

// ── StockPurchase ──
function toStockPurchase(row) {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: Number(row.quantity),
    unitCost: Number(row.unit_cost),
    totalCost: Number(row.total_cost),
    supplier: row.supplier,
    note: row.note,
    date: row.date,
    createdAt: row.created_at,
  };
}

function fromStockPurchase(obj) {
  return {
    product_id: obj.productId,
    product_name: obj.productName,
    quantity: obj.quantity,
    unit_cost: obj.unitCost,
    total_cost: obj.totalCost,
    supplier: obj.supplier,
    note: obj.note,
    date: obj.date,
    created_at: obj.createdAt,
  };
}

// ─── Customers ─────────────────────────────────────────────────────

export async function getCustomers() {
  const { data, error } = await supabase.from('customers').select('*').order('name');
  if (error) throw new Error(error.message);
  return data.map(toCustomer);
}

export async function getCustomer(id) {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return toCustomer(data);
}

export async function searchCustomers(query) {
  const q = `%${query}%`;
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.${q},phone.ilike.${q}`)
    .order('name');
  if (error) throw new Error(error.message);
  return data.map(toCustomer);
}

export async function addCustomer(customer) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('customers')
    .insert(fromCustomer({ ...customer, createdAt: now, updatedAt: now }))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toCustomer(data).id;
}

export async function updateCustomer(id, data) {
  const { error } = await supabase
    .from('customers')
    .update(fromCustomer({ ...data, updatedAt: new Date().toISOString() }))
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCustomer(id) {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getCustomerByPhone(phone) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCustomer(data) : null;
}

// ─── Products ──────────────────────────────────────────────────────

export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw new Error(error.message);
  return data.map(toProduct);
}

export async function getProduct(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return toProduct(data);
}

export async function addProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert(fromProduct(product))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toProduct(data).id;
}

export async function updateProduct(id, data) {
  const { error } = await supabase
    .from('products')
    .update(fromProduct(data))
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function adjustStock(id, delta) {
  const { data, error } = await supabase
    .from('products')
    .select('stock')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  if (!data) return;
  const newStock = Math.max(0, Number(data.stock) + delta);
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', id);
  if (updateError) throw new Error(updateError.message);
}

// ─── Repair Jobs ───────────────────────────────────────────────────

export async function getRepairJobs() {
  const { data, error } = await supabase
    .from('repair_jobs')
    .select('*')
    .order('received_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(toRepairJob);
}

export async function getRepairJob(id) {
  const { data, error } = await supabase
    .from('repair_jobs')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return toRepairJob(data);
}

export async function addRepairJob(job) {
  const { data, error } = await supabase
    .from('repair_jobs')
    .insert(fromRepairJob(job))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toRepairJob(data).id;
}

export async function updateRepairJob(id, data) {
  const { error } = await supabase
    .from('repair_jobs')
    .update(fromRepairJob(data))
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteRepairJob(id) {
  const { error } = await supabase.from('repair_jobs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getRepairJobsByCustomer(customerId) {
  const { data, error } = await supabase
    .from('repair_jobs')
    .select('*')
    .eq('customer_id', customerId)
    .order('received_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(toRepairJob);
}

export async function searchRepairJobs(query) {
  const q = `%${query}%`;

  const { data: byFields, error: e1 } = await supabase
    .from('repair_jobs')
    .select('*')
    .or(`receipt_number.ilike.${q},mobile_brand.ilike.${q},mobile_model.ilike.${q},imei.ilike.${q},problem_description.ilike.${q}`)
    .order('received_at', { ascending: false });
  if (e1) throw new Error(e1.message);

  const { data: byCustomer, error: e2 } = await supabase
    .from('repair_jobs')
    .select('*, customers!inner(name, phone)')
    .or(`customers.name.ilike.${q},customers.phone.ilike.${q}`)
    .order('received_at', { ascending: false });
  if (e2) throw new Error(e2.message);

  const seen = new Set();
  const merged = [...(byFields || []), ...(byCustomer || [])].filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return merged.map(toRepairJob);
}

export async function getRepairJobsInRange(startDate, endDate) {
  const end = endDate.slice(0, 10) + 'T23:59:59.999Z';
  const { data, error } = await supabase
    .from('repair_jobs')
    .select('*')
    .gte('received_at', startDate)
    .lte('received_at', end)
    .order('received_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(toRepairJob);
}

// ─── Sales ─────────────────────────────────────────────────────────

export async function getSales() {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(toSale);
}

export async function getSale(id) {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return toSale(data);
}

export async function addSale(sale) {
  const { data, error } = await supabase
    .from('sales')
    .insert(fromSale(sale))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toSale(data).id;
}

export async function updateSale(id, data) {
  const { error } = await supabase
    .from('sales')
    .update(fromSale(data))
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSale(id) {
  const { data: sale, error: fetchErr } = await supabase
    .from('sales')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  if (sale?.items?.length) {
    for (const item of sale.items) {
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.productId)
        .single();
      if (prodErr) throw new Error(prodErr.message);
      if (product) {
        const { error: updErr } = await supabase
          .from('products')
          .update({ stock: (product.stock || 0) + item.quantity })
          .eq('id', item.productId);
        if (updErr) throw new Error(updErr.message);
      }
    }
  }

  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getSalesByCustomer(customerId) {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(toSale);
}

export async function searchSales(query) {
  const q = `%${query}%`;

  const { data: byFields, error: e1 } = await supabase
    .from('sales')
    .select('*')
    .or(`receipt_number.ilike.${q}`)
    .order('created_at', { ascending: false });
  if (e1) throw new Error(e1.message);

  const { data: byCustomer, error: e2 } = await supabase
    .from('sales')
    .select('*, customers!inner(name, phone)')
    .or(`customers.name.ilike.${q},customers.phone.ilike.${q}`)
    .order('created_at', { ascending: false });
  if (e2) throw new Error(e2.message);

  const seen = new Set();
  const merged = [...(byFields || []), ...(byCustomer || [])].filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  return merged.map(toSale);
}

export async function getSalesInRange(startDate, endDate) {
  const end = endDate.slice(0, 10) + 'T23:59:59.999Z';
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', end)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(toSale);
}

// ─── Settings ──────────────────────────────────────────────────────

export async function getSettings() {
  let { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from('settings')
      .insert({ id: 1, shop_name: 'My Shop' })
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);
    data = inserted;
  }

  return toSettings(data);
}

export async function updateSettings(data) {
  const { error } = await supabase
    .from('settings')
    .update(fromSettings(data))
    .eq('id', 1);
  if (error) throw new Error(error.message);
}

// ─── Receipt Sequence ──────────────────────────────────────────────

export async function getNextRepairSeq() {
  const { data, error } = await supabase.rpc('next_receipt_seq', {
    receipt_type: 'repair',
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function getNextSaleSeq() {
  const { data, error } = await supabase.rpc('next_receipt_seq', {
    receipt_type: 'sale',
  });
  if (error) throw new Error(error.message);
  return data;
}

// ─── Backup ────────────────────────────────────────────────────────

export async function exportData() {
  const [customers, products, repairJobs, sales, settings, devices, repairParts, expenses, stockPurchases] =
    await Promise.all([
      supabase.from('customers').select('*').then((r) => r.data),
      supabase.from('products').select('*').then((r) => r.data),
      supabase.from('repair_jobs').select('*').then((r) => r.data),
      supabase.from('sales').select('*').then((r) => r.data),
      supabase.from('settings').select('*').then((r) => r.data),
      supabase.from('devices').select('*').then((r) => r.data),
      supabase.from('repair_parts').select('*').then((r) => r.data),
      supabase.from('expenses').select('*').then((r) => r.data),
      supabase.from('stock_purchases').select('*').then((r) => r.data),
    ]);
  return { customers, products, repairJobs, sales, settings, devices, repairParts, expenses, stockPurchases };
}

export async function importData(json) {
  const skipTables = ['settings'];
  for (const [table, rows] of Object.entries(json)) {
    if (skipTables.includes(table) || !rows?.length) continue;
    const { error } = await supabase.from(table).upsert(rows);
    if (error) throw new Error(error.message);
  }
}

// ============================================================
//  NEW — Devices
// ============================================================

export async function getDevicesByCustomer(customerId) {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(toDevice);
}

export async function getDeviceByIMEI(imei) {
  if (!imei) return null;
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('imei', imei)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toDevice(data) : null;
}

export async function addDevice(device) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('devices')
    .insert(fromDevice({ ...device, createdAt: now }))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toDevice(data);
}

export async function updateDevice(id, deviceData) {
  const { data, error } = await supabase
    .from('devices')
    .update(fromDevice(deviceData))
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toDevice(data);
}

// ============================================================
//  NEW — Repair Parts
// ============================================================

export async function getRepairParts(repairJobId) {
  const { data, error } = await supabase
    .from('repair_parts')
    .select('*')
    .eq('repair_job_id', repairJobId);
  if (error) throw new Error(error.message);
  return data.map(toRepairPart);
}

export async function addRepairParts(repairJobId, parts) {
  const rows = parts.map((p) => ({
    repair_job_id: repairJobId,
    product_id: p.productId,
    product_name: p.productName,
    cost_price: p.costPrice,
    selling_price: p.sellingPrice,
    quantity: p.quantity,
  }));
  const { error } = await supabase.from('repair_parts').insert(rows);
  if (error) throw new Error(error.message);
}

export async function deleteRepairParts(repairJobId) {
  const { error } = await supabase
    .from('repair_parts')
    .delete()
    .eq('repair_job_id', repairJobId);
  if (error) throw new Error(error.message);
}

export async function restoreRepairPartsStock(repairJobId) {
  const { data: parts } = await supabase
    .from('repair_parts')
    .select('*')
    .eq('repair_job_id', repairJobId);
  if (!parts) return;
  for (const part of parts) {
    await supabase.rpc('increment_stock', {
      product_id: part.product_id,
      amount: part.quantity,
    });
  }
}

// ============================================================
//  NEW — Expenses
// ============================================================

export async function getExpenses(rangeStart, rangeEnd) {
  let query = supabase.from('expenses').select('*').order('date', { ascending: false });
  if (rangeStart && rangeEnd) {
    query = query.gte('date', rangeStart).lte('date', rangeEnd);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map(toExpense);
}

export async function addExpense(expense) {
  const { data, error } = await supabase
    .from('expenses')
    .insert(fromExpense(expense))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toExpense(data).id;
}

export async function updateExpense(id, data) {
  const { error } = await supabase
    .from('expenses')
    .update(fromExpense(data))
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ============================================================
//  NEW — Stock Purchases
// ============================================================

export async function getStockPurchases(rangeStart, rangeEnd) {
  let query = supabase.from('stock_purchases').select('*').order('date', { ascending: false });
  if (rangeStart && rangeEnd) {
    query = query.gte('date', rangeStart).lte('date', rangeEnd);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map(toStockPurchase);
}

export async function addStockPurchase(purchase) {
  const { data, error } = await supabase
    .from('stock_purchases')
    .insert(fromStockPurchase(purchase))
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Increment stock
  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', purchase.productId)
    .single();
  if (product) {
    await supabase
      .from('products')
      .update({ stock: product.stock + purchase.quantity })
      .eq('id', purchase.productId);
  }

  return toStockPurchase(data).id;
}

export async function deleteStockPurchase(id) {
  const { data: purchase } = await supabase
    .from('stock_purchases')
    .select('*')
    .eq('id', id)
    .single();

  if (purchase) {
    // Decrement stock
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', purchase.product_id)
      .single();
    if (product) {
      await supabase
        .from('products')
        .update({ stock: Math.max(0, product.stock - purchase.quantity) })
        .eq('id', purchase.product_id);
    }
  }

  const { error } = await supabase.from('stock_purchases').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ============================================================
//  NEW — Analytics
// ============================================================

export async function getAnalyticsData(rangeStart, rangeEnd) {
  const [
    { data: salesData },
    { data: repairsData },
    { data: repairPartsData },
    { data: expensesData },
    { data: stockPurchasesData },
  ] = await Promise.all([
    supabase.from('sales').select('*'),
    supabase.from('repair_jobs').select('*'),
    supabase.from('repair_parts').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('stock_purchases').select('*'),
  ]);

  const allSales = (salesData || []).map(toSale);
  const allRepairs = (repairsData || []).map(toRepairJob);
  const allRepairParts = (repairPartsData || []).map(toRepairPart);
  const allExpenses = (expensesData || []).map(toExpense);
  const allStockPurchases = (stockPurchasesData || []).map(toStockPurchase);

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

  // --- Charts: daily ---
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

  // --- Charts: monthly ---
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

  const withTimes = deliveredRepairs.filter((r) => r.receivedAt && r.deliveredAt);
  const avgTurnaroundHours =
    withTimes.length > 0
      ? withTimes.reduce((s, r) => s + (new Date(r.deliveredAt) - new Date(r.receivedAt)) / 3600000, 0) / withTimes.length
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
    revenue: { sales: salesRevenue, repairs: repairRevenue, total: totalRevenue },
    cogs: { sales: salesCOGS, repairs: repairCOGS, total: totalCOGS },
    grossProfit,
    expenses: { total: expensesTotal, byCategory, log: filteredExpenses },
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
