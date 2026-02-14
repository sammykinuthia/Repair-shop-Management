import { JSX, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initTables } from './lib/db';
import { OrganizationService } from './features/organization/org.service'; // Import this
import { getCurrentWindow } from '@tauri-apps/api/window';
import AppLayout from './components/layout/AppLayout';
import { exit } from '@tauri-apps/plugin-process';
import { AutoBackupService } from './lib/backup';
import { SyncService } from './features/sync/sync.service';

// Pages
import Login from './pages/Login';
import SetupShop from './pages/onboarding/SetupShop'; // Import the new page
import Dashboard from './pages/Dashboard';
import CreateRepair from './pages/CreateRepair';
import ClientsList from './pages/ClientsList';
import ClientDetails from './pages/ClientDetails';
import RepairDetails from './pages/RepairDetails';
import RepairsList from './pages/RepairsList';
import StaffManagement from './pages/admin/StaffManagement';
import TicketPrint from './pages/print/TicketPrint';
import Settings from './pages/admin/Settings';
import StickerPrint from './pages/print/StickerPrint';
import AuditLogs from './pages/admin/AuditLogs';
import ForgotPassword from './pages/ForgotPassword';
import CloudLogin from './pages/onboarding/CloudLogin';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false); // Controls redirection to Setup
  // --- AUTO BACKUP & SHUTDOWN LOGIC ---
  useEffect(() => {
    const appWindow = getCurrentWindow();
    if (appWindow.label !== 'main') return; // Only set up for main window

    // Listen for the close request
    const unlistenPromise = appWindow.onCloseRequested(async (event) => {
      // 1. Prevent the immediate close
      event.preventDefault();

      try {
        // 2. Perform the backup
        // We assume this takes < 1 second. 
        // If you want a loading spinner, you'd need a UI overlay here.
        await AutoBackupService.performAutoBackup();
      } catch (e) {
        console.error("Backup failed during shutdown", e);
      } finally {
        // 3. Force Exit the application
        // We use the process plugin to kill the app completely
        await exit(0);
      }
    });

    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, []);

  // --- SYNC ENGINE ---
  useEffect(() => {
    // 1. Initial Sync on Load (Wait 5 seconds for app to settle)
    const initialSyncTimer = setTimeout(() => {
      console.log("Performing initial sync...");
      SyncService.pushData();
    }, 5000);

    // 2. Periodic Sync (Every 2 minutes)
    const intervalId = setInterval(() => {
      console.log("Performing periodic sync...");
      SyncService.pushData();
    }, 120000); // 120,000 ms = 2 minutes

    return () => {
      clearTimeout(initialSyncTimer);
      clearInterval(intervalId);
    };
  }, []);

  // ------------------------------------
  useEffect(() => {
    async function setup() {
      try {
        const appWindow = getCurrentWindow();
        const label = appWindow.label;

        if (label === 'main') {
          console.log("Initializing DB...");
          await initTables();

          // Check if the shop is set up
          const hasOrg = await OrganizationService.hasOrganization();
          if (!hasOrg) {
            setNeedsSetup(true);
          }
        }
        setDbReady(true);
      } catch (e) {
        console.error("Init Error:", e);
        setDbReady(true);
      }
    }
    setup();
  }, []);

  if (!dbReady) return <div className="h-screen flex items-center justify-center">System Initializing...</div>;

  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Print Route */}
          <Route path="/print/ticket/:id" element={<TicketPrint />} />
          <Route path="/print/sticker/:id" element={<StickerPrint />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Setup / Login Routes */}
          <Route path="/setup" element={
            // Guard: If setup is NOT needed, go to login
            !needsSetup ? <Navigate to="/login" /> : <SetupShop onComplete={() => setNeedsSetup(false)} />
          } />

          <Route path="/login" element={
            // Guard: If setup IS needed, go to setup
            needsSetup ? <Navigate to="/setup" /> : <Login />
          } />
          <Route path="/setup/cloud" element={
            <CloudLogin onComplete={() => setNeedsSetup(false)} />
          } />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="repairs/new" element={<CreateRepair />} />
            <Route path="repairs" element={<RepairsList />} />
            <Route path="repairs/:id" element={<RepairDetails />} />
            <Route path="clients" element={<ClientsList />} />
            <Route path="clients/:id" element={<ClientDetails />} />
            <Route path="admin/staff" element={<StaffManagement />} />
            <Route path="admin/audit" element={<AuditLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}