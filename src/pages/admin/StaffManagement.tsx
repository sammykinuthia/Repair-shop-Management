import { useEffect, useState } from 'react';
import { UserService } from '../../features/users/user.service';
import { useAuth } from '../../context/AuthContext';
import { ask } from '@tauri-apps/plugin-dialog';
import { 
  UserPlus, Shield, Power, Trash2, CheckCircle, XCircle 
} from 'lucide-react';

export default function StaffManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: '', full_name: '', password: '', role: 'staff' });
  const [loading, setLoading] = useState(false);

  // Access Control
  if (user?.role !== 'admin' && user?.role !== 'owner') return <div className="p-10 text-center">Access Denied</div>;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const list = await UserService.getAll();
    setUsers(list);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user) return;
    setLoading(true);
    try {
      await UserService.create(user.id, newUser); // user.id is UUID string
      alert("User Created Successfully");
      setNewUser({ username: '', full_name: '', password: '', role: 'staff' });
      loadUsers();
    } catch (e) {
      alert("Error creating user. Username might be taken.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (targetUser: any) => {
    if (targetUser.id === user?.id) return alert("You cannot deactivate yourself.");
    
    const action = targetUser.is_active ? "Deactivate" : "Activate";
    const confirmed = await ask(`Are you sure you want to ${action} ${targetUser.username}?`, 
      { title: `${action} User`, kind: 'warning' });
    
    if (confirmed && user) {
      await UserService.toggleStatus(user.id, targetUser.id, targetUser.is_active);
      loadUsers();
    }
  };

  const handleDelete = async (targetUserId: string) => { // ID is string
    const confirmed = await ask("This will permanently delete the user. Consider deactivating instead. Continue?", 
      { title: "Delete User", kind: 'error' });
    
    if (confirmed && user) {
      await UserService.delete(user.id, targetUserId);
      loadUsers();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 px-4 md:px-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield size={24} className="text-blue-600"/> Staff Management
        </h1>
        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100 font-bold">
           {users.length} Users
        </span>
      </div>

      {/* CREATE FORM (Responsive) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <UserPlus size={18} /> Add New Team Member
        </h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
            <input required type="text" className="w-full p-2 border rounded bg-slate-50 outline-none mt-1" 
              value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} />
          </div>
          <div className="lg:col-span-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
            <input required type="text" className="w-full p-2 border rounded bg-slate-50 outline-none mt-1" 
              value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
          </div>
          <div className="lg:col-span-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
            <input required type="password" className="w-full p-2 border rounded bg-slate-50 outline-none mt-1" 
              value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
          </div>
          <div className="lg:col-span-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
            <select className="w-full p-2 border rounded bg-slate-50 outline-none mt-1" 
              value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
               <option value="staff">Staff</option>
               <option value="admin">Admin</option>
            </select>
          </div>
          <div className="lg:col-span-1">
            <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition font-bold mt-1">
              {loading ? 'Saving...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      {/* USER LIST (Desktop Table) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b">
            <tr>
              <th className="px-6 py-4">Employee Info</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{u.full_name}</div>
                  <div className="text-xs text-gray-500">@{u.username}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' || u.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {u.is_active ? 
                    <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle size={14}/> Active</span> : 
                    <span className="flex items-center gap-1 text-red-500 text-xs font-bold"><XCircle size={14}/> Inactive</span>
                  }
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleToggleStatus(u)}
                      className={`p-2 rounded hover:bg-gray-200 ${u.is_active ? 'text-orange-600' : 'text-green-600'}`} 
                      title={u.is_active ? "Deactivate" : "Activate"}
                    >
                      <Power size={18} />
                    </button>
                    {u.id !== user?.id && (
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded" 
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* USER LIST (Mobile Cards) */}
      <div className="md:hidden space-y-4">
        {users.map(u => (
          <div key={u.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
             <div>
                <h4 className="font-bold text-gray-800">{u.full_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">@{u.username}</span>
                  <span className="text-[10px] bg-gray-100 px-2 rounded font-bold uppercase">{u.role}</span>
                </div>
                <div className="mt-2">
                   {u.is_active ? 
                      <span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> Active</span> : 
                      <span className="text-xs text-red-600 font-bold flex items-center gap-1"><XCircle size={12}/> Inactive</span>
                   }
                </div>
             </div>
             <div className="flex flex-col gap-2">
                <button onClick={() => handleToggleStatus(u)} className="p-2 border rounded-lg hover:bg-gray-100">
                   <Power size={16} className={u.is_active ? 'text-orange-500' : 'text-green-600'} />
                </button>
                {u.id !== user?.id && (
                   <button onClick={() => handleDelete(u.id)} className="p-2 border rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 size={16} />
                   </button>
                )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}