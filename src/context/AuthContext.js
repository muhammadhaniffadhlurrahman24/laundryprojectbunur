'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  // Load auth state from localStorage on component mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      setIsLoggedIn(authData.isLoggedIn);
      setUsername(authData.username);
    }
  }, []);

  const login = (username, password) => {
    // Simple admin authentication
    if (username === 'admin' && password === 'admin111111') {
      setIsLoggedIn(true);
      setUsername(username);
      localStorage.setItem('auth', JSON.stringify({ isLoggedIn: true, username }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername('');
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}