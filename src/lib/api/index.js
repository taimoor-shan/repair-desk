const backend = import.meta.env.VITE_DB_BACKEND || 'dexie';

let adapter;

if (backend === 'supabase') {
  adapter = await import('./adapter.supabase.js');
} else {
  adapter = await import('./adapter.dexie.js');
}

export const {
  getCustomers,
  getCustomer,
  searchCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerByPhone,
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getRepairJobs,
  getRepairJob,
  addRepairJob,
  updateRepairJob,
  deleteRepairJob,
  getRepairJobsByCustomer,
  getSales,
  getSale,
  addSale,
  updateSale,
  deleteSale,
  getSalesByCustomer,
  getSettings,
  updateSettings,
  getNextRepairSeq,
  getNextSaleSeq,
  exportData,
  importData,
} = adapter;
