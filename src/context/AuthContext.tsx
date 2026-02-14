import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrganizationService } from '../features/organization/org.service';
import { ImageManager } from '../lib/storage';

// Define Organization Shape for Context
type Organization = {
  id: string;
  name: string;
  logo_url: string | null;
  logo_blob?: string | null; // The viewable URL
};

type UserSession = {
  id: string;
  username: string;
  full_name: string;
  role: 'owner' | 'admin' | 'staff';
};

interface AuthContextType {
  user: UserSession | null;
  organization: Organization | null; // <--- NEW
  setUser: (user: UserSession | null) => void;
  refreshOrganization: () => Promise<void>; // To update logo immediately after settings change
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to load org and logo
  const refreshOrganization = async () => {
    try {
      const orgData = await OrganizationService.getCurrent();
      if (orgData) {
        let logoBlob = null;
        if (orgData.logo_url) {
          logoBlob = await ImageManager.getUrl(orgData.logo_url);
        }
        // @ts-ignore
        setOrganization({ ...orgData, logo_blob: logoBlob });
      }
    } catch (e) {
      console.error("Failed to load org context", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      // 1. Load User
      const stored = sessionStorage.getItem('repair_shop_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
      
      // 2. Load Organization
      await refreshOrganization();
      
      setIsLoading(false);
    };
    init();
  }, []);

  const logout = () => {
    sessionStorage.removeItem('repair_shop_user');
    setUser(null);
  };

  const handleSetUser = (u: UserSession | null) => {
    if (u) {
      sessionStorage.setItem('repair_shop_user', JSON.stringify(u));
    } else {
      sessionStorage.removeItem('repair_shop_user');
    }
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, organization, setUser: handleSetUser, refreshOrganization, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);