import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrganizationService } from '../../features/organization/org.service';
import { Store, User, Lock, MapPin, Phone, ArrowRight } from 'lucide-react';

export default function SetupShop({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [shop, setShop] = useState({ name: '', address: '', phone: '', email: '' });
  const [admin, setAdmin] = useState({ full_name: '', username: '', password: '' });

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await OrganizationService.initializeShop(shop, admin);
      alert("Setup Complete! You can now login.");
      onComplete(); // Tell App.tsx we are done
      navigate('/login');
    } catch (error) {
      console.error(error);
      alert("Setup failed. See console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden border border-gray-100">

        {/* Header */}
        <div className="bg-blue-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Royoltech</h1>
          <p className="text-blue-100 text-sm">Repair Management System Setup</p>
        </div>


        <form onSubmit={handleFinish} className="p-8">

          {/* STEP 1: SHOP DETAILS */}
          {step === 1 && (
            <div className="space-y-4 fade-in">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Store className="text-blue-600" /> Shop Details
              </h2>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Shop Name</label>
                <input required type="text" className="w-full p-3 border rounded-lg bg-slate-50 focus:ring-2 ring-blue-500 outline-none"
                  placeholder="e.g. Mugo Electronics"
                  value={shop.name} onChange={e => setShop({ ...shop, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="text" className="w-full p-3 pl-10 border rounded-lg bg-slate-50 outline-none"
                      placeholder="07..."
                      value={shop.phone} onChange={e => setShop({ ...shop, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="text" className="w-full p-3 pl-10 border rounded-lg bg-slate-50 outline-none"
                      placeholder="City/Street"
                      value={shop.address} onChange={e => setShop({ ...shop, address: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button type="button" onClick={() => setStep(2)}
                  className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition">
                  Next Step <ArrowRight size={18} />
                </button>
              </div>
              
              <div className="text-center mt-4 border-t pt-4">
                <p className="text-sm text-gray-600">Already have an account?</p>
                <button
                  onClick={() => navigate('/setup/cloud')}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Login & Sync Existing Shop
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: OWNER ACCOUNT */}
          {step === 2 && (
            <div className="space-y-4 fade-in">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="text-blue-600" /> Owner Account
              </h2>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Your Full Name</label>
                <input required type="text" className="w-full p-3 border rounded-lg bg-slate-50 outline-none"
                  placeholder="John Doe"
                  value={admin.full_name} onChange={e => setAdmin({ ...admin, full_name: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Username (For Login)</label>
                <input required type="text" className="w-full p-3 border rounded-lg bg-slate-50 outline-none"
                  placeholder="admin"
                  value={admin.username} onChange={e => setAdmin({ ...admin, username: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input required type="password" className="w-full p-3 pl-10 border rounded-lg bg-slate-50 outline-none"
                    placeholder="••••••"
                    value={admin.password} onChange={e => setAdmin({ ...admin, password: e.target.value })} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition">
                  Back
                </button>
                <button disabled={loading} type="submit"
                  className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}

        </form>

        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t">
          Standard Plan (Free Forever) • Offline Mode
        </div>
      </div>
    </div>
  );
}