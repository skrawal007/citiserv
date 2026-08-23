import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/env';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const sessionUserData = sessionStorage.getItem('userData');
      if (sessionUserData) {
        const parsed = JSON.parse(sessionUserData);
        if (parsed.userData) return parsed.userData;
      }
      const savedUser = localStorage.getItem('cctns_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const logout = () => {
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    localStorage.removeItem('cctns_user');
  };

  // Automatically attach Bearer token to all axios requests if available
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifySession(token);
    }
  }, []);

  const verifySession = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/login`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data.success && res.data.user) {
        setUser(res.data.user);
      } else {
        logout();
      }
    } catch (e) {
      console.warn('Session verification notice:', e.message);
      if (e.response?.status === 401 || e.response?.status === 404) {
        logout();
      }
    }
  };

  const login = async (username, pass) => {
    try {
      const response = await axios.post(`${API_BASE}/login`, { username, pass });
      if (response.data && response.data.success) {
        const token = response.data.token;
        const userData = response.data.user || { username, usertype: response.data.user?.usertype || 1 };
        
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('userData', JSON.stringify({ isLoggedIn: true, userData }));
        localStorage.setItem('cctns_user', JSON.stringify(userData));
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return { success: true, message: 'Login successful' };
      } else {
        return { success: false, message: response.data?.message || 'Wrong username/password combination!' };
      }
    } catch (err) {
      console.error('Backend login error:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check connection and credentials.',
      };
    }
  };

  const isAuthenticated = !!user || !!sessionStorage.getItem('authToken');

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
