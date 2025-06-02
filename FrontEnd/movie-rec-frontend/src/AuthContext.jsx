import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Loaded User:", parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Parse error:", error);
      }
    }
  }, []);

  const login = (loginResponse) => {
    if (!loginResponse || !loginResponse.token) {
      console.error("Invalid login response:", loginResponse);
      throw new Error("Invalid login response - no token provided");
    }

    // Декодиране на токена
    let decoded;
    try {
      decoded = jwtDecode(loginResponse.token);
      console.log("Decoded token:", decoded);
    } catch (error) {
      console.error("Token decode error:", error);
      throw new Error("Failed to decode authentication token");
    }

    // Определяне на ролята
    const role = decoded.role || 
                decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
                decoded.roles?.[0] || 
                'User';

    // Създаване на потребителски обект
    const userData = {
      id: decoded.sub || loginResponse.user?.id,
      username: decoded.unique_name || loginResponse.user?.userName || decoded.preferred_username,
      email: decoded.email || loginResponse.user?.email,
      role: role,
      token: loginResponse.token,
      // Добавяме roles като масив за обратна съвместимост
      roles: [role]
    };

    console.log("Processed user data:", userData);

    // Запазване в localStorage и state
    localStorage.setItem('authToken', loginResponse.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
  };

  // Помощни функции за проверка на роли
  const hasRole = (role) => {
    return user?.roles?.includes(role) || user?.role === role;
  };

  const isCinema = hasRole('Cinema');
  const isAdmin = hasRole('Admin');
  const isUser = hasRole('User');

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout,
      hasRole,
      isCinema,
      isAdmin,
      isUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};