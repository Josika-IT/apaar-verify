import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { email: string; password: string; otp?: string; captcha?: string }) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('apaar_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('apaar_token');
      const storedUser = localStorage.getItem('apaar_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify with server in background
          const freshUser = await api.getMe();
          setUser(freshUser);
          localStorage.setItem('apaar_user', JSON.stringify(freshUser));
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem('apaar_token');
          localStorage.removeItem('apaar_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: { email: string; password: string; otp?: string; captcha?: string }): Promise<User> => {
    const data = await api.login(credentials);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('apaar_token', data.access_token);
    localStorage.setItem('apaar_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('apaar_token');
    localStorage.removeItem('apaar_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        loading,
        setUser
      }}
    >
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
