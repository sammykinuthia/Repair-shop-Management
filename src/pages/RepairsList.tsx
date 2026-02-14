import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RepairService } from '../features/repairs/repair.service';
import { PrinterService } from '../lib/printers'; // 👈 Import Helper
import { StatusBadge } from '../components/ui/StatusBadge';
import { Search, Filter, Printer, Tag } from 'lucide-react'; // 👈 Tag Icon for Sticker

export default function RepairsList() {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // ... (Keep existing load logic) ...
  useEffect(() => {
    loadData('');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadData(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  async function loadData(query: string) {
    if (query.length > 0) {
      const results = await RepairService.search(query);
      setRepairs(results);
    } else {
      const results = await RepairService.getAllActive();
      setRepairs(results);
    }
  }

  // Helper to prevent row click when clicking button
  const handlePrintSticker = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    PrinterService.printSticker(id);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ... Header & Search ... */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">All Repairs</h1>
      </div>
      
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search..." 
          className="flex-1 outline-none text-gray-700"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b">
            <tr>
              <th className="px-6 py-3">Ticket</th>
              <th className="px-6 py-3">Device</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {repairs.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/repairs/${item.id}`)}>
                <td className="px-6 py-4 font-mono font-bold text-gray-700">{item.ticket_no}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{item.device_type}</div>
                  <div className="text-xs text-gray-500">{item.brand} {item.model}</div>
                </td>
                <td className="px-6 py-4">{item.client_name}</td>
                <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                <td className="px-6 py-4 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  
                  {/* PRINT STICKER BUTTON */}
                  <button 
                    onClick={(e) => handlePrintSticker(e, item.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-100"
                    title="Print Sticker"
                  >
                    <Tag size={16} />
                  </button>

                  <span className="text-blue-600 font-medium self-center text-xs">Open</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {repairs.length === 0 && <div className="p-8 text-center text-gray-400">No repairs found.</div>}
      </div>
    </div>
  );
}