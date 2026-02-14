import { useEffect, useState } from 'react';
import { AuditService } from '../../features/audit/audit.service';
import { useAuth } from '../../context/AuthContext';
import { Search, History } from 'lucide-react';

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Access Control
  if (user?.role !== 'admin' && user?.role !== 'owner') return <div>Access Denied</div>;

  useEffect(() => {
    const timer = setTimeout(loadLogs, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadLogs = async () => {
    const data = await AuditService.getAll(100, search);
    setLogs(data);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <History size={24} className="text-blue-600"/> Audit Trail
        </h1>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search logs by user, action, or details..." 
          className="flex-1 outline-none text-gray-700"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm table table-zebra">
          <thead className="bg-gray-50 text-gray-500 border-b">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-medium">
                  {log.full_name} <span className="text-xs text-gray-400">(@{log.username})</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold uppercase border border-gray-200">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="p-10 text-center text-gray-400">No logs found.</div>}
      </div>
    </div>
  );
}