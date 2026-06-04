import { supabase } from '../supabase';

// ─── Column Mappers ───────────────────────────────────────────────
// Supabase returns snake_case. Our app uses camelCase.
// Every read/write function maps through these.

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
    mobileBrand: row.mobile_brand,
    mobileModel: row.mobile_model,
    imei: row.imei,
    problemDescription: row.problem_description,
    repairNotes: row.repair_notes,
    estimatedCost: row.estimated_cost != null ? Number(row.estimated_cost) : null,
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
    mobile_brand: obj.mobileBrand,
    mobile_model: obj.mobileModel,
    imei: obj.imei,
    problem_description: obj.problemDescription,
    repair_notes: obj.repairNotes,
    estimated_cost: obj.estimatedCost,
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
  const [customers, products, repairJobs, sales, settings] = await Promise.all([
    supabase.from('customers').select('*').then(r => r.data),
    supabase.from('products').select('*').then(r => r.data),
    supabase.from('repair_jobs').select('*').then(r => r.data),
    supabase.from('sales').select('*').then(r => r.data),
    supabase.from('settings').select('*').then(r => r.data),
  ]);
  return { customers, products, repairJobs, sales, settings };
}

export async function importData(json) {
  const skipTables = ['settings'];
  for (const [table, rows] of Object.entries(json)) {
    if (skipTables.includes(table) || !rows?.length) continue;
    const { error } = await supabase.from(table).upsert(rows);
    if (error) throw new Error(error.message);
  }
}
