import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Проверяваме за потребител при зареждане
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Stored User:", parsedUser);  // Лог за проверка на състоянието на потребителя
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (userData) => {
    if (userData.token) {  // Проверка дали има токен в userData
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } else {
      console.error("No token in user data");  // Ако няма токен, показваме съобщение за грешка
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
