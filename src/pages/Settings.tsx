import { useState, useEffect } from 'react'; // Added useEffect
import { copyFile, BaseDirectory, exists } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import { Database, Save, ShieldCheck, Store } from 'lucide-react'; // Added Store icon
import { useAuth } from '../context/AuthContext';
import { SettingsService } from '../features/settings/settings.service'; // Import the service
import { open as openUrl } from '@tauri-apps/plugin-shell'; 

export default function Settings() {
  const { user } = useAuth();
  const [backupStatus, setBackupStatus] = useState('');

  // --- NEW: Shop Settings State ---
  const [shop, setShop] = useState({
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    terms: ''
  });

  // --- NEW: Load Settings on Mount ---
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await SettingsService.getSettings();
      setShop(data);
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const handleSaveShop = async () => {
    try {
      await SettingsService.saveSettings(shop);
      alert("Shop details saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save shop details.");
    }
  };

  // --- EXISTING: Backup Logic (Unchanged) ---
  const handleBackup = async () => {
    try {
      setBackupStatus('Locating database...');
      const dbName = 'repair_stock_management.db';

      // 1. Determine where the DB file actually is
      let sourceDir = BaseDirectory.AppData;

      // Check AppData (~/.local/share/...)
      // wrapped in try-catch in case permission error occurs during 'exists' check
      let found = false;
      try {
        if (await exists(dbName, { baseDir: BaseDirectory.AppData })) {
          found = true;
          sourceDir = BaseDirectory.AppData;
        }
      } catch (e) { console.log("AppData check failed", e); }

      if (!found) {
        try {
          // If not in AppData, check AppConfig (~/.config/...)
          if (await exists(dbName, { baseDir: BaseDirectory.AppConfig })) {
            found = true;
            sourceDir = BaseDirectory.AppConfig;
          }
        } catch (e) { console.log("AppConfig check failed", e); }
      }

      // Fallback if exists() fails due to strict permissions but file is likely there
      if (!found) {
        console.warn("Could not verify DB location. Defaulting to AppConfig for Linux.");
        sourceDir = BaseDirectory.AppConfig;
      }

      setBackupStatus('Selecting destination...');

      // 2. Open Save Dialog
      const destination = await save({
        defaultPath: `repair_backup_${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'Database', extensions: ['db'] }]
      });

      if (!destination) {
        setBackupStatus('');
        return;
      }

      setBackupStatus('Backing up...');

      // 3. Copy from the correct source directory
      await copyFile(dbName, destination, {
        fromPathBaseDir: sourceDir // Uses the directory we found earlier
      });

      setBackupStatus('Backup Successful! ✅');
      setTimeout(() => setBackupStatus(''), 3000);

    } catch (e: any) {
      console.error(e);
      setBackupStatus('Backup Failed ❌');
      alert("Error: " + (e.message || JSON.stringify(e)));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>

      {/* --- NEW: SHOP DETAILS CARD --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Store className="text-blue-600" /> Shop Details (For Tickets)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Shop Name</label>
            <input
              type="text"
              className="w-full input "
              value={shop.shop_name}
              onChange={e => setShop({ ...shop, shop_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Phone Contact</label>
            <input
              type="text"
              className="w-full input "
              value={shop.shop_phone}
              onChange={e => setShop({ ...shop, shop_phone: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 font-medium mb-1">Address / Location</label>
            <input
              type="text"
              className="w-full input "
              value={shop.shop_address}
              onChange={e => setShop({ ...shop, shop_address: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 font-medium mb-1">Ticket Terms & Conditions</label>
            <textarea
              className="w-full textarea resize-none"
              value={shop.terms}
              onChange={e => setShop({ ...shop, terms: e.target.value })}
            />
          </div>
        </div>
        <button
          onClick={handleSaveShop}
          className="btn btn-lg btn-primary flex items-center gap-2"
        >
          <Save size={18} /> Save Shop Details
        </button>
      </div>

      {/* EXISTING: ACCOUNT CARD */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShieldCheck className="text-blue-600" /> My Account
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500">Full Name</label>
            <p className="font-medium">{user?.full_name}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Role</label>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* EXISTING: BACKUP CARD */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="text-green-600" /> Data Management
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Your data is stored locally on this computer. Please back it up regularly to a USB drive or Cloud folder.
        </p>

        <button
          onClick={handleBackup}
          className="btn btn-lg btn-secondary flex items-center gap-2"
        >
          <Save size={20} /> Backup Database Now
        </button>

        {backupStatus && (
          <p className="mt-2 text-sm font-medium text-blue-600 animate-pulse">
            {backupStatus}
          </p>
        )}
      </div>

      <div className="text-center pt-10 pb-4 text-sm text-gray-400">
        <p>Repair Manager v1.0.0</p>
        <p className="mt-1">
          Powered by <button onClick={() => openUrl('https://royoltech.com')} className="text-blue-500 hover:underline link">
            Royoltech Solutions
          </button>
        </p>
      </div>
    </div>
  );
}