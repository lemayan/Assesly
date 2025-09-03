import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type User = { id: number; name: string; email: string; role: 'admin' | 'student' };

type AuthContextType = {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  // Set base URL once (allows override via VITE_API_URL)
  const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';
  axios.defaults.baseURL = apiBase;
  useEffect(() => {
    if (token) localStorage.setItem('token', token); else localStorage.removeItem('token');
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
    axios.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';
  }, [token, user]);

  const login = async (email: string, password: string) => {
    const res = await axios.post('/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user as User;
  };
  const logout = () => {
    setToken(null);
    setUser(null);
    // Redirect to landing
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  const value = useMemo(() => ({ token, user, login, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
