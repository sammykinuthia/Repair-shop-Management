// src/pages/Login.tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserService } from '../features/users/user.service';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldAlert } from 'lucide-react';

interface Props {
  isFirstRun: boolean;
  onSetupComplete: () => void;
}

export default function Login({ isFirstRun, onSetupComplete }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isFirstRun) {
        // --- FIRST RUN: CREATE ADMIN ---
        // Pass 0 as adminId because no one exists yet
        await UserService.create(0, {
          username,
          password,
          full_name: fullName,
          role: 'admin'
        });
        alert("Admin Account Created! Please Login.");
        onSetupComplete();
        // Reset form
        setPassword('');
      } else {
        // --- NORMAL LOGIN ---
        const user = await UserService.authenticate(username, password);
        if (user) {
          setUser(user);
          navigate('/');
        } else {
          setError('Invalid username or password');
        }
      }
    } catch (err) {
      console.error(err);
      setError('System Error. Check console.');
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className=" rounded-lg shadow-md shadow-secondary w-full max-w-md overflow-hidden">
        <div className={`p-6 ${isFirstRun ? 'bg-blue-600' : 'bg-slate-800'} text-center`}>
          <h2 className="text-2xl font-bold text-white mb-1">
            {isFirstRun ? 'System Setup' : 'Welcome Back'}
          </h2>
          <p className="text-slate-300 text-sm">
            {isFirstRun ? 'Create the first Admin account' : 'Login to access the workshop'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-slate-700 text-slate-100">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
              {error}
            </div>
          )}

          {isFirstRun && (
             <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Username</label>
            <div className="relative">
              <ShieldAlert className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`w-full py-3 rounded text-white font-semibold transition ${
              isFirstRun ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-900'
            }`}
          >
            {isFirstRun ? 'Create & Initialize' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}