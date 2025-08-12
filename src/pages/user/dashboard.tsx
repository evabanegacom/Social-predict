import React, { useCallback } from 'react';
import { Share2, Trophy, Flame, BarChart, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../global-context';
import { useFetchVotes, useLeaderboard } from '../../hooks';
import type { Badge } from '../../lib/types';

const Dashboard = () => {
  const { leaderboardPeriod, leaderboardCategory, predictionCategories, user, pointsHistory } = useAuth();
  const { userVotes } = useFetchVotes();
  const { leaderboard, currentUser } = useLeaderboard(leaderboardPeriod, leaderboardCategory);
  const totalPointHistory = pointsHistory?.reduce((total, entry) => total + (entry?.points || 0), 0) || 0;

  const categoryStats = predictionCategories?.reduce((acc, category) => {
    acc[category] = {
      total: userVotes?.filter(vote => vote?.category === category)?.length || 0,
      correct: userVotes?.filter(vote => vote?.category === category && vote?.correct)?.length || 0,
    };
    return acc;
  }, {} as Record<string, { total: number; correct: number }>);

  const totalPredictions = userVotes?.length || 0;
  const correctVotes = userVotes?.filter(vote => vote?.correct)?.length || 0;
  const correctPercentage = totalPredictions > 0 ? ((correctVotes / totalPredictions) * 100).toFixed(1) : '0.0';
  const totalPoints = userVotes?.reduce((total, vote) => total + (vote.points || 0), 0) || 0;

  const getStreak = useCallback(() => {
    if (userVotes?.length === 0) return 0;
    const sortedVotes = [...(userVotes || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let streak = 1;
    for (let i = 1; i < sortedVotes.length; i++) {
      const prevVote = sortedVotes[i - 1];
      const currVote = sortedVotes[i];
      const prevDay = new Date(prevVote.date).setHours(0, 0, 0, 0);
      const currDay = new Date(currVote.date).setHours(0, 0, 0, 0);
      if (
        prevVote.isCorrect === currVote.isCorrect &&
        prevDay - currDay === 24 * 60 * 60 * 1000
      ) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [userVotes]);

  const streak = getStreak();

  const myRank = (currentUser?.rank ?? (leaderboard.findIndex(u => u.id === currentUser?.id) + 1)) || null;

  const getBadges = useCallback(() => {
    const badges: Badge[] = [];
    if (totalPoints >= 100) badges.push({ name: 'Rookie', description: 'Earned 100 points', icon: '🏆' });
    if (totalPoints >= 500) badges.push({ name: 'Pro', description: 'Earned 500 points', icon: '🌟' });
    if (streak >= 7) badges.push({ name: 'Streaker', description: '7-day streak', icon: '🔥' });
    if (myRank && myRank <= 3) badges.push({ name: 'Legend', description: 'Top 3 on leaderboard', icon: '👑' });
    return badges;
  }, [totalPoints, streak, myRank]);

  const badges = getBadges();

  const handleShareProfile = () => {
    const profileUrl = `https://whoknows.netlify.app/u/${user?.username?.replace('@', '') || 'anonymous'}`;
    const shareText = `${user?.avatar || '😎'} ${user?.username || 'Anonymous'} on WhoKnows! Rank: #${myRank || 'N/A'}, Points: ${totalPoints}, Correct: ${correctPercentage}%, Streak: ${streak} days, Badges: ${badges.map((b) => b.icon).join('')} 🔥 Join me at ${profileUrl}`;
    navigator.clipboard.writeText(shareText).then(() => {
      toast.success('Profile details copied to clipboard!', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid #4b5563' },
      });
    }).catch((err) => {
      console.error('Clipboard copy failed:', err);
      toast.error('Failed to copy profile details!', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid #4b5563' },
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700 relative overflow-hidden">
      {/* Decorative floating shapes */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-purple-700 rounded-full opacity-20 blur-3xl animate-blob"></div>
      <div className="absolute top-32 right-20 w-48 h-48 bg-pink-600 rounded-full opacity-15 blur-2xl animate-blob animation-delay-2000"></div>

      {/* Dashboard content container */}
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl relative z-10">
        <h1 className="text-3xl font-bold text-white mb-6">Welcome, {user?.username || 'Anonymous'}!</h1>

        {/* Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-[#1f2937] rounded-xl border border-[#4b5563] shadow-md">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#fef08a]" />
              <h2 className="text-lg font-semibold text-white">Points</h2>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{totalPoints}</p>
            <p className="text-sm text-[#9ca3af]">
              Total after redemptions: {totalPointHistory}
            </p>
          </div>
          <div className="p-4 bg-[#1f2937] rounded-xl border border-[#4b5563] shadow-md">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-[#ef4444]" />
              <h2 className="text-lg font-semibold text-white">Streak</h2>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{streak} days</p>
            <p className="text-sm text-[#9ca3af]">Keep it going!</p>
          </div>
          <div className="p-4 bg-[#1f2937] rounded-xl border border-[#4b5563] shadow-md">
            <div className="flex items-center gap-2">
              <BarChart className="w-6 h-6 text-[#60a5fa]" />
              <h2 className="text-lg font-semibold text-white">Rank</h2>
            </div>
            <p className="text-2xl font-bold text-white mt-2">#{myRank || 'N/A'}</p>
            <p className="text-sm text-[#9ca3af]">Leaderboard Position</p>
          </div>
        </div>

        {/* Stats and Badges Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="p-6 bg-[#1f2937] rounded-xl border border-[#4b5563] shadow-md">
            <h2 className="text-xl font-semibold text-white mb-4">Prediction Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-[#9ca3af]">
                <span>Total Predictions:</span>
                <span className="font-bold text-white">{totalPredictions}</span>
              </div>
              <div className="flex justify-between text-[#9ca3af]">
                <span>Correct Predictions:</span>
                <span className="font-bold text-white">{correctPercentage}%</span>
              </div>
              {predictionCategories?.filter(cat => cat !== 'All')?.map((cat) => (
                <div key={cat} className="flex justify-between text-[#9ca3af]">
                  <span>{cat}:</span>
                  <span className="font-bold text-white">
                    {categoryStats[cat]?.total} votes,{' '}
                    {categoryStats[cat]?.total > 0
                      ? ((categoryStats[cat]?.correct / categoryStats[cat]?.total) * 100).toFixed(1)
                      : '0.0'}% correct
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 bg-[#1f2937] rounded-xl border border-[#4b5563] shadow-md">
            <h2 className="text-xl font-semibold text-white mb-4">Badges</h2>
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <div
                    key={badge.name}
                    className="flex items-center gap-1 bg-[#78350f] text-[#fef08a] px-3 py-1 rounded-full text-sm"
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#9ca3af] text-sm">No badges yet. Keep predicting to earn some!</p>
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="p-6 bg-[#1f2937] rounded-xl border border-[#4b5563] shadow-md">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          {userVotes?.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {userVotes.slice(0, 5).map((vote, index) => (
                <div key={index} className="flex items-center gap-3 text-[#9ca3af]">
                  <CheckCircle className={`w-5 h-5 ${vote.correct ? 'text-[#22c55e]' : 'text-[#ef4444]'}`} />
                  <div>
                    <p className="text-sm text-white">
                      {vote.category} Prediction - {vote.correct ? 'Correct' : 'Incorrect'}
                    </p>
                    <p className="text-xs text-[#9ca3af]">
                      {new Date(vote.date).toLocaleDateString()} | {vote.points || 0} points
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#9ca3af] text-sm">No recent activity. Make some predictions to get started!</p>
          )}
        </div>

        {/* Share Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleShareProfile}
            className="flex items-center gap-2 bg-[#2563eb] text-white px-6 py-3 rounded-lg hover:bg-[#1d4ed8] transition-all transform hover:scale-105"
          >
            <Share2 className="w-5 h-5" /> Share Your Progress
          </button>
        </div>
      </div>

      {/* Add CSS animations inline */}
    </div>
  );
};

export default Dashboard;
