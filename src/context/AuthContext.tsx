// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// Use the Type from your DB definition, but without the password hash
export type UserSession = {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'staff';
};

interface AuthContextType {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is saved in sessionStorage (to persist refresh)
    const stored = sessionStorage.getItem('repair_shop_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    sessionStorage.removeItem('repair_shop_user');
    setUser(null);
  };

  // Intercept setUser to save to storage automatically
  const handleSetUser = (u: UserSession | null) => {
    if (u) {
      sessionStorage.setItem('repair_shop_user', JSON.stringify(u));
    } else {
      sessionStorage.removeItem('repair_shop_user');
    }
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);