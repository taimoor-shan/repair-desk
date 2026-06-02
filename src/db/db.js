import Dexie from 'dexie';

const db = new Dexie('RepairDesk');

db.version(1).stores({
  customers: '++id, &phone, name',
  products: '++id, name, category, stock',
  repairJobs: '++id, customerId, status, receivedAt',
  sales: '++id, customerId, saleType, createdAt',
  settings: 'id',
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

export async function addProduct(product) {
  return db.products.add({ ...product, createdAt: new Date().toISOString() });
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
  return db.sales.delete(Number(id));
}

export async function getSalesByCustomer(customerId) {
  return db.sales
    .where('customerId')
    .equals(Number(customerId))
    .reverse()
    .sortBy('createdAt');
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

export default db;
