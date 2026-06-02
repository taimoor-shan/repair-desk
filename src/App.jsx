import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import Sidebar from './components/Sidebar';

import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import CustomerDetail from './pages/customers/CustomerDetail';
import RepairList from './pages/repairs/RepairList';
import RepairForm from './pages/repairs/RepairForm';
import RepairDetail from './pages/repairs/RepairDetail';
import SaleList from './pages/sales/SaleList';
import SaleForm from './pages/sales/SaleForm';
import SaleDetail from './pages/sales/SaleDetail';
import ProductList from './pages/inventory/ProductList';
import ProductForm from './pages/inventory/ProductForm';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-700 p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-900">Repair Desk</h1>
      </div>

      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-auto min-w-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/:id/edit" element={<CustomerForm />} />
          <Route path="/repairs" element={<RepairList />} />
          <Route path="/repairs/new" element={<RepairForm />} />
          <Route path="/repairs/:id" element={<RepairDetail />} />
          <Route path="/sales" element={<SaleList />} />
          <Route path="/sales/new" element={<SaleForm />} />
          <Route path="/sales/:id" element={<SaleDetail />} />
          <Route path="/inventory" element={<ProductList />} />
          <Route path="/inventory/new" element={<ProductForm />} />
          <Route path="/inventory/:id/edit" element={<ProductForm />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <ConfirmProvider>
          <Layout />
        </ConfirmProvider>
      </ToastProvider>
    </HashRouter>
  );
}
