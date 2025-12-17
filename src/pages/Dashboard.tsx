import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RepairService } from '../features/repairs/repair.service';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StatsCard } from '../components/ui/StatsCard';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Coins,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- STATE ---
  const [activeRepairs, setActiveRepairs] = useState<any[]>([]);
  const [overstayed, setOverstayed] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- DATA FETCHING ---
  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Get List of all Active Jobs
        const active = await RepairService.getAllActive();
        setActiveRepairs(active);

        // 2. Get Overstayed Items (Fixed > 30 days ago)
        const oldItems = await RepairService.getOverstayed();
        setOverstayed(oldItems);

        // 3. Admin Only: Get Revenue
        if (user?.role === 'admin') {
           const currentMonth = new Date().toISOString().slice(0, 7); // "2023-12"
           const stats = await RepairService.getRevenueStats(currentMonth);
           setRevenue(stats.totalRevenue);
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  // --- CALCULATED STATS ---
  const countFixed = activeRepairs.filter(r => r.status === 'Fixed').length;
  const countPending = activeRepairs.filter(r => r.status !== 'Fixed' && r.status !== 'Collected').length;

  if (loading) return <div className="p-10">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* 1. WELCOME SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Habari, {user?.full_name.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here is what's happening in the workshop today.</p>
        </div>
        <button 
          onClick={() => navigate('/repairs/new')}
          className="btn btn-lg btn-primary flex items-center gap-2"
        >
          <Wrench size={18} /> New Repair
        </button>
      </div>

      {/* 2. OVERSTAYED ALERT (Only shows if items exist) */}
      {overstayed.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-4">
          <div className="p-2 bg-red-100 rounded-full text-red-600 mt-1">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-red-800 font-bold">Action Needed: {overstayed.length} Overstayed Items</h3>
            <p className="text-red-600 text-sm mt-1">
              These items have been fixed for over 30 days but not collected. Call clients or move to storage.
            </p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {overstayed.map((item: any) => (
                <span key={item.ticket_no} className="px-2 py-1 bg-white border border-red-200 text-xs font-mono rounded text-red-700">
                  {item.ticket_no} ({item.client_name})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <StatsCard 
          title="In Progress" 
          value={countPending} 
          icon={<Clock size={24} className="text-blue-600" />} 
          colorClass="bg-white"
        />
        
        {/* Ready Card */}
        <StatsCard 
          title="Ready for Pickup" 
          value={countFixed} 
          icon={<CheckCircle2 size={24} className="text-green-600" />} 
          colorClass="bg-green-50 text-green-900 border-green-100"
        />

        {/* Revenue Card (Admin Only) */}
        {user?.role === 'admin' && (
          <StatsCard 
            title="Revenue (This Month)" 
            value={`KES ${revenue.toLocaleString()}`} 
            icon={<Coins size={24} className="text-yellow-600" />} 
            colorClass="bg-yellow-50 text-yellow-900 border-yellow-100"
          />
        )}
      </div>

      {/* 4. ACTIVE REPAIRS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Recent Activity</h3>
          <button onClick={() => navigate('/repairs')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        </div>
        
        {activeRepairs.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Wrench size={40} className="mx-auto mb-3 opacity-20" />
            <p>No active repairs. Good job!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-left">
              <thead className="">
                <tr>
                  <th className="px-6 py-3">Ticket</th>
                  <th className="px-6 py-3">Device</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date In</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {activeRepairs.slice(0, 5).map((repair) => (
                  <tr key={repair.id} className=" hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono font-medium text-gray-600">{repair.ticket_no}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{repair.device_type}</div>
                      <div className="text-xs text-gray-500">{repair.brand} {repair.model}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{repair.client_name}</div>
                      <div className="text-xs text-gray-500">{repair.client_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={repair.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(repair.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/repairs/${repair.id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}