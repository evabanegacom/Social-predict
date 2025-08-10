import React, { createContext, useState, useEffect, useContext, use } from 'react';
import apiClient from './lib/api';
import type { Category, LeaderboardPeriod } from './lib/types';
import { getMessaging, getToken } from 'firebase/messaging';
import { firebaseApp } from './lib/firebase';
import { useFetchVotes } from './hooks';
import { POINTS_FOR_CORRECT, POINTS_FOR_INCORRECT } from './lib/utils';
import toast from 'react-hot-toast';

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
  pointsHistory?: any[];
  setPointsHistory?: React.Dispatch<React.SetStateAction<any[]>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [totalPoints, setTotalPoints] = useState(0);
  const predictionCategories = ['All', 'Music', 'Politics', 'Sports', 'Other'];
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [ isAuthenticated, setIsAuthenticated ] = useState<boolean>(!!user);
  const [ predictions, setPredictions ] = useState<any[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>("all-time");
  const [leaderboardCategory, setLeaderboardCategory] = useState<Category>("All");
  const { userVotes } = useFetchVotes();
  const [pointsHistory, setPointsHistory] = useState([]);

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
    setPredictions((prev) =>
      prev.map((p) => {
        console.log({p})
        if (p?.status === 'resolved'  && p.result !== null) {
          const result = p?.result

          const userVote = userVotes.find((vote) => vote.prediction_id === p.id);
          console.log({userVote})
          if (userVote) {
            const isCorrect =
              (userVote?.choice === "Yes" && result === "Yes") ||
              (userVote?.choice === "No" && result === "No");

            const points = isCorrect ? POINTS_FOR_CORRECT : POINTS_FOR_INCORRECT;

            // Prevent double-counting the same prediction
            if (!pointsHistory.some((entry) => entry.predictionId === p.id)) {
              setPointsHistory((prev) => {
                if (prev.some((entry) => entry.predictionId === p.id)) {
                  return prev; // Already added, don't add again
                }
                return [
                  ...prev,
                  {
                    predictionId: p.id,
                    text: p.text,
                    vote: userVote?.choice,
                    result,
                    points,
                    category: p.category,
                    resolvedAt: Date.now(),
                  },
                ];
              });
              

              setTotalPoints((prev) => prev + points);

              toast.success(
                `Prediction "${p.text}" resolved: ${result}! You ${
                  isCorrect ? "gained" : "lost"
                } ${Math.abs(points)} points.`,
                {
                  duration: 4000,
                  style: {
                    background: "#1f2937",
                    color: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  },
                }
              );
            }
          }
          return { ...p, result };
        }
        return p;
      })
    );

}, [userVotes]);

  const WAP_ID = 'BI_vmKiuuvVEZ_HUaY-UliZmPfEqnewGY_Ius2n5hVcb7OFwAWcdyiyLxyPLVUd3uHHAhz4K1HLblpgdfIXeFl0'
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
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = async() => {
    try {
      const response = await apiClient.delete('/logout');
      console.log('Logout response:', response.data);
      if( response.data.status === 200) {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        window.location.href = '/'; // Redirect to home page after logout
      }

    }catch(error) {
      console.error('Failed to logout:', error);
    }
    
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
        setUser,
        pointsHistory,
        setPointsHistory
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