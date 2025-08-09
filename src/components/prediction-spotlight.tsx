import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '../lib/api';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import { useAuth } from '../global-context';
import type { Prediction } from '../lib/types';

const PredictionSpotlight: React.FC = () => {
  const { user, predictions, setPredictions } = useAuth();
  const [spotlight, setSpotlight] = useState<Prediction | null>(null);

  const fetchSpotlight = useCallback(async () => {
    try {
      const response = await apiClient.get('/predictions?filter=trending');
      if (response.data.status === 200 && response.data.data.length > 0) {
        setSpotlight(response.data.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch spotlight prediction:', error);
    }
  }, []);

  const handleVote = useCallback(async (id: number, type: 'up' | 'down') => {
    if (!user) {
      toast.error('Please log in to vote.', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
      return;
    }
    try {
      const response = await apiClient.post(`/predictions/${id}/vote`, { choice: type === 'up' ? 'Yes' : 'No' });
      if (response.data.status === 200) {
        setPredictions((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  upvotes: type === 'up' ? p.upvotes + 1 : p.upvotes,
                  downvotes: type === 'down' ? p.downvotes + 1 : p.downvotes,
                }
              : p
          )
        );
        setSpotlight((prev) =>
          prev && prev.id === id
            ? {
                ...prev,
                upvotes: type === 'up' ? prev.upvotes + 1 : prev.upvotes,
                downvotes: type === 'down' ? prev.downvotes + 1 : prev.downvotes,
              }
            : prev
        );
        toast.success(`Voted ${type === 'up' ? 'Yes' : 'No'}!`, {
          style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
        });
      }
    } catch (error) {
      toast.error('Failed to vote. Please try again.', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
    }
  }, [user, setPredictions]);

  useEffect(() => {
    fetchSpotlight();
  }, [fetchSpotlight]);

  if (!spotlight) return <p className="text-gray-400 text-center">No spotlight prediction available.</p>;

  return (
    <div className="p-4 bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-700 animate-slide-in-left">
      <h3 className="text-lg font-bold text-white mb-2">Prediction Spotlight</h3>
      <p className="text-sm text-gray-300">{spotlight.text}</p>
      <p className="text-xs text-gray-400 mt-1">{spotlight.category} • {spotlight.time_left}</p>
      <div className="mt-3 flex gap-4">
        <button
          onClick={() => handleVote(spotlight.id, 'up')}
          className="flex items-center gap-2 text-sm text-green-500 hover:scale-110 transition-all"
        >
          <Check className="w-5 h-5" /> {spotlight.upvotes}
        </button>
        <button
          onClick={() => handleVote(spotlight.id, 'down')}
          className="flex items-center gap-2 text-sm text-red-500 hover:scale-110 transition-all"
        >
          <X className="w-5 h-5" /> {spotlight.downvotes}
        </button>
      </div>
    </div>
  );
};

export default PredictionSpotlight;
