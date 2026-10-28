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
    shopHours: row.shop_hours || '',
    currency: row.currency || 'EUR',
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
    shop_hours: obj.shopHours || '',
    currency: obj.currency || 'EUR',
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
    totalCost: row.total_cost != null ? Number(row.total_cost) : null,
    costLayers: row.cost_layers || [],
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
    total_cost: obj.totalCost,
    cost_layers: obj.costLayers,
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
    remainingQuantity: row.remaining_quantity != null ? Number(row.remaining_quantity) : Number(row.quantity),
    unitCost: Number(row.unit_cost),
    totalCost: Number(row.total_cost),
    supplier: row.supplier,
    note: row.note,
    date: row.date,
    cashOutflow: row.cash_outflow !== false,
    createdAt: row.created_at,
  };
}

function fromStockPurchase(obj) {
  return {
    product_id: obj.productId,
    product_name: obj.productName,
    quantity: obj.quantity,
    remaining_quantity: obj.remainingQuantity,
    unit_cost: obj.unitCost,
    total_cost: obj.totalCost,
    supplier: obj.supplier,
    note: obj.note,
    date: obj.date,
    cash_outflow: obj.cashOutflow,
    created_at: obj.createdAt,
  };
}

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

function normalizeRepairParts(parts) {
  const merged = new Map();
  for (const part of parts || []) {
    const productId = Number(part.productId);
    const quantity = Number(part.quantity);
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Every repair part needs a product and a quantity of at least 1.');
    }
    const key = String(productId);
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += quantity;
      if (part.sellingPrice !== undefined) existing.sellingPrice = part.sellingPrice;
      if (part.productName) existing.productName = part.productName;
    } else {
      merged.set(key, {
        productId,
        productName: part.productName,
        quantity,
        sellingPrice: part.sellingPrice,
        costPrice: part.costPrice,
      });
    }
  }
  return [...merged.values()];
}

async function rollbackConsumedItems(items, originalError) {
  const failures = [];
  for (const item of items) {
    try {
      await restoreInventory(item);
    } catch (err) {
      failures.push(`${item.productName || item.productId}: ${err.message}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `${originalError.message} Inventory rollback failed for ${failures.join('; ')}. Verify stock manually.`
    );
  }
  throw originalError;
}

async function rollbackRestoredItems(items, originalError) {
  const failures = [];
  for (const item of items) {
    try {
      await consumeInventory(item.productId, item.quantity);
    } catch (err) {
      failures.push(`${item.productName || item.productId}: ${err.message}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `${originalError.message} Inventory rollback failed for ${failures.join('; ')}. Verify stock manually.`
    );
  }
  throw originalError;
}

async function ensureCostLayersForProduct(product) {
  const { data, error } = await supabase
    .from('stock_purchases')
    .select('*')
    .eq('product_id', product.id);
  if (error) throw new Error(error.message);

  const remainingTotal = (data || []).reduce(
    (sum, row) => sum + (Number(row.remaining_quantity ?? row.quantity) || 0),
    0
  );
  const stock = Math.max(0, Number(product.stock) || 0);
  if (remainingTotal >= stock) return;

  const cost = Number(product.costPrice) || 0;
  if (cost <= 0) {
    throw new Error(`Set a cost price for "${product.name}" before selling or using stock.`);
  }

  const quantity = stock - remainingTotal;
  const { error: insertError } = await supabase.from('stock_purchases').insert(fromStockPurchase({
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
  }));
  if (insertError) throw new Error(insertError.message);
}

async function consumeInventory(productId, quantity) {
  const qty = Number(quantity) || 0;
  if (qty <= 0) throw new Error('Quantity must be greater than zero.');

  const product = await getProduct(productId);
  if (!product) throw new Error('Product not found.');
  if ((Number(product.stock) || 0) < qty) {
    throw new Error(`Only ${product.stock || 0} in stock for "${product.name}".`);
  }

  await ensureCostLayersForProduct(product);

  const { data, error } = await supabase
    .from('stock_purchases')
    .select('*')
    .eq('product_id', productId);
  if (error) throw new Error(error.message);

  const lots = (data || [])
    .map(toStockPurchase)
    .filter((lot) => (Number(lot.remainingQuantity ?? lot.quantity) || 0) > 0)
    .sort(sortLots);

  let remaining = qty;
  let totalCost = 0;
  const layers = [];
  const appliedLots = [];

  try {
    for (const lot of lots) {
      if (remaining <= 0) break;
      const lotRemaining = Number(lot.remainingQuantity ?? lot.quantity) || 0;
      const take = Math.min(lotRemaining, remaining);
      if (take <= 0) continue;

      const unitCost = Number(lot.unitCost) || 0;
      const { error: updateLotError } = await supabase
        .from('stock_purchases')
        .update({ remaining_quantity: lotRemaining - take })
        .eq('id', lot.id);
      if (updateLotError) throw new Error(updateLotError.message);

      appliedLots.push({ id: lot.id, previous: lotRemaining });
      layers.push({ purchaseId: lot.id, quantity: take, unitCost });
      totalCost += take * unitCost;
      remaining -= take;
    }

    if (remaining > 0) {
      throw new Error(`Not enough costed stock for "${product.name}". Add a purchase with unit cost first.`);
    }

    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: (Number(product.stock) || 0) - qty })
      .eq('id', productId);
    if (stockError) throw new Error(stockError.message);
  } catch (err) {
    const rollbackErrors = [];
    for (const applied of appliedLots.reverse()) {
      const { error: rollbackError } = await supabase
        .from('stock_purchases')
        .update({ remaining_quantity: applied.previous })
        .eq('id', applied.id);
      if (rollbackError) rollbackErrors.push(rollbackError.message);
    }
    if (rollbackErrors.length > 0) {
      throw new Error(
        `${err.message} Inventory rollback failed: ${rollbackErrors.join('; ')}. Verify stock manually.`,
        { cause: err }
      );
    }
    throw err;
  }

  return {
    layers,
    totalCost,
    unitCost: qty > 0 ? totalCost / qty : 0,
  };
}

async function restoreInventory(item) {
  const qty = Number(item.quantity) || 0;
  if (qty <= 0) return;

  const product = await getProduct(item.productId).catch(() => null);
  const originalStock = product ? Number(product.stock) || 0 : null;

  if (product) {
    const { error } = await supabase
      .from('products')
      .update({ stock: originalStock + qty })
      .eq('id', item.productId);
    if (error) throw new Error(error.message);
  }

  const restoredLots = [];
  try {
    if (Array.isArray(item.costLayers) && item.costLayers.length > 0) {
      for (const layer of item.costLayers) {
        const { data: purchase, error: fetchError } = await supabase
          .from('stock_purchases')
          .select('remaining_quantity, quantity')
          .eq('id', layer.purchaseId)
          .single();
        if (fetchError) throw new Error(fetchError.message);
        const previous = Number(purchase.remaining_quantity ?? purchase.quantity) || 0;
        const { error: updateError } = await supabase
          .from('stock_purchases')
          .update({
            remaining_quantity: previous + (Number(layer.quantity) || 0),
          })
          .eq('id', layer.purchaseId);
        if (updateError) throw new Error(updateError.message);
        restoredLots.push({ id: layer.purchaseId, previous });
      }
    } else {
      const unitCost = Number(item.unitCost ?? item.costPrice ?? product?.costPrice) || 0;
      if (unitCost > 0) {
        const { error } = await supabase.from('stock_purchases').insert(fromStockPurchase({
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
        }));
        if (error) throw new Error(error.message);
      }
    }
  } catch (err) {
    const rollbackErrors = [];
    if (product) {
      const { error } = await supabase
        .from('products')
        .update({ stock: originalStock })
        .eq('id', item.productId);
      if (error) rollbackErrors.push(error.message);
    }
    for (const restored of restoredLots.reverse()) {
      const { error } = await supabase
        .from('stock_purchases')
        .update({ remaining_quantity: restored.previous })
        .eq('id', restored.id);
      if (error) rollbackErrors.push(error.message);
    }
    if (rollbackErrors.length > 0) {
      throw new Error(
        `${err.message} Inventory rollback failed: ${rollbackErrors.join('; ')}. Verify stock manually.`,
        { cause: err }
      );
    }
    throw err;
  }
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
  // Records stay, but are detached from the deleted customer and show as Walk-in.
  const { error: repairError } = await supabase
    .from('repair_jobs')
    .update({ customer_id: null })
    .eq('customer_id', id);
  if (repairError) throw new Error(repairError.message);

  const { error: saleError } = await supabase
    .from('sales')
    .update({ customer_id: null })
    .eq('customer_id', id);
  if (saleError) throw new Error(saleError.message);

  const { error: deviceError } = await supabase
    .from('devices')
    .update({ customer_id: null })
    .eq('customer_id', id);
  if (deviceError) throw new Error(deviceError.message);

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

export async function getProductBySku(sku) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('sku', sku)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProduct(data) : null;
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

export async function addProductWithInitialStock(product) {
  // Normalize empty SKU to null so PostgreSQL UNIQUE constraint ignores it
  if (product.sku === '') product.sku = null;

  const productId = await addProduct(product);

  if (product.stock > 0) {
    if (!(Number(product.costPrice) > 0)) {
      throw new Error('Cost price is required when adding opening stock.');
    }
    const { error } = await supabase
      .from('stock_purchases')
      .insert(fromStockPurchase({
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
      }));
    if (error) throw new Error(error.message);
  }

  return productId;
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
  const amount = Number(delta) || 0;
  if (amount === 0) return;
  if (amount > 0) {
    throw new Error('Use Restock or New Purchase to increase stock with a unit cost.');
  }

  const product = await getProduct(id);
  const allocation = await consumeInventory(id, Math.abs(amount));
  const consumed = {
    productId: Number(id),
    productName: product.name,
    quantity: Math.abs(amount),
    costPrice: allocation.unitCost,
    costLayers: allocation.layers,
  };
  const { error } = await supabase.from('expenses').insert(fromExpense({
    category: 'Inventory Adjustment',
    amount: allocation.totalCost,
    note: `Stock decreased: ${product.name}`,
    date: new Date().toISOString().slice(0, 10),
  }));
  if (error) {
    await rollbackConsumedItems([consumed], new Error(error.message));
  }
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
  const parts = await getRepairParts(id);
  const restored = [];
  try {
    for (const part of parts) {
      await restoreInventory(part);
      restored.push(part);
    }
  } catch (err) {
    return rollbackRestoredItems(restored, err);
  }

  if (parts.length > 0) {
    const { error: partsErr } = await supabase
      .from('repair_parts')
      .delete()
      .eq('repair_job_id', id);
    if (partsErr) return rollbackRestoredItems(parts, new Error(partsErr.message));
  }

  const { error } = await supabase.from('repair_jobs').delete().eq('id', id);
  if (error) {
    const rollbackErrors = [];
    if (parts.length > 0) {
      const { error: reinsertError } = await supabase
        .from('repair_parts')
        .insert(parts.map((part) => fromRepairPart(part)));
      if (reinsertError) rollbackErrors.push(reinsertError.message);
    }
    for (const part of parts) {
      try {
        await consumeInventory(part.productId, part.quantity);
      } catch (err) {
        rollbackErrors.push(`${part.productName || part.productId}: ${err.message}`);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new Error(
        `${error.message} Rollback failed: ${rollbackErrors.join('; ')}. Verify repair parts and stock manually.`
      );
    }
    throw new Error(error.message);
  }
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
  const items = [];
  try {
    for (const item of sale.items || []) {
      const allocation = await consumeInventory(item.productId, item.quantity);
      items.push(normalizeCostedItem(item, allocation));
    }
  } catch (err) {
    return rollbackConsumedItems(items, err);
  }

  const { data, error } = await supabase
    .from('sales')
    .insert(fromSale({ ...sale, items }))
    .select()
    .single();
  if (error) {
    return rollbackConsumedItems(items, new Error(error.message));
  }
  return toSale(data).id;
}

export async function updateSale(id, data) {
  const existing = await getSale(id);
  const oldItems = existing?.items || [];

  const restored = [];
  try {
    for (const item of oldItems) {
      await restoreInventory(item);
      restored.push(item);
    }
  } catch (err) {
    return rollbackRestoredItems(restored, err);
  }

  const items = [];
  const rollback = async (originalError) => {
    const rollbackErrors = [];
    for (const item of items) {
      try {
        await restoreInventory(item);
      } catch (err) {
        rollbackErrors.push(`${item.productName || item.productId}: ${err.message}`);
      }
    }
    for (const item of oldItems) {
      try {
        await consumeInventory(item.productId, item.quantity);
      } catch (err) {
        rollbackErrors.push(`${item.productName || item.productId}: ${err.message}`);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new Error(
        `${originalError.message} Inventory rollback failed: ${rollbackErrors.join('; ')}. Verify stock manually.`
      );
    }
    throw originalError;
  };

  try {
    for (const item of data.items || []) {
      const allocation = await consumeInventory(item.productId, item.quantity);
      items.push(normalizeCostedItem(item, allocation));
    }
  } catch (err) {
    return rollback(err);
  }

  const { error } = await supabase
    .from('sales')
    .update(fromSale({ ...data, items }))
    .eq('id', id);
  if (error) return rollback(new Error(error.message));
}

export async function deleteSale(id) {
  const { data: sale, error: fetchErr } = await supabase
    .from('sales')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const items = sale?.items || [];
  const restored = [];
  try {
    for (const item of items) {
      await restoreInventory(item);
      restored.push(item);
    }
  } catch (err) {
    return rollbackRestoredItems(restored, err);
  }

  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) return rollbackRestoredItems(items, new Error(error.message));
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
      .insert({ id: 1, shop_name: 'My Shop', currency: 'EUR' })
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
      supabase.from('customers').select('*').then((r) => (r.data || []).map(toCustomer)),
      supabase.from('products').select('*').then((r) => (r.data || []).map(toProduct)),
      supabase.from('repair_jobs').select('*').then((r) => (r.data || []).map(toRepairJob)),
      supabase.from('sales').select('*').then((r) => (r.data || []).map(toSale)),
      supabase.from('settings').select('*').then((r) => (r.data || []).map(toSettings)),
      supabase.from('devices').select('*').then((r) => (r.data || []).map(toDevice)),
      supabase.from('repair_parts').select('*').then((r) => (r.data || []).map(toRepairPart)),
      supabase.from('expenses').select('*').then((r) => (r.data || []).map(toExpense)),
      supabase.from('stock_purchases').select('*').then((r) => (r.data || []).map(toStockPurchase)),
    ]);
  return { customers, products, repairJobs, sales, settings, devices, repairParts, expenses, stockPurchases };
}

export async function importData(json) {
  const skipTables = ['settings'];

  // Map camelCase app-format rows to snake_case DB columns
  const mappers = {
    customers:      (rows) => rows.map((r) => fromCustomer(r)),
    products:       (rows) => {
      const seen = new Set();
      return rows.map((p, i) => {
        let sku = (p.sku && typeof p.sku === 'string' ? p.sku.trim() : '');
        if (!sku) sku = `SKU-${String(i + 1).padStart(4, '0')}`;
        if (seen.has(sku)) {
          let suffix = 2;
          let newSku;
          do { newSku = `${sku}-${suffix}`; suffix++; } while (seen.has(newSku));
          sku = newSku;
        }
        seen.add(sku);
        return fromProduct({ ...p, sku });
      });
    },
    repairJobs:     (rows) => rows.map((r) => fromRepairJob(r)),
    sales:          (rows) => rows.map((s) => fromSale(s)),
    settings:       (rows) => rows.map((s) => fromSettings(s)),
    devices:        (rows) => rows.map((d) => fromDevice(d)),
    repairParts:    (rows) => rows.map((p) => fromRepairPart(p)),
    expenses:       (rows) => rows.map((e) => fromExpense(e)),
    stockPurchases: (rows) => rows.map((p) => fromStockPurchase(p)),
  };

  for (let [table, rows] of Object.entries(json)) {
    if (skipTables.includes(table) || !rows?.length) continue;
    if (mappers[table]) rows = mappers[table](rows);
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
  const normalized = normalizeRepairParts(parts);
  const rows = [];
  const consumed = [];
  try {
    for (const part of normalized) {
      const allocation = await consumeInventory(part.productId, part.quantity);
      consumed.push({
        productId: part.productId,
        productName: part.productName,
        quantity: part.quantity,
        costPrice: allocation.unitCost,
        costLayers: allocation.layers,
      });
      rows.push(fromRepairPart({
        repairJobId: Number(repairJobId),
        productId: part.productId,
        productName: part.productName,
        costPrice: allocation.unitCost,
        sellingPrice: part.sellingPrice,
        quantity: part.quantity,
        totalCost: allocation.totalCost,
        costLayers: allocation.layers,
      }));
    }
  } catch (err) {
    return rollbackConsumedItems(consumed, err);
  }
  if (rows.length === 0) return;
  const { error } = await supabase.from('repair_parts').insert(rows);
  if (error) return rollbackConsumedItems(consumed, new Error(error.message));
}

export async function replaceRepairParts(repairJobId, parts) {
  const id = Number(repairJobId);
  const normalized = normalizeRepairParts(parts);
  const existing = await getRepairParts(id);

  const restored = [];
  try {
    for (const part of existing) {
      await restoreInventory(part);
      restored.push(part);
    }
  } catch (err) {
    return rollbackRestoredItems(restored, err);
  }

  if (existing.length > 0) {
    const { error } = await supabase
      .from('repair_parts')
      .delete()
      .eq('repair_job_id', id);
    if (error) return rollbackRestoredItems(existing, new Error(error.message));
  }

  const consumed = [];
  const rows = [];

  const rollback = async (originalError) => {
    const rollbackErrors = [];
    for (const item of consumed) {
      try {
        await restoreInventory(item);
      } catch (err) {
        rollbackErrors.push(`${item.productName || item.productId}: ${err.message}`);
      }
    }
    for (const part of existing) {
      try {
        await consumeInventory(part.productId, part.quantity);
      } catch (err) {
        rollbackErrors.push(`${part.productName || part.productId}: ${err.message}`);
      }
    }
    if (existing.length > 0) {
      const { error: reinsertError } = await supabase
        .from('repair_parts')
        .insert(existing.map((part) => fromRepairPart(part)));
      if (reinsertError) rollbackErrors.push(reinsertError.message);
    }
    if (rollbackErrors.length > 0) {
      throw new Error(
        `${originalError.message} Rollback failed: ${rollbackErrors.join('; ')}. Verify repair parts and stock manually.`
      );
    }
    throw originalError;
  };

  try {
    for (const part of normalized) {
      const allocation = await consumeInventory(part.productId, part.quantity);
      consumed.push({
        productId: part.productId,
        productName: part.productName,
        quantity: part.quantity,
        costPrice: allocation.unitCost,
        costLayers: allocation.layers,
      });
      rows.push(fromRepairPart({
        repairJobId: id,
        productId: part.productId,
        productName: part.productName,
        costPrice: allocation.unitCost,
        sellingPrice: part.sellingPrice,
        quantity: part.quantity,
        totalCost: allocation.totalCost,
        costLayers: allocation.layers,
      }));
    }
  } catch (err) {
    return rollback(err);
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('repair_parts').insert(rows);
    if (error) return rollback(new Error(error.message));
  }
}

export async function deleteRepairParts(repairJobId) {
  const parts = await getRepairParts(repairJobId);
  const restored = [];
  try {
    for (const part of parts) {
      await restoreInventory(part);
      restored.push(part);
    }
  } catch (err) {
    return rollbackRestoredItems(restored, err);
  }

  const { error } = await supabase
    .from('repair_parts')
    .delete()
    .eq('repair_job_id', repairJobId);
  if (error) return rollbackRestoredItems(parts, new Error(error.message));
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
  const unitCost = Number(purchase.unitCost) || 0;
  const quantity = Number(purchase.quantity) || 0;
  if (quantity <= 0) throw new Error('Purchase quantity must be greater than zero.');
  if (unitCost <= 0) throw new Error('Unit cost is required for stock purchases.');

  const { data, error } = await supabase
    .from('stock_purchases')
    .insert(fromStockPurchase({
      ...purchase,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
      remainingQuantity: quantity,
      cashOutflow: true,
    }))
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Increment stock and update cost price
  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', purchase.productId)
    .single();
  if (product) {
    await supabase
      .from('products')
      .update({ stock: product.stock + quantity, cost_price: unitCost })
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
  if (!purchase) return;

  const remainingQuantity = Number(purchase.remaining_quantity ?? purchase.quantity) || 0;
  if (remainingQuantity < (Number(purchase.quantity) || 0)) {
    throw new Error('This purchase has already been sold or used. Void the related sale/repair first.');
  }

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
      return sum + s.items.reduce((is, item) => is + lineCost(item), 0);
    }, 0);

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

  // --- Charts: daily ---
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

  // --- Repair Stats (scoped to repairs delivered in the selected range) ---
  const deliveredInRange = allRepairs.filter(
    (r) => r.status === 'Delivered' && inRange(r.deliveredAt?.slice(0, 10))
  );

  const problemCount = {};
  deliveredInRange.forEach((r) => {
    if (!r.problemDescription) return;
    const key = r.problemDescription.slice(0, 60);
    problemCount[key] = (problemCount[key] || 0) + 1;
  });
  const topProblems = Object.entries(problemCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([problem, count]) => ({ problem, count }));

  const deliveredRepairs = deliveredInRange.filter((r) => r.finalCost != null);
  const avgFinalCost =
    deliveredRepairs.length > 0
      ? deliveredRepairs.reduce((s, r) => s + (r.finalCost || 0), 0) / deliveredRepairs.length
      : 0;

  const withTimes = deliveredRepairs.filter((r) => r.receivedAt && r.deliveredAt);
  const avgTurnaroundHours =
    withTimes.length > 0
      ? withTimes.reduce((s, r) => s + (new Date(r.deliveredAt) - new Date(r.receivedAt)) / 3600000, 0) / withTimes.length
      : 0;

  // --- Sales Stats (scoped to sales in the selected range) ---
  const productSales = {};
  allSales.filter((s) => inRange(s.createdAt?.slice(0, 10))).forEach((s) => {
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
