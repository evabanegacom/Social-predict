import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, X, Clock, Calendar, ArrowLeft, Share2 } from 'lucide-react';
import { useAuth } from '../../global-context';
import { VoteOption } from '../../lib/utils';

const categoryEmojis: Record<string, string> = {
  Sports: '⚽',
  Music: '🎵',
  Politics: '🏛️',
  Other: '❓',
  // Add more as needed
};

const PredictionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { predictions, getTimeLeft, hasVoted, getUserVote, handleVote } = useAuth();
  const prediction = predictions.find((pred) => pred.id === parseInt(id || '0'));
  const [timeLeft, setTimeLeft] = useState<string>(prediction ? getTimeLeft(prediction.expires_at) : '');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!prediction || prediction.result) return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = prediction.expires_at;
      const created = prediction.createdAt;
      const totalDuration = expires - created;
      const remaining = expires - now;
      const newProgress = (remaining / totalDuration) * 100;
      setProgress(Math.max(0, Math.min(100, newProgress)));
      setTimeLeft(getTimeLeft(expires));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [prediction, getTimeLeft]);

  if (!prediction) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Prediction Not Found</h1>
        <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Feed
        </Link>
      </div>
    );
  }

  const emoji = categoryEmojis[prediction.category] || '❓';
  const isResolved = prediction.result !== null;
  const progressColor = isResolved
    ? prediction.result === 'Yes'
      ? 'bg-green-600'
      : 'bg-red-600'
    : 'bg-blue-600';

  const handleShare = async () => {
    try {
      await navigator.share({
        title: prediction.text,
        text: `Check out this prediction: ${prediction.text}`,
        url: window.location.href,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Feed
      </Link>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative overflow-hidden">
        {/* Fun background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-500/10 pointer-events-none"></div>
        
        {/* User info with avatar */}
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg mr-3">
            {prediction.user[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-blue-600 dark:text-blue-400">@{prediction.user}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(prediction.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Prediction text with animation */}
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white animate-fade-in">
          {prediction.text}
        </h2>
        
        {/* Category and status badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-sm font-semibold px-3 py-1 rounded flex items-center">
            {emoji} {prediction.category}
          </span>
          <span
            className={`text-sm font-semibold px-3 py-1 rounded ${
              prediction.status === 'resolved'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
            }`}
          >
            {prediction.status.charAt(0).toUpperCase() + prediction.status.slice(1)}
          </span>
          {prediction.result && (
            <span
              className={`flex items-center text-sm font-semibold px-3 py-1 rounded animate-pulse ${
                prediction.result === 'Yes'
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
              }`}
            >
              Result: {prediction.result}
              {prediction.result === 'Yes' ? (
                <Check className="ml-1 h-4 w-4 animate-bounce" />
              ) : (
                <X className="ml-1 h-4 w-4 animate-bounce" />
              )}
            </span>
          )}
          {!prediction.result && prediction.status !== 'resolved' && (
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-sm font-semibold px-3 py-1 rounded flex items-center animate-pulse">
              Pending
            </span>
          )}
        </div>
        
        {/* Time info with progress bar */}
        <div className="text-gray-700 dark:text-gray-300 mb-4">
          <p className="flex items-center mb-2">
            <Clock className="h-5 w-5 mr-2" />
            {timeLeft}
          </p>
          <p className="flex items-center mb-2">
            <Calendar className="h-5 w-5 mr-2" />
            Expires: {new Date(prediction.expires_at).toLocaleDateString()}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
            <div
              className={`${progressColor} h-2.5 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Voting section */}
        <div className="flex items-center space-x-6 text-base mb-4">
          <button
            onClick={() => handleVote(prediction.id, VoteOption.Yes)}
            disabled={hasVoted(prediction.id) || prediction.result !== null}
            className={`flex items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
              getUserVote(prediction.id) === VoteOption.Yes ? 'text-green-400 font-bold' : 'text-green-500'
            }`}
          >
            <Check className="h-5 w-5" />
            {prediction.upvotes}
          </button>
          <button
            onClick={() => handleVote(prediction.id, VoteOption.No)}
            disabled={hasVoted(prediction.id) || prediction.result !== null}
            className={`flex items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
              getUserVote(prediction.id) === VoteOption.No ? 'text-red-400 font-bold' : 'text-red-500'
            }`}
          >
            <X className="h-5 w-5" />
            {prediction.downvotes}
          </button>
          {hasVoted(prediction.id) && prediction.result === null && (
            <span className="text-xs text-gray-500 dark:text-gray-400 animate-fade-in">
              Vote locked until expiry
            </span>
          )}
        </div>
        
        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all transform hover:scale-105"
        >
          <Share2 className="h-4 w-4" />
          Share Prediction
        </button>
      </div>
    </div>
  );
};

export default PredictionDetails;