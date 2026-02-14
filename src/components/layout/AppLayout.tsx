import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Wrench, Users, ShieldCheck, LogOut, Settings, FileText
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout, organization } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">

        {/* ORGANIZATION BRANDING */}
        <div className="p-6 border-b border-slate-700 flex flex-col items-center text-center">
          {organization?.logo_blob ? (
            <img
              src={organization.logo_blob}
              alt="Logo"
              className="h-16 w-auto object-contain mb-3 bg-white/10 rounded p-1"
            />
          ) : (
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-3 text-xl font-bold border-2 border-white">
              {organization?.name?.charAt(0) || 'R'}
            </div>
          )}

          <h1 className="text-lg font-bold text-white tracking-wide break-words w-full uppercase">
            {organization?.name || 'Repair Manager'}
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
            {user?.role === 'owner' ? 'Owner Portal' : 'Staff Portal'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem to="/repairs" icon={<Wrench size={20} />} label="Repairs" />
          <NavItem to="/clients" icon={<Users size={20} />} label="Clients" />

          {/* OWNER & ADMIN SECTION */}
          {(user?.role === 'admin' || user?.role === 'owner') && (
            <>
              <div className="pt-4 pb-2 px-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Management</p>
              </div>
              <NavItem to="/admin/staff" icon={<ShieldCheck size={20} />} label="Staff Access" />
              <NavItem to="/admin/audit" icon={<FileText size={20} />} label="Audit Logs" />
              <div className="pt-4 pb-2 px-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System</p>
              </div>
              <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
            </>
          )}

        </nav>

        {/* User Info Footer */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs">
              {user?.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 p-2 rounded bg-red-600/90 hover:bg-red-600 transition text-xs font-bold uppercase tracking-wide">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <NavLink to={to} className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`
  }>
    {icon} <span className="font-medium text-sm">{label}</span>
  </NavLink>
);