import React, { useEffect } from 'react';
import { useAuth } from '../global-context';
import { useFetchVotes } from '../hooks';
import { POINTS_FOR_CORRECT, POINTS_FOR_INCORRECT, VoteOption } from '../lib/utils';
import toast from 'react-hot-toast';

const PointsHistory = () => {
  const { setPredictions, setTotalPoints, pointsHistory, setPointsHistory } = useAuth();
  const { userVotes } = useFetchVotes();

  console.log({pointsHistory})
  return (
    <div>
      {pointsHistory.length > 0 && (
        <div className="mt-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-white mb-4">Points History</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto overflow-x-hidden"
            style={{ scrollbarWidth: 'thin' }}
          >
            {pointsHistory.map((entry) => (
              <div
                key={entry.prediction_id}
                className="p-4 bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-700 transition-all transform hover:scale-105"
              >
                <p className="text-sm text-white">{entry.text}</p>
                <p className="text-xs text-gray-400">
                  Your vote: {entry?.choice === VoteOption?.Yes ? "Yes" : "No"} • Result: {entry.result} • Points:{" "}
                  <span
                    className={
                      entry.points >= 0 ? "text-green-400" : "text-red-400"
                    }
                  >
                    {entry.points > 0 ? `+${entry.points}` : entry.points}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsHistory;
