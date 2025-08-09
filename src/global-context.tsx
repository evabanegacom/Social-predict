import React, { createContext, useState, useEffect, useContext, use } from 'react';
import apiClient from './lib/api';
import type { Category, LeaderboardPeriod } from './lib/types';

interface User {
  id: number;
  username?: string;
  phone?: string;
  xp: number;
  token?: string;
  points?: number;
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
  totalPoints: number;
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>;
  leaderboardPeriod?: LeaderboardPeriod;
  leaderboardCategory?: Category;
  setLeaderboardPeriod?: React.Dispatch<React.SetStateAction<LeaderboardPeriod>>;
  setLeaderboardCategory?: React.Dispatch<React.SetStateAction<Category>>;
  predictionCategories?: string[];
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [totalPoints, setTotalPoints] = useState(0);
  const predictionCategories = ['All', 'Music', 'Politics', 'Sports'];
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [ isAuthenticated, setIsAuthenticated ] = useState<boolean>(!!user);
  const [ predictions, setPredictions ] = useState<any[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>("all-time");
  const [leaderboardCategory, setLeaderboardCategory] = useState<Category>("All");
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
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await apiClient.get('/users/me'); // Assume endpoint to fetch user data
          if (response.data.status === 200) {
            setUser(response.data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
    getPredictions();
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
        getPredictions,
        totalPoints,
        setTotalPoints,
        leaderboardPeriod,
        leaderboardCategory,
        setLeaderboardPeriod,
        setLeaderboardCategory,
        predictionCategories,
        setUser
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