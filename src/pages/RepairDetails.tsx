import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RepairService } from '../features/repairs/repair.service';
import { ImageManager } from '../lib/storage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { open } from '@tauri-apps/plugin-shell';
import {
    ArrowLeft, Save, MessageCircle,
    DollarSign, Wrench, Printer
} from 'lucide-react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export default function RepairDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [repair, setRepair] = useState<any>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [status, setStatus] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    
    // Financials
    const [costs, setCosts] = useState({ internal: 0, labor: 0, final: 0 });
    
    // Payment State
    const [paidSoFar, setPaidSoFar] = useState(0); // From DB (Deposit + History)
    const [newPayment, setNewPayment] = useState(0); // What client is paying NOW
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [mpesaCode, setMpesaCode] = useState('');

    // Load Data
    useEffect(() => {
        async function load() {
            if (!id) return;
            const data = await RepairService.getById(Number(id));
            if (data) {
                setRepair(data);
                setStatus(data.status);
                setDiagnosis(data.diagnosis || '');
                
                setCosts({
                    internal: data.internal_cost || 0,
                    labor: data.labor_cost || 0,
                    final: data.final_price || 0
                });

                // Load existing payments
                setPaidSoFar(data.amount_paid || 0);
                
                // Pre-fill mpesa code if exists (optional)
                setMpesaCode(data.mpesa_code || '');

                // Load Image
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
    // When Parts or Labor changes, update Final Price
    useEffect(() => {
        const total = Number(costs.internal) + Number(costs.labor);
        // Only auto-update if Final is currently 0 or equals previous sum (to allow overrides)
        // For simplicity, we just force update here. User can override Final AFTER setting parts/labor.
        setCosts(prev => ({ ...prev, final: total }));
    }, [costs.internal, costs.labor]);

    const sendWhatsApp = async () => {
        if (!repair) return;
        let phone = repair.client_phone.replace(/\D/g, ''); 
        if (phone.startsWith('0')) phone = '254' + phone.substring(1);
        const balance = costs.final - (paidSoFar + newPayment);
        const message = `Habari ${repair.client_name}. Your ${repair.device_type} (Ticket: ${repair.ticket_no}) status: ${status}. Total: KES ${costs.final}. Balance: KES ${balance}.`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        await open(url);
    };

    const handlePrint = async () => {
        const label = `print-ticket-${repair.id}`;
        const webview = new WebviewWindow(label, {
            url: `/#/print/ticket/${repair.id}`,
            title: 'Print Ticket',
            width: 380,
            height: 600,
            resizable: false,
            alwaysOnTop: true,
        });
        webview.once('tauri://error', (e) => {
            console.error("Window creation error:", e);
            alert("Could not open print window");
        });
    };

    const handleSave = async () => {
        if (!id) return;
        try {
            // Calculate new total paid
            const totalPaid = paidSoFar + Number(newPayment);
            
            // Check if fully paid
            let isPaid = 0;
            if (costs.final > 0 && totalPaid >= costs.final) {
                isPaid = 1;
            }

            await RepairService.update(Number(id), {
                status,
                diagnosis,
                internal_cost: Number(costs.internal),
                labor_cost: Number(costs.labor),
                final_price: Number(costs.final),
                amount_paid: totalPaid, // Update the total in DB
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

    if (loading) return <div>Loading...</div>;
    if (!repair) return <div>Repair not found</div>;

    const balanceDue = costs.final - (paidSoFar + Number(newPayment));

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* HEADER */}
            <div className="text-right flex flex-col items-end gap-2">
                <h1 className="text-2xl font-bold font-mono text-gray-800">{repair.ticket_no}</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="btn btn-xs btn-outline flex items-center gap-2"
                    >
                        <Printer size={14} /> Print Ticket
                    </button>
                    <StatusBadge status={repair.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: INFO */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        {imageUrl ? (
                            <img src={imageUrl} alt="Device" className="w-full h-48 object-cover rounded-lg mb-4 border" />
                        ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-400">No Image</div>
                        )}
                        <h3 className="font-bold text-lg">{repair.device_type}</h3>
                        <p className="text-gray-600">{repair.brand} {repair.model}</p>
                        <p className="text-xs text-gray-400 mt-1">Serial: {repair.serial_no}</p>
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-semibold text-gray-700">Client Issue:</p>
                            <p className="text-gray-600 italic">"{repair.issue_description}"</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-700 mb-2">Client Details</h3>
                        <p className="text-xl font-bold text-gray-800">{repair.client_name}</p>
                        <p className="text-blue-600 font-medium mt-1">{repair.client_phone}</p>
                        <button onClick={sendWhatsApp} className="mt-4 w-full flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full select bg-slate-100 border-green-300">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis / Technician Notes</label>
                            <textarea
                                className="w-full p-3 input bg-slate-100 border-green-300 h-24"
                                placeholder="Technician notes on what was fixed..."
                                value={diagnosis}
                                onChange={e => setDiagnosis(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    {/* 2. COSTING (Always Visible) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-green-600" /> Costing
                        </h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Parts Cost</label>
                                <input type="number" className="w-full input bg-slate-50 border-gray-300"
                                    value={costs.internal} onChange={e => setCosts({ ...costs, internal: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Labor Cost</label>
                                <input type="number" className="w-full input bg-slate-50 border-gray-300"
                                    value={costs.labor} onChange={e => setCosts({ ...costs, labor: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-800">Final Price (Total)</label>
                                <input type="number" className="w-full border-2 p-2 input bg-blue-50 border-blue-300 font-bold text-lg"
                                    value={costs.final} onChange={e => setCosts({ ...costs, final: Number(e.target.value) })} />
                            </div>
                        </div>
                    </div>

                    {/* 3. PAYMENT */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-4">Payment & Collection</h3>
                        
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Paid Previously</p>
                                <p className="text-lg font-bold text-gray-700">KES {paidSoFar.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase">Balance Due</p>
                                <p className={`text-xl font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    KES {balanceDue.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Add New Payment</label>
                                <input type="number" className="w-full input bg-white border-green-300"
                                    placeholder="0"
                                    value={newPayment} onChange={e => setNewPayment(Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Payment Method</label>
                                <select
                                    className="w-full select bg-white border-green-300"
                                    value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                                >
                                    <option>Cash</option>
                                    <option>Mpesa</option>
                                    <option>Card</option>
                                </select>
                            </div>
                        </div>

                        {(paymentMethod === 'Mpesa' && newPayment > 0) && (
                            <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-500">MPESA Transaction Code</label>
                                <input type="text" className="w-full input border-green-300 bg-green-50 uppercase" 
                                    placeholder="e.g. QFH382..."
                                    value={mpesaCode} onChange={e => setMpesaCode(e.target.value)} />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        className="btn btn-lg btn-primary flex items-center justify-center gap-2"
                    >
                        <Save size={24} /> Save & Update Record
                    </button>
                </div>
            </div>
        </div>
    );
}