import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientService } from '../features/clients/client.service';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Phone, MapPin, Calendar, Wrench, ArrowLeft } from 'lucide-react';

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // 👇 NO Number() casting here anymore
      if (!id) return;
      const clientData = await ClientService.getById(id);
      const historyData = await ClientService.getHistory(id);
      setClient(clientData);
      setHistory(historyData);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-10">Loading Profile...</div>;
  if (!client) return <div className="p-10">Client not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800">
        <ArrowLeft size={18} /> Back to List
      </button>

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
        
        <button 
           onClick={() => navigate('/repairs/new')} // Could pass state here later
           className="btn btn-primary flex items-center gap-2"
        >
          <Wrench size={18} /> New Repair Job
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 border-gray-100">
          <h3 className="font-semibold text-gray-800">Repair History ({history.length})</h3>
        </div>
        <table className="table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-6 py-3">Ticket</th>
              <th className="px-6 py-3">Device</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Cost</th>
              <th className="px-6 py-3">Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono font-medium">{item.ticket_no}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{item.device_type}</div>
                  <div className="text-xs text-gray-500">{item.brand} {item.model}</div>
                </td>
                <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                <td className="px-6 py-4 font-medium">{item.final_price > 0 ? item.final_price.toLocaleString() : '-'}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => navigate(`/repairs/${item.id}`)} className="text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}