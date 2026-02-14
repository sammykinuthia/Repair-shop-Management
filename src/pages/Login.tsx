import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserService } from '../features/users/user.service';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await UserService.authenticate(username, password);
      if (user) {
        setUser(user);
        navigate('/');
      } else {
        setError('Invalid credentials or account inactive.');
      }
    } catch (err) {
      console.error(err);
      setError('System Error.');
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 bg-slate-800 text-center">
          <h2 className="text-2xl font-bold text-white mb-1">RepairPro Login</h2>
          <p className="text-slate-400 text-sm">Secure Access</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition">
            Login
          </button>
          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-blue-500 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}