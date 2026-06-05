import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/customers', label: 'Customers', icon: '👤' },
  { to: '/repairs', label: 'Repairs', icon: '🔧' },
  { to: '/sales', label: 'Sales', icon: '💰' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-56 bg-gray-900 text-white flex flex-col shrink-0 transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-700">
          <h1 className="text-lg font-bold tracking-tight">Repair Desk</h1>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
