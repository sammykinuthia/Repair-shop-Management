import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientService } from '../features/clients/client.service';
import { StatusBadge } from '../components/ui/StatusBadge';
import { User, Phone, MapPin, Calendar, Wrench, ArrowLeft } from 'lucide-react';

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const clientData = await ClientService.getById(Number(id));
      const historyData = await ClientService.getHistory(Number(id));
      setClient(clientData);
      setHistory(historyData);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-10">Loading Profile...</div>;
  if (!client) return <div className="p-10">Client not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800">
        <ArrowLeft size={18} /> Back to List
      </button>

      {/* TOP CARD: Client Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
            {client.full_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{client.full_name}</h1>
            <div className="text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm">
              <span className="flex items-center gap-1"><Phone size={14}/> {client.phone}</span>
              {client.location && <span className="flex items-center gap-1"><MapPin size={14}/> {client.location}</span>}
              <span className="flex items-center gap-1"><Calendar size={14}/> Joined: {new Date(client.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        {/* Shortcut to add repair for THIS client */}
        <button 
           onClick={() => {
             // We can pass state to the new repair page to pre-fill the client!
             // Note: You need to update CreateRepair.tsx to read this state, 
             // but for now, we'll just go there.
             navigate('/repairs/new'); 
           }}
           className="btn btn-primary flex items-center gap-2"
        >
          <Wrench size={18} /> New Repair Job
        </button>
      </div>

      {/* BOTTOM SECTION: Repair History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 border-gray-100">
          <h3 className="font-semibold text-gray-800">Repair History ({history.length})</h3>
        </div>

        <table className="table table-zebra w-full text-left">
          <thead className="">
            <tr>
              <th className="px-6 py-3">Ticket</th>
              <th className="px-6 py-3">Device</th>
              <th className="px-6 py-3">Issue</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Cost (KES)</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="">
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono font-medium">{item.ticket_no}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{item.device_type}</div>
                  <div className="text-xs text-gray-500">{item.brand} {item.model}</div>
                </td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={item.issue_description}>
                  {item.issue_description}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4 font-medium">
                  {item.final_price > 0 ? item.final_price.toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => navigate(`/repairs/${item.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {history.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No history found for this client.
          </div>
        )}
      </div>
    </div>
  );
}