import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any; // If passed, we are in Edit mode
}

export default function ClientModal({ isOpen, onClose, onSave, initialData }: Props) {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setForm({
        full_name: initialData.full_name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        location: initialData.location || ''
      });
    } else {
      setForm({ full_name: '', phone: '', email: '', location: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      alert("Error saving client. Phone might be duplicate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">{initialData ? 'Edit Client' : 'Add New Client'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input 
              required
              type="text" 
              className="w-full input bg-slate-50 border-green-300"
              value={form.full_name}
              onChange={e => setForm({...form, full_name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
            <input 
              required
              type="text" 
              placeholder="07..."
              className="w-full input bg-slate-50 border-green-300"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
            <input 
              type="email" 
              className="w-full input bg-slate-50 border-green-300"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location / Address</label>
            <input 
              type="text" 
              placeholder="e.g. Roysambu, TRM Drive"
              className="w-full input bg-slate-50 border-green-300"
              value={form.location}
              onChange={e => setForm({...form, location: e.target.value})}
            />
          </div>

          <div className="pt-2">
            <button 
              disabled={loading}
              type="submit" 
              className="w-full btn btn-primary transition flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : <><Save size={18}/> Save Client</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}