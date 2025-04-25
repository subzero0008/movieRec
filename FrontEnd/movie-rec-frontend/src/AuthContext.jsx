import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Loaded User ID:", parsedUser.id, "Type:", typeof parsedUser.id);
        setUser(parsedUser);
      } catch (error) {
        console.error("Parse error:", error);
      }
    }
  }, []);

  const login = (userData) => {
    if (userData.token) {
      // Запазваме токена отделно за по-лесен достъп
      localStorage.setItem('authToken', userData.token); 
      // Запазваме целият user обект
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } else {
      console.error("No token in user data");
      throw new Error("Login failed: No token received");
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
