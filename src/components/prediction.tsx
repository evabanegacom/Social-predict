import React, { useMemo, useState } from 'react';
import type { Category, Filter, Tab } from '../lib/types';
import { useAuth } from '../global-context';
import { VoteOption } from '../lib/utils';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Predictions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [filter, setFilter] = useState<Filter>('trending');
  const [categoryFilter, setCategoryFilter] = useState<Category>('All');
  const { predictions, isAuthenticated, getTimeLeft, hasVoted, getUserVote, userVotes, handleVote } = useAuth();

  const filteredPredictions = useMemo(() => {
    return predictions
      ?.filter((p) => ['approved', 'resolved'].includes(p.status)) // ✅ include approved & resolved
      ?.filter((p) => categoryFilter === 'All' || p.category === categoryFilter)
      ?.sort((a, b) => {
        // First, approved before resolved
        if (a.status === 'approved' && b.status !== 'approved') return -1;
        if (b.status === 'approved' && a.status !== 'approved') return 1;
  
        const hasVotedA = userVotes.some((vote) => vote?.prediction_id === a.id);
        const hasVotedB = userVotes.some((vote) => vote?.prediction_id === b.id);
        const unresolvedA = a.result === null;
        const unresolvedB = b.result === null;
  
        // Priority inside same status
        const getPriority = (hasVoted, unresolved) => {
          if (!hasVoted) return 1; // Highest: unvoted
          if (hasVoted && unresolved) return 2; // Middle: voted + unresolved
          return 3; // Lowest: resolved
        };
  
        const priorityDiff =
          getPriority(hasVotedA, unresolvedA) - getPriority(hasVotedB, unresolvedB);
        if (priorityDiff !== 0) return priorityDiff;
  
        // Tie-breaker based on filter
        switch (filter) {
          case 'trending':
            return (b.upvotes || 0) - (a.upvotes || 0);
          case 'latest':
            return b.createdAt - a.createdAt;
          case 'ending':
            return a.expires_at - b.expires_at;
          default:
            return b.createdAt - a.createdAt;
        }
      });
  }, [predictions, categoryFilter, userVotes, filter]);
  
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const pagedPredictions = filteredPredictions?.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {/* <PredictionForm /> */}

      {/* Prediction Tabs */}
      {pagedPredictions?.length && pagedPredictions?.length > 0 &&
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
      </div>}

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
        {pagedPredictions?.map((pred) => (
          <div
            key={pred.id}
            className="p-6 bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-700 transition-all transform hover:scale-105"
          >
            <p className="text-lg font-medium text-white">{pred.text}</p>
            <p className="text-sm text-gray-400">{pred.user}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
  {pred.category} • {pred.result ? `Resolved: ${pred.result}` : getTimeLeft(pred.expires_at)} •{' '}
  <Link to={`/prediction/${pred.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
    View
  </Link>
</p>
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={() => handleVote(pred.id, VoteOption.Yes)}
                // disabled={hasVoted(pred.id) || pred.result !== null || !isAuthenticated}
                disabled={hasVoted(pred.id) || pred.result !== null}
                className={`flex items-center gap-2 cursor-pointer text-sm ${
                  getUserVote(pred.id) === VoteOption.Yes ? 'text-green-400 font-bold' : 'text-green-500'
                } hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Check className="w-5 h-5" /> {pred?.upvotes}
              </button>
              <button
                onClick={() => handleVote(pred.id, VoteOption.No)}
                // disabled={hasVoted(pred.id) || pred.result !== null || !isAuthenticated}
                disabled={hasVoted(pred.id) || pred.result !== null}
                className={`flex items-center gap-2 text-sm cursor-pointer ${
                  getUserVote(pred.id) === VoteOption.No ? 'text-red-400 font-bold' : 'text-red-500'
                } hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <X className="w-5 h-5" /> {pred.downvotes}
              </button>
              {hasVoted(pred.id) && pred.result === null && (
                <span className="text-xs text-gray-500">Vote locked until expiry</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {pagedPredictions?.length && pagedPredictions?.length > 0 && 
      <div className="flex justify-between mt-4 px-4">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${
            page === 1 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => setPage((p) => (p * pageSize < filteredPredictions?.length ? p + 1 : p))}
          disabled={page * pageSize >= filteredPredictions?.length}
          className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${
            page * pageSize >= filteredPredictions?.length
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          Next
        </button>
      </div>}
    </div>
  );
};

export default Predictions;
