import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '../lib/api';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import { useAuth } from '../global-context';
import type { Prediction } from '../lib/types';
import { VoteOption } from '../lib/utils';

const PredictionSpotlight: React.FC = () => {
  const { handleVote } = useAuth();
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
          onClick={() => handleVote(spotlight.id, VoteOption.Yes)}
          className="flex cursor-pointer items-center gap-2 text-sm text-green-500 hover:scale-110 transition-all"
        >
          <Check className="w-5 h-5" /> {spotlight.upvotes}
        </button>
        <button
          onClick={() => handleVote(spotlight.id, VoteOption.No)}
          className="flex items-center gap-2 cursor-pointer text-sm text-red-500 hover:scale-110 transition-all"
        >
          <X className="w-5 h-5" /> {spotlight.downvotes}
        </button>
      </div>
    </div>
  );
};

export default PredictionSpotlight;
