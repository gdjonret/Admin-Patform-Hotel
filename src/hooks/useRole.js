import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to check user role and permissions
 */
export const useRole = () => {
  const { user, loading } = useAuth();
  
  const isAdmin = user?.role === 'ADMIN';
  const isReceptionist = user?.role === 'RECEPTIONIST';
  
  return {
    user,
    isAdmin,
    isReceptionist,
    loading,
    hasRole: (role) => user?.role === role,
    hasAnyRole: (...roles) => roles.includes(user?.role),
  };
};

export default useRole;
