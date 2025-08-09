import React, { createContext, useState, useEffect, useContext, use } from 'react';
import apiClient from './lib/api';

interface User {
  id: number;
  username?: string;
  phone?: string;
  xp: number;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  toggleTheme: () => void;
  theme: 'dark' | 'light';
  isAuthenticated?: boolean;
  predictions: any[];
  setPredictions: React.Dispatch<React.SetStateAction<any[]>>;
  getPredictions: () => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [ isAuthenticated, setIsAuthenticated ] = useState<boolean>(!!user);
  const [ predictions, setPredictions ] = useState<any[]>([]);
  const getPredictions = async () => {
    try {
      const response = await apiClient.get('/predictions');
      console.log('Predictions fetched:', response.data.data);
      if (response.status === 200) {
        setPredictions(response.data.data);
        return response.data.data;
      }else {
        throw new Error('Failed to fetch predictions');
      }
    } catch (error) {
        console.error('Error fetching predictions:', error);
        throw error;
        }

  }

  useEffect(() => {
    getPredictions()
  }, []);

  useEffect(() => {
    document.body.classList.remove('bg-x-dark', 'bg-x-light', 'text-x-light', 'text-x-dark');
    document.body.classList.add(theme === 'dark' ? 'bg-x-dark' : 'bg-x-light');
    document.body.classList.add(theme === 'dark' ? 'text-x-light' : 'text-x-dark');
  }, [theme]);

  const login = (userData: User, token: string) => {
    const user = { ...userData, token };
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        login, 
        logout, 
        toggleTheme, 
        theme, 
        isAuthenticated,
        predictions, 
        setPredictions,
        getPredictions
        }}>
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