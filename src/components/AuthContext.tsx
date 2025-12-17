import { createContext, useContext, useState } from 'react';

// Define the User type based on what we return from AuthService
type User = { id: number; username: string; role: 'admin' | 'staff'; full_name: string };

const AuthContext = createContext<{
  user: User | null;
  setUser: (u: User | null) => void;
}>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);