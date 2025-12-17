import { useAuth } from './AuthContext';

export const RoleGuard = ({ allowedRoles, children }: { allowedRoles: string[], children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return null; // Render nothing if permission denied
  }
  
  return <>{children}</>;
};