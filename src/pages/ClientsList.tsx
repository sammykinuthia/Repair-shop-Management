import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientService } from '../features/clients/client.service';
import { Search, UserPlus, Eye, Pencil, Trash2, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ClientModal from '../features/clients/components/ClientModal';
import { ask } from '@tauri-apps/plugin-dialog';

export default function ClientsList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);

  const loadClients = async () => {
    const data = search.length > 2
      ? await ClientService.search(search)
      : await ClientService.getAll();
    setClients(data);
  };

  useEffect(() => {
    const timer = setTimeout(loadClients, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 👇 ID is now string
  const handleDelete = async (id: string) => {
    const confirmed = await ask("Are you sure? This action cannot be undone.", { title: "Confirm Deletion", kind: 'warning' });
    if (!confirmed) return;
    await ClientService.delete(id);
    loadClients();
  };

  const handleSave = async (data: any) => {
    if (editClient) {
      await ClientService.update(editClient.id, data);
    } else {
      await ClientService.create(data);
    }
    loadClients();
  };

  const openEdit = (client: any) => {
    setEditClient(client);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditClient(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Client Database</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <UserPlus size={18} /> Add Client
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
        <Search className="text-gray-400" size={20} />
        <input type="text" placeholder="Search..." className="flex-1 outline-none text-gray-700"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="table table-zebra w-full text-left">
          <thead>
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">{client.full_name}</td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-blue-500" /> {client.phone}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{client.location || '-'}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => navigate(`/clients/${client.id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Eye size={18} /></button>
                  <button onClick={() => openEdit(client)} className="p-2 text-gray-600 hover:bg-gray-100 rounded"><Pencil size={18} /></button>
                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <button onClick={() => handleDelete(client.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && <div className="p-8 text-center text-gray-400">No clients found.</div>}
      </div>

      <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editClient} />
    </div>
  );
}