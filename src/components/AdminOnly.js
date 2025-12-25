import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

/**
 * Component to restrict access to admin users only
 * Redirects non-admin users to the dashboard
 */
const AdminOnly = ({ children }) => {
  const { isAdmin, loading } = useRole();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        Chargement...
      </div>
    );
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default AdminOnly;
