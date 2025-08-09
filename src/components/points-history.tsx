import React, { useEffect, useState } from 'react';
import { useAuth } from '../global-context';
import { useFetchVotes } from '../hooks';
import { EXPIRY_TIME, POINTS_FOR_CORRECT, POINTS_FOR_INCORRECT } from '../lib/utils';
import toast from 'react-hot-toast';

const PointsHistory = () => {
  const { setPredictions, totalPoints, setTotalPoints } = useAuth();
  const { userVotes } = useFetchVotes();

  // Local state to store resolved prediction history
  const [pointsHistory, setPointsHistory] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPredictions((prev) =>
        prev.map((p) => {
          const expired = Date.now() - p.createdAt >= EXPIRY_TIME;
          if (expired && p.result === null) {
            const result = Math.random() > 0.5 ? "Yes" : "No";

            const userVote = userVotes.find((vote) => vote.prediction_id === p.id);
            if (userVote) {
              const isCorrect =
                (userVote.voteType === "up" && result === "Yes") ||
                (userVote.voteType === "down" && result === "No");

              const points = isCorrect ? POINTS_FOR_CORRECT : POINTS_FOR_INCORRECT;

              // Prevent double-counting the same prediction
              if (!pointsHistory.some((entry) => entry.predictionId === p.id)) {
                setPointsHistory((prev) => [
                  ...prev,
                  {
                    predictionId: p.id,
                    text: p.text,
                    vote: userVote.voteType,
                    result,
                    points,
                    category: p.category,
                    resolvedAt: Date.now(),
                  },
                ]);

                setTotalPoints((prev) => prev + points);

                toast.success(
                  `Prediction "${p.text}" resolved: ${result}! You ${
                    isCorrect ? "gained" : "lost"
                  } ${Math.abs(points)} points.`,
                  {
                    duration: 4000,
                    style: {
                      background: "#1f2937",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    },
                  }
                );
              }
            }
            return { ...p, result };
          }
          return p;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [userVotes, pointsHistory, setPredictions, setTotalPoints]);

  return (
    <div>
      {pointsHistory.length > 0 && (
        <div className="mt-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-white mb-4">Points History</h2>
          <div className="space-y-3">
            {pointsHistory.map((entry) => (
              <div
                key={entry.predictionId}
                className="p-4 bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-700 transition-all transform hover:scale-105"
              >
                <p className="text-sm text-white">{entry.text}</p>
                <p className="text-xs text-gray-400">
                  Your vote: {entry.vote === "up" ? "Yes" : "No"} • Result: {entry.result} • Points:{" "}
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
