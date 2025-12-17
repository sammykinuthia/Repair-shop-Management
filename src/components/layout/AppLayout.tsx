// src/components/layout/AppLayout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Wrench,
  Users,
  ShieldCheck,
  LogOut,
  Search,
  SettingsIcon
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-blue-400 tracking-wider">
            ROYOL<span className="text-white">TECH</span>
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
            Solutions Product
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem to="/repairs" icon={<Wrench size={20} />} label="Repairs" />
          <NavItem to="/clients" icon={<Users size={20} />} label="Clients" />
          <NavItem to="/settings" icon={<SettingsIcon size={20} />} label="Settings" />

          {/* Role Guard: Only Admin sees this */}
          {user?.role === 'admin' && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">Administration</p>
              </div>
              <NavItem to="/admin" icon={<ShieldCheck size={20} />} label="Admin Panel" />
            </>
          )}
        </nav>

        <div className="p-4 bg-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {user?.full_name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2 rounded bg-red-600 hover:bg-red-700 transition text-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-700">
            {/* You could make this dynamic based on route */}
            Workspace
          </h2>
          <div className="flex items-center gap-4">
            {/* Global Search Bar can go here later */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search Ticket or Phone..."
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Helper Component for Sidebar Links
function NavLinkHelper({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      {icon}
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

// Rename to avoid conflict with import
const NavItem = NavLinkHelper;