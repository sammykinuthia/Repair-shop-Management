import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { SyncService } from '../../features/sync/sync.service';
import { CloudDownload, ArrowLeft, Lock, Mail } from 'lucide-react';
import { turso } from '../../lib/turso';
import bcrypt from 'bcryptjs';
import { db } from '../../lib/db';

export default function CloudLogin({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleCloudLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Authenticating...');

    try {
      // 1. Check User in Cloud DB
      // Note: This requires the 'users' table to exist in Turso
      const rs = await turso.execute({
        sql: "SELECT * FROM users WHERE email = ? AND role = 'owner' LIMIT 1",
        args: [email] // Assuming you change email state to username, or add email col to users
      });

      if (rs.rows.length === 0) throw new Error("Owner account not found in cloud.");

      const cloudUser = rs.rows[0];
      
      // 2. Verify Password
      const isValid = await bcrypt.compare(password, cloudUser.password_hash as string);
      if (!isValid) throw new Error("Invalid Password");

      setStatus('Syncing Shop Data...');

      // 3. Fetch Organization
      const orgRs = await turso.execute({
        sql: "SELECT * FROM organizations WHERE id = ?",
        args: [cloudUser.organization_id]
      });
      
      if (orgRs.rows.length === 0) throw new Error("Organization data missing.");
      const cloudOrg = orgRs.rows[0];

      // 4. Restore Organization Locally
      await db.insertInto('organizations').values({
         id: cloudOrg.id as string,
         name: cloudOrg.name as string,
         phone: cloudOrg.phone as string,
         email: cloudOrg.email as string,
         address: cloudOrg.address as string,
         terms: cloudOrg.terms as string,
         subscription_plan: cloudOrg.subscription_plan as any,
         logo_url: cloudOrg.logo_url as string,
         created_at: cloudOrg.created_at as string,
         is_synced: 1
      }).onConflict(oc => oc.column('id').doUpdateSet({ is_synced: 1 })).execute();

      // 5. Pull the rest of the data
      await SyncService.pullData();

      setStatus('Sync Complete!');
      onComplete();
      navigate('/login');

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Cloud Login Failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-blue-600 text-white text-center">
          <CloudDownload size={40} className="mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Restore Existing Shop</h1>
          <p className="text-blue-100 text-sm">Sync data from Royoltech Cloud</p>
        </div>

        <form onSubmit={handleCloudLogin} className="p-8 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input type="email" required className="w-full pl-10 input input-bordered" 
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input type="password" required className="w-full pl-10 input input-bordered" 
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>

          {status && <div className="text-center text-blue-600 text-sm font-bold animate-pulse">{status}</div>}

          <button disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Downloading...' : 'Sync & Restore'}
          </button>

          <button type="button" onClick={() => navigate('/setup')} className="btn btn-ghost w-full gap-2">
            <ArrowLeft size={16}/> Back to New Setup
          </button>
        </form>
      </div>
    </div>
  );
}