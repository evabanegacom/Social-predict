import { useEffect, useState } from "react";
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
