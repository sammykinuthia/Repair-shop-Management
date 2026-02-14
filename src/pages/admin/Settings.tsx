import { useState, useEffect } from 'react';
import { copyFile, BaseDirectory, exists } from '@tauri-apps/plugin-fs';
import { save, open } from '@tauri-apps/plugin-dialog';
import { open as openUrl } from '@tauri-apps/plugin-shell';
import { Database, Save, ShieldCheck, Store, Upload, Image as ImageIcon, Trash2, FolderOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OrganizationService } from '../../features/organization/org.service';
import { ImageManager } from '../../lib/storage';
import { DBNAME, db } from '../../lib/db';

export default function Settings() {
  const { user, refreshOrganization } = useAuth();
  const [backupStatus, setBackupStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [customBackupPath, setCustomBackupPath] = useState(''); // 👈 New State

  // Shop Settings State
  const [orgId, setOrgId] = useState('');
  const [shop, setShop] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    terms: '',
    logo_url: ''
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Load Data on Mount
  useEffect(() => {
    async function loadData() {
      // 1. Load Org Details (Existing logic)
      const data = await OrganizationService.getCurrent();
      if (data) {
        setOrgId(data.id);
        setShop({
          name: data.name,
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          terms: data.terms || '',
          logo_url: data.logo_url || ''
        });
        if (data.logo_url) {
          const url = await ImageManager.getUrl(data.logo_url);
          setLogoPreview(url);
        }
      }

      // 2. Load Local Backup Path Preference (New Logic)
      const setting = await db.selectFrom('settings')
        .select('value')
        .where('key', '=', 'backup_path')
        .executeTakeFirst();

      if (setting) setCustomBackupPath(setting.value);
    }
    loadData();
  }, []);

  // --- NEW: Handle Folder Selection ---
  const handleSelectBackupFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Auto-Backup Folder"
      });

      if (selected) {
        const path = selected as string;
        setCustomBackupPath(path);

        // Save to DB immediately
        await db.replaceInto('settings')
          .values({ key: 'backup_path', value: path })
          .execute();

        alert(`Backup location updated to: ${path}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to select folder");
    }
  };

  // --- LOGO LOGIC ---
  const handleLogoUpload = async () => {
    try {
      const file = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
      });

      if (file) {
        // Save to AppData
        const savedName = await ImageManager.save(file as string);
        // Generate Preview URL
        const url = await ImageManager.getUrl(savedName);

        setShop(prev => ({ ...prev, logo_url: savedName }));
        setLogoPreview(url);
      }
    } catch (e) {
      alert("Failed to upload logo");
    }
  };

  const handleRemoveLogo = () => {
    setShop(prev => ({ ...prev, logo_url: '' }));
    setLogoPreview(null);
  };

  // --- SAVE LOGIC ---
  const handleSaveShop = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      // @ts-ignore 
      await OrganizationService.update(orgId, {
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
        email: shop.email,
        logo_url: shop.logo_url,
        terms: shop.terms
      });
      await refreshOrganization();
      alert("Shop details saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save shop details.");
    } finally {
      setLoading(false);
    }
  };

  // --- BACKUP LOGIC ---
  const handleBackup = async () => {
    try {
      setBackupStatus('Locating database...');

      let sourceDir = BaseDirectory.AppData;
      let found = false;

      // Smart location check logic
      try {
        if (await exists(DBNAME, { baseDir: BaseDirectory.AppData })) {
          found = true;
          sourceDir = BaseDirectory.AppData;
        }
      } catch (e) { }

      if (!found) {
        try {
          if (await exists(DBNAME, { baseDir: BaseDirectory.AppConfig })) {
            found = true;
            sourceDir = BaseDirectory.AppConfig;
          }
        } catch (e) { }
      }

      if (!found) sourceDir = BaseDirectory.AppConfig; // Fallback

      setBackupStatus('Selecting destination...');
      const destination = await save({
        defaultPath: `repair_backup_${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'Database', extensions: ['db'] }]
      });

      if (!destination) {
        setBackupStatus('');
        return;
      }

      setBackupStatus('Backing up...');
      await copyFile(DBNAME, destination, { fromPathBaseDir: sourceDir });

      setBackupStatus('Backup Successful! ✅');
      setTimeout(() => setBackupStatus(''), 3000);
    } catch (e: any) {
      setBackupStatus('Backup Failed ❌');
      alert("Error: " + (e.message || JSON.stringify(e)));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 md:px-0">
      <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>

      {/* SHOP BRANDING CARD */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Store className="text-blue-600" /> Shop Branding & Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo Column */}
          <div className="md:col-span-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            {logoPreview ? (
              <div className="relative w-full h-32 flex items-center justify-center">
                <img src={logoPreview} alt="Shop Logo" className="max-h-full max-w-full object-contain" />
                <button onClick={handleRemoveLogo} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200 shadow-sm">
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <ImageIcon size={40} className="mx-auto mb-2 opacity-50" />
                <span className="text-xs">No Logo Uploaded</span>
              </div>
            )}
            <button
              onClick={handleLogoUpload}
              className="mt-4 text-xs bg-white border border-gray-300 px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2 transition"
            >
              <Upload size={12} /> {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </button>
          </div>

          {/* Form Column */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Shop Name</label>
              <input type="text" className="w-full input bg-slate-50 border-gray-300"
                value={shop.name} onChange={e => setShop({ ...shop, name: e.target.value })} />
            </div>
            {/* Phone */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Phone Contact</label>
              <input type="text" className="w-full input bg-slate-50 border-gray-300"
                value={shop.phone} onChange={e => setShop({ ...shop, phone: e.target.value })} />
            </div>

            {/* NEW: Email Address */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Organization Email</label>
              <input type="email" className="w-full input bg-slate-50 border-gray-300"
                placeholder="admin@shop.com (Used for password resets)"
                value={shop.email} onChange={e => setShop({ ...shop, email: e.target.value })} />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Address / Location</label>
              <input type="text" className="w-full input bg-slate-50 border-gray-300"
                value={shop.address} onChange={e => setShop({ ...shop, address: e.target.value })} />
            </div>

            {/* Terms */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Receipt Terms & Conditions <span className="text-gray-400 font-normal">(Visible on print)</span>
              </label>
              <textarea
                className="w-full textarea bg-slate-50 border-gray-300 h-24 text-sm resize-none"
                placeholder="e.g. 1. Goods left for 30 days are sold to recover costs."
                value={shop.terms}
                onChange={e => setShop({ ...shop, terms: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t pt-4">
          <button onClick={handleSaveShop} disabled={loading} className="btn btn-primary flex items-center gap-2">
            <Save size={18} /> {loading ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>

      {/* ACCOUNT CARD */}
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

      {/* BACKUP CARD */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="text-green-600" /> Data Management
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Your data is stored locally on this computer. Please back it up regularly to a USB drive or Cloud folder.
        </p>

        <button
          onClick={handleBackup}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Save size={20} /> Backup Database Now
        </button>

        {backupStatus && (
          <p className="mt-2 text-sm font-medium text-blue-600 animate-pulse">
            {backupStatus}
          </p>
        )}
      </div>
      {/* Custom Path Selection */}
      <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Auto-Backup Location</label>
        <div className="flex gap-2 items-center">
          <input
            readOnly
            type="text"
            value={customBackupPath || 'Default (Internal App Data)'}
            className="input input-sm flex-1 bg-white text-xs text-gray-600"
          />
          <button onClick={handleSelectBackupFolder} className="btn btn-sm btn-ghost border-slate-300" title="Change Folder">
            <FolderOpen size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Backups run automatically when you close the app.
        </p>
      </div>
      <div className="text-center pt-6 text-sm text-gray-400 pb-10">
        <p>Repair Manager v1.0.0</p>
        <p className="mt-1">
          Powered by <button onClick={() => openUrl('https://royoltech.com')} className="text-blue-500 hover:underline cursor-pointer">
            Royoltech Solutions
          </button>
        </p>
      </div>
    </div>
  );
}