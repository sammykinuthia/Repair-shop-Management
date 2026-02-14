import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientService } from '../features/clients/client.service';
import { RepairService } from '../features/repairs/repair.service';
import { ImageManager } from '../lib/storage';
import { open } from '@tauri-apps/plugin-dialog';
import { Camera, Search, Save, UserPlus, CheckCircle, X, ImageOff } from 'lucide-react';
import { PrinterService } from '../lib/printers';

export default function CreateRepair() {
  const navigate = useNavigate();

  // Client State
  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  // Repair State
  const [device, setDevice] = useState({
    type: 'TV',
    brand: '',
    model: '',
    serial: '',
    issue: '',
    accessories: '',
    deposit: ''
  });

  // Image State
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false); // Track loading errors

  // --- LOGIC: CLIENT ---
  const handlePhoneSearch = async () => {
    if (phoneSearch.length < 4) return;
    const client = await ClientService.getByPhone(phoneSearch);

    if (client) {
      setSelectedClient(client);
      setIsNewClient(false);
    } else {
      setSelectedClient(null);
      setIsNewClient(true);
    }
  };

  // --- LOGIC: IMAGE ---
  const handleImageSelect = async () => {
    try {
      const file = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
      });

      if (file) {
        setImgError(false); // Reset error state
        // 1. Save File
        const savedName = await ImageManager.save(file as string);
        setImageFile(savedName);

        // 2. Generate URL
        const url = await ImageManager.getUrl(savedName);
        console.log("Setting Preview:", url);
        setPreviewUrl(url);
      }
    } catch (error) {
      console.error("Image select error:", error);
      alert("Failed to load image");
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setImgError(false);
  };

  // --- LOGIC: SUBMIT ---
  const handleSubmit = async () => {
    try {
      let clientId = selectedClient?.id;

      if (isNewClient) {
        if (!newClientName) {
          alert("Please enter the new client's name");
          return;
        }
        const newClient = await ClientService.create({
          full_name: newClientName,
          phone: phoneSearch,
          location: 'Shop Walk-in'
        });
        clientId = newClient.id;
      }

      if (!clientId) {
        alert("Please identify a client first");
        return;
      }

      if (!device.issue) {
        alert("Please describe the issue");
        return;
      }

      const result = await RepairService.create({
        client_id: clientId,
        device_type: device.type,
        brand: device.brand,
        model: device.model,
        serial_no: device.serial,
        issue_description: device.issue,
        accessories: device.accessories,
        deposit: Number(device.deposit),
        image_paths: imageFile ? [imageFile] : []
      });

      // Show success but stay on page (or show modal)
      const confirmed = confirm("Ticket Created! Do you want to print the device sticker now?");
      if (confirmed) {
        // Open Sticker Print Window
        // result.insertId is the UUID string
        PrinterService.printSticker(result.insertId);

        // Then go to dashboard after a delay
        setTimeout(() => navigate('/'), 1000);
      } else {
        navigate('/');
      }

    } catch (e) {
      console.error(e);
      alert("Failed to save repair. Check console.");
    }
  };
  // const printSticker = async (repairId: string) => {
  //   const label = `sticker-${Date.now()}`;
  //   const webview = new WebviewWindow(label, {
  //     url: `/#/print/sticker/${repairId}`,
  //     title: 'Print Sticker',
  //     width: 320,
  //     height: 250, // Small window for sticker
  //     resizable: false,
  //     alwaysOnTop: true,
  //   });
  // };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">New Repair Check-In</h1>

      {/* STEP 1: CLIENT */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
          <UserPlus size={20} className="text-blue-600" /> Client Details
        </h2>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="w-full input bg-slate-50 border-gray-300"
                placeholder="07..."
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                onBlur={handlePhoneSearch}
              />
              <button onClick={handlePhoneSearch} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 border border-gray-300">
                <Search size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full">
            {selectedClient ? (
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-2 h-[42px]">
                <CheckCircle size={18} /> Existing: <strong>{selectedClient.full_name}</strong>
              </div>
            ) : (isNewClient && phoneSearch.length > 3) ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Client Name</label>
                <input
                  type="text"
                  className="w-full input bg-slate-50 border-gray-300"
                  placeholder="Enter Full Name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </div>
            ) : <div className="h-[42px]"></div>}
          </div>
        </div>
      </div>

      {/* STEP 2: DEVICE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
          <Camera size={20} className="text-blue-600" /> Device & Issue
        </h2>

        {/* ... (Device inputs kept same as your code) ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Device Type</label>
            <select
              className="w-full select bg-slate-50 border-gray-300 mt-1"
              value={device.type}
              onChange={e => setDevice({ ...device, type: e.target.value })}
            >
              <option>TV</option>
              <option>Phone</option>
              <option>Laptop</option>
              <option>Audio System</option>
              <option>Microwave</option>
              <option>Fridge</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Brand</label>
            <input type="text" className="w-full input bg-slate-50 border-gray-300 mt-1"
              value={device.brand} onChange={e => setDevice({ ...device, brand: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Model No</label>
            <input type="text" className="w-full input bg-slate-50 border-gray-300 mt-1"
              value={device.model} onChange={e => setDevice({ ...device, model: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Serial No</label>
            <input type="text" className="w-full input bg-slate-50 border-gray-300 mt-1"
              value={device.serial} onChange={e => setDevice({ ...device, serial: e.target.value })} />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Issue Description *</label>
          <textarea className="w-full input bg-slate-50 border-gray-300 mt-1 h-24 focus:ring-2 focus:ring-blue-500 outline-none"
            value={device.issue} onChange={e => setDevice({ ...device, issue: e.target.value })}
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Accessories</label>
            <input type="text" className="w-full input bg-slate-50 border-gray-300 mt-1"
              value={device.accessories} onChange={e => setDevice({ ...device, accessories: e.target.value })} />
          </div>
            <div>
            <label className="block text-sm font-medium text-gray-700">Deposit (KES)</label>
            <input
              type="number"
              min={0}
              className="w-full input bg-slate-50 border-gray-300 mt-1"
              value={device.deposit}
              onChange={e => setDevice({ ...device, deposit: e.target.value })}
            />
            </div>
        </div>

        {/* IMAGE UPLOAD SECTION */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <label className="block text-sm font-medium text-gray-700 mb-2">Device Photo (Optional)</label>

          {!previewUrl ? (
            <button
              onClick={handleImageSelect}
              className="w-full cursor-pointer py-8 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 transition"
            >
              <Camera size={32} className="text-gray-400" />
              <span className="text-gray-600 font-medium">Click to Take Photo / Upload</span>
            </button>
          ) : (
            <div className="relative w-full max-w-sm">
              {/* Image Preview with Error Handling */}
              {!imgError ? (
                <img
                  src={previewUrl}
                  alt="Device Preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                  onError={(e) => {
                    console.error("Image failed to load:", e);
                    setImgError(true);
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-red-50 flex flex-col items-center justify-center text-red-500 border border-red-200 rounded-lg">
                  <ImageOff size={32} />
                  <p className="text-xs mt-2">Failed to load image preview</p>
                </div>
              )}

              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
                title="Remove Image"
              >
                <X size={16} />
              </button>

              {!imgError && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle size={12} /> Image attached
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 transition text-lg"
        >
          <Save size={24} /> Create Repair Ticket
        </button>

      </div>
    </div>
  );
}