import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserService } from '../features/users/user.service';
import { KeyRound, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import {error as errorLog} from '@tauri-apps/plugin-log';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=Identify, 2=Verify, 3=Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Data
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [targetEmail, setTargetEmail] = useState('');

  // Step 1: Request Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await UserService.initiatePasswordReset(username);
      setTargetEmail(res.email);
      setStep(2);
    } catch (e: any) {
      setError(e.message || "Failed to send code");
      console.error(e);
      await errorLog("Password reset request failed:"+ e);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await UserService.completePasswordReset(username, code, password);
      setStep(3);
    } catch (e: any) {
      setError(e.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 p-6 text-center">
          <KeyRound className="mx-auto text-blue-400 mb-2" size={32} />
          <h1 className="text-xl font-bold text-white">Owner Password Reset</h1>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200 mb-4">
              {error}
            </div>
          )}

          {/* STEP 1: ENTER USERNAME */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <p className="text-sm text-gray-600 text-center mb-4">
                Enter your username. We will send a reset code to the email configured in Shop Settings.
              </p>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                <input required type="text" className="w-full input border-gray-300 bg-slate-50" 
                  placeholder="admin"
                  value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <button disabled={loading} className="btn btn-primary w-full flex items-center justify-center gap-2">
                {loading ? 'Sending...' : <>Send Code <Mail size={16}/></>}
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => navigate('/login')} className="text-sm text-blue-600 hover:underline">
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: ENTER CODE & NEW PASS */}
          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 mb-4">
                Code sent to <strong>{targetEmail}</strong>. Check your inbox (and spam).
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">6-Digit Code</label>
                <input required type="text" maxLength={6} className="w-full input border-gray-300 bg-slate-50 text-center text-lg tracking-widest font-mono" 
                  placeholder="000000"
                  value={code} onChange={e => setCode(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
                <input required type="password" className="w-full input border-gray-300 bg-slate-50" 
                  placeholder="••••••"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              <button disabled={loading} className="btn btn-success w-full text-white">
                {loading ? 'Verifying...' : 'Reset Password'}
              </button>
              <div className="text-center mt-2">
                <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-500 hover:underline">
                  Didn't receive code? Try again
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Password Reset!</h2>
              <p className="text-sm text-gray-500">You can now login with your new password.</p>
              <button onClick={() => navigate('/login')} className="btn btn-primary w-full gap-2">
                Go to Login <ArrowRight size={16}/>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}