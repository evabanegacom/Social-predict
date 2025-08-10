import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { useAuth } from '../global-context';

interface Reward {
  id: number;
  name: string;
  description: string;
  points_cost: number;
  reward_type: 'airtime' | 'data' | 'badge';
  stock: number;
}

const Rewards: React.FC = () => {
  const { user, setUser, pointsHistory } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);

  const fetchRewards = useCallback(async () => {
    try {
      const response = await apiClient.get('/rewards');
      console.log('Rewards fetched:', response);
      if (response.data.status === 200) {
        setRewards(response.data.data);
      } else {
        toast.error('Failed to fetch rewards.', {
          style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
        });
      }
    } catch (error) {
    //   toast.error('Error fetching rewards. Please try again.', {
    //     style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
    //   });
    console.log('Error fetching rewards:', error);
    }
  }, []);

  const handleRedeem = useCallback(async (rewardId: number, pointsCost: number) => {
    if (!user) {
      toast.error('Please log in to redeem rewards.', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
      return;
    }
    if (user.points < pointsCost) {
      toast.error('Insufficient points to redeem this reward.', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
      return;
    }
    try {
      const response = await apiClient.post(`/rewards/${rewardId}/redeem`);
      if (response.data.status === 200) {
        setUser((prev) => prev ? { ...prev, points: response.data.data.points_remaining } : prev);
        setRewards((prev) =>
          prev.map((r) => (r.id === rewardId ? { ...r, stock: r.stock - 1 } : r))
        );
        toast.success(
          `Reward "${response.data.data.name}" redeemed! ${response.data.data.code ? `Code: ${response.data.data.code}` : ''}`,
          {
            style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
            duration: 5000,
          }
        );
      } else {
        toast.error(response.data.message, {
          style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
        });
      }
    } catch (error) {
      toast.error('Failed to redeem reward. Please try again.', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
    }
  }, [user, setUser]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);
console.log({user})
const totalPoints = pointsHistory.reduce((acc, entry) => acc + entry.points, 0);
  return (
    <div className="mb-8 animate-slide-up">
      <h2 className="text-2xl font-bold text-white mb-4">Rewards Store</h2>
      <p className="text-sm text-gray-400 mb-4">Your Points: {totalPoints ?? 0}</p>
      <div className="space-y-4">
        {rewards.length === 0 ? (
          <p className="text-gray-400">No rewards available at the moment.</p>
        ) : (
          rewards.filter((reward) => (totalPoints ?? 0) >= reward.points_cost).map((reward) => (
            <div
              key={reward.id}
              className="p-6 bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-700 transition-all transform hover:scale-105"
            >
              <h3 className="text-lg font-medium text-white">{reward.name}</h3>
              <p className="text-sm text-gray-400">{reward.description}</p>
              <p className="text-sm text-gray-400">Cost: {reward.points_cost} points</p>
              <p className="text-sm text-gray-400">Stock: {reward.stock}</p>
              <p className="text-sm text-gray-400">Type: {reward.reward_type}</p>
              <button
                onClick={() => handleRedeem(reward.id, reward.points_cost)}
                disabled={reward.stock <= 0 || (totalPoints ?? 0) < reward.points_cost}
                className="mt-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg hover:from-red-600 hover:to-red-700 disabled:bg-gray-600 transition-all transform hover:scale-105"
              >
                Redeem
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Rewards;
