import { useEffect, useState } from 'react';
import { UserService } from '../../features/users/user.service';
import { useAuth } from '../../context/AuthContext';
import { Trash2, UserPlus, Shield } from 'lucide-react';

export default function StaffManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: '', full_name: '', password: '', role: 'staff' });

  // Only Admin should see this
  if (user?.role !== 'admin') return <div>Access Denied</div>;

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
    try {
      await UserService.create(user.id, newUser);
      alert("User Created");
      setNewUser({ username: '', full_name: '', password: '', role: 'staff' });
      loadUsers();
    } catch (e) {
      alert("Error creating user");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Shield size={24} className="text-blue-600"/> Staff Management
      </h1>

      {/* CREATE FORM */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-semibold mb-4 text-gray-700">Add New Staff Member</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500">Full Name</label>
            <input required type="text" className="w-full input bg-slate-100 border-green-300" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Username</label>
            <input required type="text" className="w-full input bg-slate-100 border-green-300" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Password</label>
            <input required type="password" className="w-full input bg-slate-100 border-green-300" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Role</label>
            <select className="w-full  select bg-slate-100 border-green-300" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
               <option value="staff">Staff</option>
               <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary flex items-center justify-center gap-2">
            <UserPlus size={18}/> Create User
          </button>
        </form>
      </div>

      {/* USER LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm table table-zebra">
          <thead className="border-b table-header-group">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Username</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className=''>
            {users.map(u => (
              <tr key={u.id} className="table-row ">
                <td className="px-6 py-4 font-medium">{u.full_name}</td>
                <td className="px-6 py-4 ">{u.username}</td>
                <td className="px-6 py-4 capitalize">{u.role}</td>
                <td className="px-6 py-4">
                  {u.is_active ? <span className="text-green-600">Active</span> : <span className="text-red-600">Inactive</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}