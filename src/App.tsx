// src/App.tsx
import { JSX, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initTables, db } from './lib/db';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateRepair from './pages/CreateRepair';
import ClientDetails from './pages/ClientDetails';
import ClientsList from './pages/ClientsList';
import StaffManagement from './pages/admin/StaffManagement';
import RepairDetails from './pages/RepairDetails';
import RepairsList from './pages/RepairsList';
import TicketPrint from './pages/print/TicketPrint';
import Settings from './pages/Settings';
import { getCurrentWindow } from '@tauri-apps/api/window';


// A component to protect routes
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>; // Or a spinner
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

   useEffect(() => {
    async function setup() {
      try {
        // 1. Check which window this is
        const appWindow = getCurrentWindow();
        const label = appWindow.label;

        // 2. Only run migrations/admin check in the MAIN window
        if (label === 'main') {
          console.log("Main Window: Initializing DB Tables...");
          await initTables();
          
          // Check for Admin user
          const userCount = await db.selectFrom('users')
            .select((eb) => eb.fn.count('id').as('count'))
            .executeTakeFirst();
            
          const count = Number(userCount?.count ?? 0);
          if (count === 0) setNeedsSetup(true);
        } else {
          console.log(`Window [${label}]: Skipping DB Migration.`);
        }

        // 3. Mark ready (for all windows) so UI can render
        setDbReady(true);

      } catch (e) {
        console.error("Initialization Failed:", e);
        // Even if init fails (e.g. lock), try to let the UI render
        setDbReady(true); 
      }
    }
    setup();
  }, []);;

  if (!dbReady) return <div className="h-screen flex items-center justify-center">Initializing System...</div>;

  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* PUBLIC / PRINT ROUTES (No Sidebar) */}
          <Route path="/print/ticket/:id" element={<TicketPrint />} />
          {/* Public Routes */}
          <Route path="/login" element={<Login isFirstRun={needsSetup} onSetupComplete={() => setNeedsSetup(false)} />} />
          {/* Protected App Routes */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="repairs/new" element={<CreateRepair />} />
            <Route path="repairs" element={<RepairsList />} />
            <Route path="repairs/:id" element={<RepairDetails />} />
            <Route path="clients" element={<ClientsList />} />
            <Route path="clients/:id" element={<ClientDetails />} />
            <Route path="repairs" element={<div>Repairs Page</div>} />
            <Route path="clients" element={<div>Clients Page</div>} />
            {/* Admin Routes */}
            <Route path="admin" element={<StaffManagement />} />
            <Route path="admin" element={<div>Admin Page</div>} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}