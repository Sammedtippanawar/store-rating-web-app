import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // No localStorage 

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiCall('/auth/login', 'POST', { email, password });
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, address, password, role) => {
    setLoading(true);
    try {
      const data = await apiCall('/auth/register', 'POST', { name, email, address, password, role });
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const updatePassword = async (oldPassword, newPassword) => {
    return await apiCall('/auth/update-password', 'POST', { oldPassword, newPassword }, token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
