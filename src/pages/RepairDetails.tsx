import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RepairService } from '../features/repairs/repair.service';
import { ImageManager } from '../lib/storage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { open } from '@tauri-apps/plugin-shell';
import {
    ArrowLeft, Save, MessageCircle,
    DollarSign, Wrench, Printer,
    Tag, Lock, AlertTriangle
} from 'lucide-react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { PrinterService } from '../lib/printers';
import { useAuth } from '../context/AuthContext';

export default function RepairDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [repair, setRepair] = useState<any>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Permissions
    const isAdmin = user?.role === 'admin' || user?.role === 'owner';
    // If ticket is collected, only Admin can edit it. Staff are locked out.
    const isCollected = repair?.status === 'Collected';
    const isLocked = isCollected && !isAdmin;

    // Form State
    const [status, setStatus] = useState('');
    const [diagnosis, setDiagnosis] = useState('');

    // Financials
    const [costs, setCosts] = useState({ internal: 0, labor: 0, final: 0 });

    // Payment State
    const [paidSoFar, setPaidSoFar] = useState(0);
    const [newPayment, setNewPayment] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [mpesaCode, setMpesaCode] = useState('');

    // Load Data
    useEffect(() => {
        async function load() {
            if (!id) return;
            const data = await RepairService.getById(id);
            if (data) {
                setRepair(data);
                setStatus(data.status);
                setDiagnosis(data.diagnosis || '');

                setCosts({
                    internal: data.internal_cost || 0,
                    labor: data.labor_cost || 0,
                    final: data.final_price || 0
                });

                setPaidSoFar(data.amount_paid || 0);
                setMpesaCode(data.mpesa_code || '');

                const paths = JSON.parse(data.image_paths || '[]');
                if (paths.length > 0) {
                    const url = await ImageManager.getUrl(paths[0]);
                    setImageUrl(url);
                }
            }
            setLoading(false);
        }
        load();
    }, [id]);

    // AUTO-CALCULATION LOGIC
    // Only auto-calculate if not locked
    useEffect(() => {
        if (isLocked) return; 
        const total = Number(costs.internal) + Number(costs.labor);
        setCosts(prev => ({ ...prev, final: total }));
    }, [costs.internal, costs.labor, isLocked]);

    const sendWhatsApp = async () => {
        if (!repair) return;
        let phone = repair.client_phone.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '254' + phone.substring(1);
        const balance = costs.final - (paidSoFar + newPayment);
        const message = `Hello ${repair.client_name}. Your ${repair.device_type} (Ticket: ${repair.ticket_no}) status: ${status}. Total: KES ${costs.final}. Balance: KES ${balance}.`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        await open(url);
    };

    const handleSave = async () => {
        if (!id) return;
        if (isLocked) {
            alert("This ticket is closed. Only Admins can modify collected items.");
            return;
        }

        // Validation
        if (newPayment < 0) {
            alert("Payment cannot be negative.");
            return;
        }
        
        const balanceDue = costs.final - paidSoFar;
        if (newPayment > balanceDue) {
            const confirmOverpay = confirm(`You are entering KES ${newPayment}, but balance is only KES ${balanceDue}. Continue with overpayment?`);
            if (!confirmOverpay) return;
        }

        try {
            const totalPaid = paidSoFar + Number(newPayment);
            
            // Auto-detect fully paid
            let isPaid = 0;
            if (costs.final > 0 && totalPaid >= costs.final) {
                isPaid = 1;
            }

            await RepairService.update(id, {
                status,
                diagnosis,
                internal_cost: Number(costs.internal),
                labor_cost: Number(costs.labor),
                final_price: Number(costs.final),
                amount_paid: totalPaid,
                payment_method: newPayment > 0 ? paymentMethod : repair.payment_method,
                mpesa_code: mpesaCode,
                is_paid: isPaid
            });
            alert("Updated Successfully!");
            window.location.reload();
        } catch (e) {
            alert("Error saving");
            console.error(e);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Ticket...</div>;
    if (!repair) return <div className="p-10 text-center text-red-500">Repair not found</div>;

    const balanceDue = costs.final - (paidSoFar + Number(newPayment));

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* LOCKED BANNER */}
            {isLocked && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 flex items-center gap-3 shadow-sm">
                    <Lock className="text-orange-500" />
                    <div>
                        <p className="font-bold text-orange-800">Ticket Locked</p>
                        <p className="text-sm text-orange-700">This item has been collected. Contact an Admin to make changes.</p>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex justify-between items-start">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 btn btn-ghost btn-sm">
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="text-right flex flex-col items-end gap-2">
                    <h1 className="text-3xl font-bold font-mono text-gray-800">{repair.ticket_no}</h1>
                    <div className="flex gap-2">
                        <button onClick={() => PrinterService.printSticker(repair.id)} className="btn btn-sm btn-outline gap-2">
                            <Tag size={14} /> Sticker
                        </button>
                        <button onClick={() => PrinterService.printTicket(repair.id)} className="btn btn-sm btn-outline gap-2">
                            <Printer size={14} /> Print Ticket
                        </button>
                        <StatusBadge status={repair.status} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: INFO */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        {imageUrl ? (
                            <img src={imageUrl} alt="Device" className="w-full h-48 object-cover rounded-lg mb-4 border" />
                        ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                                No Image
                            </div>
                        )}
                        <h3 className="font-bold text-lg">{repair.device_type}</h3>
                        <p className="text-gray-600 font-medium">{repair.brand} {repair.model}</p>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">SN: {repair.serial_no}</p>
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-xs font-bold text-gray-500 uppercase">Reported Issue</p>
                            <p className="text-gray-700 mt-1 italic">"{repair.issue_description}"</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">Client Details</h3>
                        <p className="text-xl font-bold text-gray-800">{repair.client_name}</p>
                        <p className="text-blue-600 font-medium mt-1">{repair.client_phone}</p>
                        <button onClick={sendWhatsApp} className="mt-4 w-full btn btn-success text-white gap-2">
                            <MessageCircle size={18} /> WhatsApp Update
                        </button>
                    </div>
                </div>

                {/* RIGHT: WORKSPACE */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. DIAGNOSIS */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Wrench size={20} className="text-blue-600" /> Technician Area
                        </h3>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                            <select 
                                disabled={isLocked}
                                value={status} 
                                onChange={e => setStatus(e.target.value)} 
                                className="w-full select bg-slate-50 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="Received">Received</option>
                                <option value="Diagnosing">Diagnosing</option>
                                <option value="PendingApproval">Pending Approval</option>
                                <option value="WaitingParts">Waiting Parts</option>
                                <option value="Fixed">Fixed</option>
                                <option value="Unrepairable">Unrepairable</option>
                                <option value="Collected">Collected (Closed)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Diagnosis / Technician Notes</label>
                            <textarea
                                disabled={isLocked}
                                className="w-full textarea bg-slate-50 border-gray-300 h-24 disabled:opacity-50"
                                placeholder="Technician notes on what was fixed..."
                                value={diagnosis}
                                onChange={e => setDiagnosis(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    {/* 2. COSTING */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                        {isLocked && <div className="absolute inset-0 bg-gray-100/50 z-10 cursor-not-allowed" title="Unlock via Admin"></div>}
                        
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-green-600" /> Costing
                        </h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                    Parts Cost {!isAdmin && <Lock size={10}/>}
                                </label>
                                <input 
                                    type="number" 
                                    disabled={isLocked || !isAdmin} // Only Admin edits parts cost
                                    className="w-full input bg-slate-50 border-gray-300 disabled:opacity-60"
                                    value={costs.internal} 
                                    onChange={e => setCosts({ ...costs, internal: Number(e.target.value) })} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Labor Cost</label>
                                <input 
                                    type="number" 
                                    disabled={isLocked}
                                    className="w-full input bg-slate-50 border-gray-300 disabled:opacity-60"
                                    value={costs.labor} 
                                    onChange={e => setCosts({ ...costs, labor: Number(e.target.value) })} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Final Price</label>
                                <input 
                                    type="number" 
                                    disabled={isLocked}
                                    className="w-full input bg-blue-50 border-blue-300 font-bold text-lg disabled:opacity-60"
                                    value={costs.final} 
                                    onChange={e => setCosts({ ...costs, final: Number(e.target.value) })} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. PAYMENT */}
                    <div className={`bg-gray-50 p-6 rounded-xl border border-gray-200 ${isLocked ? 'opacity-70 pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Paid Previously</p>
                                <p className="text-lg font-bold text-gray-700">KES {paidSoFar.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase font-bold">Balance Due</p>
                                <p className={`text-xl font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    KES {balanceDue.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Add New Payment</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400 text-sm">KES</span>
                                    <input 
                                        type="number" 
                                        min="0"
                                        className="w-full input pl-12 bg-white border-green-300 focus:ring-green-500"
                                        placeholder="0"
                                        value={newPayment} 
                                        onChange={e => setNewPayment(Number(e.target.value))} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                                <select
                                    className="w-full select bg-white border-green-300"
                                    value={paymentMethod} 
                                    onChange={e => setPaymentMethod(e.target.value)}
                                >
                                    <option>Cash</option>
                                    <option>Mpesa</option>
                                    <option>Card</option>
                                </select>
                            </div>
                        </div>

                        {(paymentMethod === 'Mpesa' && newPayment > 0) && (
                            <div className="mt-4 bg-green-100 p-3 rounded-lg border border-green-200">
                                <label className="block text-xs font-bold text-green-800 uppercase mb-1">MPESA Transaction Code</label>
                                <input 
                                    type="text" 
                                    className="w-full input input-sm border-green-300 bg-white uppercase font-mono tracking-widest" 
                                    placeholder="e.g. QFH382..."
                                    value={mpesaCode} 
                                    onChange={e => setMpesaCode(e.target.value)} 
                                />
                            </div>
                        )}
                    </div>

                    {!isLocked ? (
                        <button
                            onClick={handleSave}
                            className="w-full btn btn-primary btn-lg shadow-lg flex items-center justify-center gap-2"
                        >
                            <Save size={24} /> Save & Update Record
                        </button>
                    ) : (
                        <div className="text-center text-xs text-gray-400 italic">
                            To modify this record, please contact the Shop Owner.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}