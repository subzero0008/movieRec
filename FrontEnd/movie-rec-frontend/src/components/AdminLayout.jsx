import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminService from '../services/adminService';
import { useAuth } from '../AuthContext'; // Импортирайте вашия AuthContext

const AdminLayout = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Вземете текущия потребител

  useEffect(() => {
    const verifyAdminAccess = async () => {
      // 1. Проверка дали има логнат потребител
      if (!user?.token) {
        navigate('/login');
        return;
      }

      try {
        // 2. Проверка за администраторски права
        const adminStatus = await AdminService.checkAdminStatus();
        
        if (!adminStatus) {
          navigate('/'); // Пренасочване ако не е админ
        } else {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        
        // 3. При грешка 401 - logout и пренасочване
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
        } else {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAdminAccess();
  }, [navigate, user, logout]);

  if (loading) {
    return <div className="text-white p-4">Checking admin privileges...</div>;
  }

  if (!isAdmin) {
    return null; // Или съобщение за грешка
  }

  // 4. Връщаме Outlet за вложените маршрути
  return (
    <div className="admin-layout bg-gray-900 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
      <div className="admin-content">
        <Outlet /> {/* Тук ще се рендерират /admin/users и /admin/reviews */}
      </div>
    </div>
  );
};

export default AdminLayout;