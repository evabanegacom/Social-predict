import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import apiClient from './lib/api';
import type { Category, LeaderboardPeriod } from './lib/types';
import { getMessaging, getToken } from 'firebase/messaging';
import { firebaseApp } from './lib/firebase';
import { useFetchVotes } from './hooks';
import { VoteOption } from './lib/utils';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username?: string;
  phone?: string;
  xp: number;
  token?: string;
  points?: number;
  streak?: number;
  admin?: boolean;
}

interface PointEntry {
  prediction_id: number;
  text: string;
  category: string;
  choice: string;
  result: string;
  points: number;
  awarded_at: number;
  name?: string; // For rewards
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  toggleTheme: () => void;
  theme: 'dark' | 'light';
  isAuthenticated: boolean;
  predictions: any[];
  setPredictions: React.Dispatch<React.SetStateAction<any[]>>;
  getPredictions: () => Promise<any[]>;
  totalPoints: number;
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>;
  leaderboardPeriod: LeaderboardPeriod;
  leaderboardCategory: Category;
  setLeaderboardPeriod: React.Dispatch<React.SetStateAction<LeaderboardPeriod>>;
  setLeaderboardCategory: React.Dispatch<React.SetStateAction<Category>>;
  predictionCategories: string[];
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  pointsHistory: PointEntry[];
  setPointsHistory: React.Dispatch<React.SetStateAction<PointEntry[]>>;
  getTimeLeft: (expires_at: number) => string;
  hasVoted: (predictionId: number) => boolean;
  handleVote: (id: number, type: VoteOption.Yes | VoteOption.No) => Promise<void>;
  getUserVote: (predictionId: number) => VoteOption.Yes | VoteOption.No | undefined;
  userVotes: any[];
  setUserVotes: React.Dispatch<React.SetStateAction<any[]>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [totalPoints, setTotalPoints] = useState(user?.points || 0);
  const predictionCategories = ['All', 'Music', 'Politics', 'Sports', 'Other'];
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [predictions, setPredictions] = useState<any[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('all-time');
  const [leaderboardCategory, setLeaderboardCategory] = useState<Category>('All');
  const { userVotes, setUserVotes } = useFetchVotes();
  const [pointsHistory, setPointsHistory] = useState<PointEntry[]>([]);
  const navigate = useNavigate();

  const getPredictions = async () => {
    try {
      const response = await apiClient.get('/predictions');
      if (response.status === 200) {
        setPredictions(response.data.data);
        return response.data.data;
      } else {
        throw new Error('Failed to fetch predictions');
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      throw error;
    }
  };

  const getPointsHistory = async () => {
    try {
      const response = await apiClient.get('/points_history');
      if (response.data.status === 200) {
        setPointsHistory(response.data.data);
        const total = response.data.data.reduce((sum: number, entry: PointEntry) => sum + entry.points, user?.points || 0);
        setTotalPoints(total);
      }
    } catch (error) {
      // toast.error('Failed to fetch points history.', {
      //   style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      // });
      console.error('Error fetching points history:', error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage?.getItem('token')
        if (token) {
          const response = await apiClient.get('/users/me');
          if (response.data.status === 200) {
            setUser(response.data.data);
            setTotalPoints(response.data.data.points || 0);
            setIsAuthenticated(true);
            await getPointsHistory();
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    };
    fetchUser();
    getPredictions();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getPointsHistory(); // Refresh points history when predictions or votes change
    }
  }, [predictions, userVotes, isAuthenticated]);

  const WAP_ID = import.meta.env.VITE_APP_ID
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          const messaging = getMessaging(firebaseApp);
          getToken(messaging, { vapidKey: WAP_ID })
            .then((token) => {
              if (token) {
                apiClient.post('/users/push_token', { push_token: token });
              }
            })
            .catch((err) => {
              console.error('Error getting FCM token', err);
            });
        }
      });
    }
  }, []);

  useEffect(() => {
    document.body.classList.remove('bg-x-dark', 'bg-x-light', 'text-x-light', 'text-x-dark');
    document.body.classList.add(theme === 'dark' ? 'bg-x-dark' : 'bg-x-light');
    document.body.classList.add(theme === 'dark' ? 'text-x-light' : 'text-x-dark');
  }, [theme]);

  const login = (userData: User, token: string) => {
    const user = { ...userData, token };
    setUser(user);
    setIsAuthenticated(true);
    setTotalPoints(userData.points || 0);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  };

  const logout = async () => {
    try {
      const response = await apiClient.delete('/logout');
      if (response.data.status === 200) {
        setUser(null);
        setIsAuthenticated(false);
        setPredictions([]);
        setPointsHistory([]);
        setTotalPoints(0);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (error) {
      console.error('Failed to logout:', error);
      toast.error('Failed to logout. Please try again.', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
    }
  };

  const getTimeLeft = useCallback((expires_at: number) => {
    const remaining = expires_at - Date.now();
    if (remaining <= 0) return 'Expired';
    const hrs = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remaining % (1000 * 60)) / 1000);
    return `Expires in: ${hrs}h ${mins}m ${secs}s`;
  }, []);

  const hasVoted = useCallback(
    (predictionId: number) => {
      return userVotes.some((vote) => vote?.prediction_id === predictionId);
    },
    [userVotes]
  );

  const handleVote = useCallback(
    async (id: number, type: VoteOption.Yes | VoteOption.No) => {
      if (!isAuthenticated) {
        toast.error('Please sign in to vote!', {
          style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
        });
        navigate(`/login?returnTo=/predictions/${id}`);
        return;
      }
      if (hasVoted(id) || Date.now() >= predictions?.find((p) => p?.id === id)!?.expires_at) {
        toast.error('You already voted or this prediction has expired!', {
          style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
        });
        return;
      }
      try {
        const response = await apiClient.post(`/predictions/${id}/vote`, { choice: type === VoteOption.Yes ? 'Yes' : 'No' });
        if (response.data.status === 200) {
          setPredictions((prev) =>
            prev.map((p) =>
              p.id === id
                ? { ...p, upvotes: response?.data?.data?.vote_options?.yes, downvotes: response?.data?.data?.vote_options?.no }
                : p
            )
          );
          setUserVotes((prev) => [...prev, { predictionId: id, voteType: type, prediction_id: id, choice: type }]);
          toast.success(`Voted ${type === VoteOption.Yes ? 'Yes' : 'No'} on "${predictions.find((p) => p.id === id)!.text}"!`, {
            style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
          });
          await getPointsHistory(); // Refresh points history after voting
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to submit vote. Please try again.', {
          style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
        });
      }
    },
    [predictions, userVotes, hasVoted, isAuthenticated, navigate]
  );

  const getUserVote = useCallback(
    (predictionId: number) => {
      return userVotes.find((vote) => vote?.prediction_id === predictionId)?.voteType;
    },
    [userVotes]
  );

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AuthContext.Provider
      value={{
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
        setUser,
        pointsHistory,
        setPointsHistory,
        getTimeLeft,
        hasVoted,
        handleVote,
        getUserVote,
        userVotes,
        setUserVotes,
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
