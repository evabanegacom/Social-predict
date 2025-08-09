import { useCallback, useEffect, useState } from "react";
import apiClient from "./lib/api";

export const useFetchVotes = () => {
  const [userVotes, setUserVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/predictions/votes`);
      if (response.status === 200) {
        setUserVotes(response.data.data);
      } else {
        setError(`Failed to fetch votes: ${response.statusText}`);
        console.error(`Failed to fetch votes: ${response.statusText}`);
      }
    } catch (err) {
      setError(err.message || 'Error fetching user votes');
      console.error('Error fetching user votes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, []);

  return { userVotes, loading, error, fetchVotes, setUserVotes };
};


export const useLeaderboard = (leaderboardPeriod, leaderboardCategory) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaderboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/leaderboards", {
        params: {
          period: leaderboardPeriod.replace("-", "_"),
          category: leaderboardCategory === "All" ? null : leaderboardCategory
        }
      });

      if (response.status === 200) {
        const { leaderboard, current_user } = response.data.data;
        setLeaderboard(leaderboard || []);
        setCurrentUser(current_user);
      } else {
        console.error(`Failed to fetch leaderboard data: ${response.statusText}`);
        setError(response.statusText);
      }
    } catch (err) {
      console.error("Error fetching leaderboard data:", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [leaderboardPeriod, leaderboardCategory]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  return {
    leaderboard,
    currentUser,
    loading,
    error,
    refetch: fetchLeaderboardData
  };
};
