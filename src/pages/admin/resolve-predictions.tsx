
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../global-context';
import apiClient from '../../lib/api';
import type { Tab, Category, UserVote } from '../../lib/types';
import { EXPIRY_TIME } from '../../lib/utils';

const ResolvePrediction: React.FC = () => {
  const { predictions, setPredictions, getPredictions, user, isAuthenticated } = useAuth();
  const [newPrediction, setNewPrediction] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [filter, setFilter] = useState<string>('trending');
  const [categoryFilter, setCategoryFilter] = useState<Category>('All');
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [votingHistory, setVotingHistory] = useState<number[]>([]);
  const [resolution, setResolution] = useState<{ [key: number]: string }>({}); // Track resolution input
  const navigate = useNavigate();

  const filteredPredictions = useMemo(() => {
    return predictions
      .filter((p) => (activeTab === 'active' ? Date.now() < p?.expires_at : p.result !== null))
      .filter((p) => categoryFilter === 'All' || p.category === categoryFilter)
      .sort((a, b) => {
        switch (filter) {
          case 'latest':
            return b.createdAt - a.createdAt;
          case 'ending':
            return a.createdAt + EXPIRY_TIME - (b?.createdAt + EXPIRY_TIME);
          case 'trending':
          default:
            return b.upvotes - a.upvotes;
        }
      });
  }, [predictions, categoryFilter, filter, activeTab]);

  const getTimeLeft = useCallback((createdAt: number) => {
    const remaining = EXPIRY_TIME - (Date.now() - createdAt);
    if (remaining <= 0) return 'Expired';
    const hrs = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remaining % (1000 * 60)) / 1000);
    return `Expires in: ${hrs}h ${mins}m ${secs}s`;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create a prediction!', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
      navigate('/login');
      return;
    }
    if (!newPrediction.trim() || !selectedCategory) {
      toast.error('Please enter a prediction and select a category!', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
      return;
    }
    const newItem = {
      prediction: {
        topic: newPrediction,
        category: selectedCategory,
        expires_at: new Date(Date.now() + EXPIRY_TIME).toISOString(),
      },
    };
    try {
      const response = await apiClient.post('/predictions', newItem);
      if (response.data.status === 201) {
        await getPredictions();
        setNewPrediction('');
        setSelectedCategory('');
        toast.success('Prediction submitted!', {
          style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
        });
      } else {
        throw new Error('Failed to create prediction');
      }
    } catch {
      toast.error('Failed to submit prediction. Please try again.', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
    }
  }, [newPrediction, selectedCategory, getPredictions, isAuthenticated, navigate]);

  const hasVoted = useCallback(
    (predictionId: number) => {
      return userVotes.some((vote) => vote.predictionId === predictionId);
    },
    [userVotes]
  );

  const handleVote = useCallback(
    (id: number, type: 'up' | 'down') => {
      if (!isAuthenticated) {
        toast.error('Please sign in to vote!', {
          style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
        });
        navigate(`/login?returnTo=/predictions/${id}`);
        return;
      }
      if (hasVoted(id) || Date.now() - predictions.find((p) => p.id === id)!.createdAt >= EXPIRY_TIME) {
        toast.error('You already voted or this prediction has expired!', {
          style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
        });
        return;
      }
      apiClient
        .post(`/predictions/${id}/vote`, { choice: type === 'up' ? 'Yes' : 'No' })
        .then((response) => {
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
            setUserVotes((prev) => [...prev, { predictionId: id, voteType: type }]);
            const now = new Date('2025-08-10T08:08:00+01:00');
            const dayStart = new Date(now.setHours(0, 0, 0, 0)).getTime();
            if (!votingHistory.includes(dayStart)) {
              setVotingHistory((prev) => [...prev, dayStart].sort((a, b) => b - a));
            }
            toast.success(`Voted ${type === 'up' ? 'Yes' : 'No'} on "${predictions.find((p) => p.id === id)!.text}"!`, {
              style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
            });
          }
        })
        .catch(() => {
          toast.error('Failed to vote. Please try again.', {
            style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
          });
        });
    },
    [predictions, userVotes, votingHistory, isAuthenticated, navigate]
  );

  const getUserVote = useCallback(
    (predictionId: number) => {
      return userVotes.find((vote) => vote.predictionId === predictionId)?.voteType;
    },
    [userVotes]
  );

  const handleResolve = useCallback(
    (id: number) => {
      if (!user?.admin) return; // Safety check
      const result = resolution[id];
      if (!result) {
        toast.error('Please select a resolution result!', {
          style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
        });
        return;
      }
      apiClient
        .put(`/predictions/${id}/status`, { status: 'resolved', result })
        .then((response) => {
          if (response.data.status === 200) {
            setPredictions((prev) =>
              prev.map((p) => (p.id === id ? { ...p, status: 'resolved', result } : p))
            );
            setResolution((prev) => {
              const newRes = { ...prev };
              delete newRes[id];
              return newRes;
            });
            toast.success(`Prediction resolved as "${result}"!`, {
              style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
            });
          }
        })
        .catch(() => {
          toast.error('Failed to resolve prediction. Please try again.', {
            style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
          });
        });
    },
    [resolution, user, setPredictions]
  );

  return (
    <div>
      <div className="mb-8 animate-slide-up">
        <textarea
          value={newPrediction}
          onChange={(e) => setNewPrediction(e.target.value)}
          placeholder="Make a bold prediction..."
          className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          rows={4}
        ></textarea>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-3 mt-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="" disabled>
            Select a category
          </option>
          <option value="Music">Music</option>
          <option value="Politics">Politics</option>
          <option value="Sports">Sports</option>
        </select>
        <button
          onClick={handleSubmit}
          disabled={!newPrediction.trim() || !selectedCategory}
          className="mt-3 w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-red-700 disabled:bg-gray-600 transition-all transform hover:scale-105"
        >
          Predict
        </button>
      </div>

      {/* Prediction Tabs */}
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            activeTab === 'active'
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          } transition-all transform hover:scale-105`}
        >
          Active Predictions
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            activeTab === 'resolved'
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          } transition-all transform hover:scale-105`}
        >
          Resolved Predictions
        </button>
      </div>

      {/* Filters */}
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('trending')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === 'trending'
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          } transition-all transform hover:scale-105`}
        >
          🔥 Trending
        </button>
        <button
          onClick={() => setFilter('latest')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === 'latest'
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          } transition-all transform hover:scale-105`}
        >
          🕒 Latest
        </button>
        <button
          onClick={() => setFilter('ending')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            filter === 'ending'
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          } transition-all transform hover:scale-105`}
        >
          ⌛ Ending Soon
        </button>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as Category)}
          className="px-4 py-2 rounded-full text-sm bg-gray-800 text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="All">All Categories</option>
          <option value="Music">Music</option>
          <option value="Politics">Politics</option>
          <option value="Sports">Sports</option>
        </select>
      </div>

      {/* Predictions List */}
      <div className="space-y-4">
        {filteredPredictions.map((pred) => (
          <div
            key={pred.id}
            className="p-6 bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-700 transition-all transform hover:scale-105"
          >
            <p className="text-lg font-medium text-white">{pred.text}</p>
            <p className="text-sm text-gray-400">{pred.user}</p>
            <p className="text-xs text-gray-500 mt-1">
              {pred.category} • {pred.result ? `Resolved: ${pred.result}` : getTimeLeft(pred.createdAt)}
            </p>
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={() => handleVote(pred.id, 'up')}
                disabled={hasVoted(pred.id) || pred.result !== null || !isAuthenticated}
                className={`flex items-center gap-2 text-sm ${
                  getUserVote(pred.id) === 'up' ? 'text-green-400 font-bold' : 'text-green-500'
                } hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Check className="w-5 h-5" /> {pred.upvotes}
              </button>
              <button
                onClick={() => handleVote(pred.id, 'down')}
                disabled={hasVoted(pred.id) || pred.result !== null || !isAuthenticated}
                className={`flex items-center gap-2 text-sm ${
                  getUserVote(pred.id) === 'down' ? 'text-red-400 font-bold' : 'text-red-500'
                } hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <X className="w-5 h-5" /> {pred.downvotes}
              </button>
              {hasVoted(pred.id) && pred.result === null && (
                <span className="text-xs text-gray-500">Vote locked until expiry</span>
              )}
            </div>
            {/* Admin Resolution UI */}
            {user?.admin && pred.result === null && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-white">Resolve Prediction</h4>
                <div className="flex gap-2 mt-2">
                  <select
                    value={resolution[pred.id] || ''}
                    onChange={(e) => setResolution({ ...resolution, [pred.id]: e.target.value })}
                    className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select Result</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Maybe">Maybe</option>
                  </select>
                  <button
                    onClick={() => handleResolve(pred.id)}
                    disabled={!resolution[pred.id]}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-600 transition-all"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResolvePrediction;
