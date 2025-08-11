import React, { useCallback, useMemo, useState } from 'react';
import { Check, X, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../global-context';
import apiClient from '../../lib/api';
import type { Tab, Category } from '../../lib/types';
import { VoteOption } from '../../lib/utils';
import PredictionForm from '../../components/prediction-form';

const ResolvePrediction: React.FC = () => {
  const { predictions, setPredictions, user, isAuthenticated, getUserVote, hasVoted, handleVote, getTimeLeft } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [filter, setFilter] = useState<string>('trending');
  const [categoryFilter, setCategoryFilter] = useState<Category>('All');
  console.log({user})
  const [resolution, setResolution] = useState<{ [key: number]: string }>({});
  console.log({ predictions, activeTab, filter, categoryFilter, resolution });
  const filteredPredictions = useMemo(() => {
    let filtered = predictions;
  
    if (activeTab === 'active') {
      if (user?.admin) {
        // Show everything except maybe deleted
        filtered = predictions.filter((p) => p.status !== 'deleted');
      } else {
        // Only approved & unexpired for normal users
        filtered = predictions.filter(
          (p) => p.status === 'approved' && Date.now() < p.expires_at
        );
      }
    } else {
      // Non-active tab: show resolved ones
      filtered = predictions.filter((p) => p.result !== null);
    }
  
    return filtered
      .filter((p) => categoryFilter === 'All' || p.category === categoryFilter)
      .sort((a, b) => {
        const getPriority = (p: typeof a) => {
          if (p.status === 'pending') return 1;
          if (p.status === 'approved' && p.result === null) return 2;
          if (p.result !== null) return 3;
          if (p.status === 'rejected') return 4;
          return 5;
        };
  
        const priorityDiff = getPriority(a) - getPriority(b);
        if (priorityDiff !== 0) return priorityDiff;
  
        switch (filter) {
          case 'latest':
            return b.createdAt - a.createdAt;
          case 'ending':
            return a.expires_at - b.expires_at;
          case 'trending':
          default:
            return b.upvotes - a.upvotes;
        }
      });
  }, [predictions, categoryFilter, filter, activeTab, user?.admin]);
  
    const handleResolve = useCallback(
    (id: number) => {
      if (!user?.admin) return;
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

  const handleApprove = useCallback(
    (id: number) => {
      if (!user?.admin) return;
      apiClient
        .put(`/predictions/${id}/approve`)
        .then((response) => {
          if (response.data.status === 200) {
            setPredictions((prev) =>
              prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
            );
            toast.success('Prediction approved!', {
              style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
            });
          }
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || 'Failed to approve prediction.', {
            style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
          });
        });
    },
    [user, setPredictions]
  );

  const handleDelete = useCallback(
    (id: number) => {
      if (!user?.admin) return;
      apiClient
        .delete(`/predictions/${id}`)
        .then((response) => {
          if (response.data.status === 200) {
            setPredictions((prev) => prev.filter((p) => p.id !== id));
            toast.success('Prediction deleted!', {
              style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
            });
          }
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || 'Failed to delete prediction.', {
            style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
          });
        });
    },
    [user, setPredictions]
  );

  return (
    <div className='p-4'>
      <PredictionForm />

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
              {pred.category} • {pred.result ? `Resolved: ${pred.result}` : getTimeLeft(pred.expires_at)} • Status: {pred.status}
            </p>
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={() => handleVote(pred.id, VoteOption.Yes)}
                disabled={hasVoted(pred.id) || pred.result !== null || !isAuthenticated || pred.status !== 'approved'}
                className={`flex items-center gap-2 text-sm ${
                  getUserVote(pred.id) == VoteOption.Yes ? 'text-green-400 font-bold' : 'text-green-500'
                } hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Check className="w-5 h-5" /> {pred.upvotes}
              </button>
              <button
                onClick={() => handleVote(pred.id, VoteOption.No)}
                disabled={hasVoted(pred.id) || pred.result !== null || !isAuthenticated || pred.status !== 'approved'}
                className={`flex items-center gap-2 text-sm ${
                  getUserVote(pred.id) == VoteOption.No ? 'text-red-400 font-bold' : 'text-red-500'
                } hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <X className="w-5 h-5" /> {pred.downvotes}
              </button>
              {hasVoted(pred.id) && pred.result === null && (
                <span className="text-xs text-gray-500">Vote locked until expiry</span>
              )}
            </div>
            {/* Admin Actions UI */}
            {user?.admin && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-white">Admin Actions</h4>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {pred.status === 'pending' && (
                    <button
                      onClick={() => handleApprove(pred.id)}
                      className="flex cursor-pointer items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                    >
                      <CheckCircle className="w-5 h-5" /> Approve
                    </button>
                  )}
                  {pred.result === null && (
                    <div className="flex gap-2">
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
                        className="bg-gradient-to-r from-blue-500 cursor-pointer to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-600 transition-all"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(pred.id)}
                    className="flex cursor-pointer items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
                  >
                    <Trash2 className="w-5 h-5" /> Delete
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

