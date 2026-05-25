import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../lib/apiService';
import type { User } from '../types/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const profile = await authAPI.getMe();
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } catch (error) {
          // Token expired or invalid
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    
    // Fetch real profile
    const profile = await authAPI.getMe();
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
  };

  const register = async (email: string, username: string, password: string) => {
    const userData = await authAPI.register({ email, username, password });
    // Immediately log in with the new credentials to fetch a real JWT access token
    const loginData = await authAPI.login({ email, password });
    localStorage.setItem('token', loginData.access_token);
    
    // Fetch real profile
    setToken(loginData.access_token);
    const profile = await authAPI.getMe();
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}