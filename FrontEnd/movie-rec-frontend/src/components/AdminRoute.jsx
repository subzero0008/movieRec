import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAdminStatus } from '../services/adminService';

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const adminStatus = await checkAdminStatus();
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          navigate('/unauthorized');
        }
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [navigate]);

  if (loading) return <div className="loading">Verifying permissions...</div>;

  return isAdmin ? children : null;
};

export default AdminRoute;