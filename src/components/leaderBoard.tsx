import React, { useEffect, useState } from 'react'
import type { Category, LeaderboardPeriod } from '../lib/types';
import apiClient from '../lib/api';
import { useLeaderboard } from '../hooks';
import { useAuth } from '../global-context';

const LeaderBoard = () => {
    const {leaderboardPeriod, setLeaderboardPeriod, leaderboardCategory, setLeaderboardCategory} = useAuth()
    const { leaderboard, currentUser, loading, error, refetch } = useLeaderboard(leaderboardPeriod, leaderboardCategory);

  return (
    <div>
        <div className="mb-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-white mb-4">Leaderboard</h2>
          <div className="flex justify-center gap-3 mb-4 flex-wrap">
            {["weekly", "monthly", "all-time"].map((period) => (
              <button
                key={period}
                onClick={() => setLeaderboardPeriod(period as LeaderboardPeriod)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  leaderboardPeriod === period
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                } transition-all transform hover:scale-105`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
            <select
              value={leaderboardCategory}
              onChange={(e) => setLeaderboardCategory(e.target.value as Category)}
              className="px-4 py-2 rounded-full text-sm bg-gray-800 text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="All">All Categories</option>
              <option value="Music">Music</option>
              <option value="Politics">Politics</option>
              <option value="Sports">Sports</option>
            </select>
          </div>
          <div className="space-y-3">
  {leaderboard.map((entry) => (
    <div
      key={entry.user_id}
      className={`p-4 rounded-lg ${
        currentUser && entry.user_id === currentUser.user_id
          ? "bg-red-900/50"
          : "bg-gray-800/80 backdrop-blur-lg border border-gray-700"
      } transition-all transform hover:scale-105`}
    >
      <p className="text-sm text-white">
        #{entry.rank ?? '-'} {entry.username} - {entry.points} points
      </p>
    </div>
  ))}

  {currentUser && leaderboard.every(e => e.user_id !== currentUser.user_id) && (
    <div className="p-4 rounded-lg bg-red-900/50">
      <p className="text-sm text-white">
        #{currentUser.rank ?? '-'} {currentUser.username} - {currentUser.points} points
      </p>
    </div>
  )}
</div>

        </div>
    </div>
  )
}

export default LeaderBoard