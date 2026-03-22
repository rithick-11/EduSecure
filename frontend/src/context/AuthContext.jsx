import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('edusecure_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('edusecure_token'));

  useEffect(() => {
    if (user) localStorage.setItem('edusecure_user', JSON.stringify(user));
    else localStorage.removeItem('edusecure_user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('edusecure_token', token);
    else localStorage.removeItem('edusecure_token');
  }, [token]);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    setToken(data.access_token);
    // Decode JWT payload (base64) to get user info
    const payload = JSON.parse(atob(data.access_token.split('.')[1]));
    setUser({ id: payload.user_id, email: payload.email, role: payload.role });
    return data;
  };

  const register = async (formData) => {
    const { data } = await API.post('/auth/register', formData);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
