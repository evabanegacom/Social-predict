import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Flame, Check, X, Share2, Award } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import html2canvas from "html2canvas";

interface Prediction {
  id: number;
  text: string;
  user: string;
  upvotes: number;
  downvotes: number;
  createdAt: number;
  category: string;
  result: "Yes" | "No" | null;
}

interface UserVote {
  predictionId: number;
  voteType: "up" | "down";
}

interface PointsHistory {
  predictionId: number;
  text: string;
  vote: "up" | "down";
  result: "Yes" | "No";
  points: number;
  category: string;
  resolvedAt: number;
}

interface User {
  username: string;
  totalPoints: number;
}

interface Badge {
  name: string;
  description: string;
  icon: string;
}

const EXPIRY_TIME = 24 * 60 * 60 * 1000;
const POINTS_FOR_CORRECT = 10;
const POINTS_FOR_INCORRECT = -2;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const initialPredictions: Prediction[] = [
  {
    id: 1,
    text: "Nigeria will win the next AFCON",
    user: "@seunpredicts",
    upvotes: 122,
    downvotes: 35,
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    category: "Sports",
    result: null,
  },
  {
    id: 2,
    text: "Davido and Wizkid will drop a joint album",
    user: "@musicoracle",
    upvotes: 90,
    downvotes: 20,
    createdAt: Date.now() - 1 * 60 * 60 * 1000,
    category: "Music",
    result: null,
  },
];

const initialUsers: User[] = [
  { username: "@you", totalPoints: 50 },
  { username: "@seunpredicts", totalPoints: 100 },
  { username: "@musicoracle", totalPoints: 80 },
  { username: "@politicsguru", totalPoints: 120 },
];

type Filter = "trending" | "latest" | "ending";
type Category = "All" | "Music" | "Politics" | "Sports";
type LeaderboardPeriod = "weekly" | "monthly" | "all-time";
type Tab = "active" | "resolved";

export default function App() {
  const [predictions, setPredictions] = useState<Prediction[]>(initialPredictions);
  const [newPrediction, setNewPrediction] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filter, setFilter] = useState<Filter>("trending");
  const [categoryFilter, setCategoryFilter] = useState<Category>("All");
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [totalPoints, setTotalPoints] = useState(50);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [users] = useState<User[]>(initialUsers);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>("all-time");
  const [leaderboardCategory, setLeaderboardCategory] = useState<Category>("All");
  const [username, setUsername] = useState("@you");
  const [avatar, setAvatar] = useState("😎");
  const [isEditing, setIsEditing] = useState(false);
  const [votingHistory, setVotingHistory] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const badgeRef = useRef<HTMLDivElement>(null);

  // Simulate prediction resolution
  useEffect(() => {
    const interval = setInterval(() => {
      setPredictions((prev) =>
        prev.map((p) => {
          if (Date.now() - p.createdAt >= EXPIRY_TIME && p.result === null) {
            const result = Math.random() > 0.5 ? "Yes" : "No";
            if (userVotes.some((vote) => vote.predictionId === p.id)) {
              const userVote = userVotes.find((vote) => vote.predictionId === p.id)!;
              const isCorrect = (userVote.voteType === "up" && result === "Yes") || 
                              (userVote.voteType === "down" && result === "No");
              const points = isCorrect ? POINTS_FOR_CORRECT : POINTS_FOR_INCORRECT;
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
                toast.success(`Prediction "${p.text}" resolved: ${result}! You ${isCorrect ? "gained" : "lost"} ${Math.abs(points)} points.`, {
                  duration: 4000,
                  style: { background: "#1a202c", color: "#fff" },
                });
              }
            }
            return { ...p, result };
          }
          return p;
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [userVotes, pointsHistory]);

  // Notify on streak milestones
  useEffect(() => {
    const streak = getStreak();
    if (streak === 3 || streak === 7 || streak === 14) {
      toast.success(`🔥 ${streak}-day streak achieved! Keep it up!`, {
        duration: 4000,
        style: { background: "#1a202c", color: "#fff" },
      });
    }
  }, [votingHistory]);

  const hasVoted = useCallback((predictionId: number) => {
    return userVotes.some((vote) => vote.predictionId === predictionId);
  }, [userVotes]);

  const getUserVote = useCallback((predictionId: number) => {
    return userVotes.find((vote) => vote.predictionId === predictionId)?.voteType;
  }, [userVotes]);

  const handleVote = useCallback((id: number, type: "up" | "down") => {
    if (hasVoted(id) || Date.now() - predictions.find((p) => p.id === id)!.createdAt >= EXPIRY_TIME) {
      toast.error("You already voted or this prediction has expired!", {
        style: { background: "#1a202c", color: "#fff" },
      });
      return;
    }

    setPredictions((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              upvotes: type === "up" ? p.upvotes + 1 : p.upvotes,
              downvotes: type === "down" ? p.downvotes + 1 : p.downvotes,
            }
          : p
      )
    );

    setUserVotes((prev) => [...prev, { predictionId: id, voteType: type }]);

    const now = new Date("2025-08-07T22:56:00+01:00");
    const dayStart = new Date(now.setHours(0, 0, 0, 0)).getTime();
    if (!votingHistory.includes(dayStart)) {
      setVotingHistory((prev) => [...prev, dayStart].sort((a, b) => b - a));
    }

    toast.success(`Voted ${type === "up" ? "Yes" : "No"} on "${predictions.find((p) => p.id === id)!.text}"!`, {
      style: { background: "#1a202c", color: "#fff" },
    });
  }, [predictions, userVotes, votingHistory]);

  const handleSubmit = useCallback(() => {
    if (!newPrediction.trim() || !selectedCategory) {
      toast.error("Please enter a prediction and select a category!", {
        style: { background: "#1a202c", color: "#fff" },
      });
      return;
    }
    const newItem: Prediction = {
      id: Date.now(),
      text: newPrediction,
      user: username,
      upvotes: 0,
      downvotes: 0,
      createdAt: Date.now(),
      category: selectedCategory,
      result: null,
    };
    setPredictions((prev) => [newItem, ...prev]);
    setNewPrediction("");
    setSelectedCategory("");
    toast.success("Prediction submitted!", {
      style: { background: "#1a202c", color: "#fff" },
    });
  }, [newPrediction, selectedCategory, username]);

  const getTimeLeft = useCallback((createdAt: number) => {
    const remaining = EXPIRY_TIME - (Date.now() - createdAt);
    if (remaining <= 0) return "Expired";
    const hrs = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remaining % (1000 * 60)) / 1000);
    return `Expires in: ${hrs}h ${mins}m ${secs}s`;
  }, []);

  const getStreak = useCallback(() => {
    if (votingHistory.length === 0) return 0;
    let streak = 1;
    const today = new Date("2025-08-07T22:56:00+01:00");
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).getTime();
    if (!votingHistory.includes(todayStart)) {
      const yesterday = todayStart - DAY_MS;
      for (let i = 0; i < votingHistory.length; i++) {
        const voteDay = votingHistory[i];
        if (voteDay === yesterday) {
          streak = 1;
          let prevDay = yesterday - DAY_MS;
          for (let j = i + 1; j < votingHistory.length; j++) {
            if (votingHistory[j] === prevDay) {
              streak++;
              prevDay -= DAY_MS;
            } else {
              break;
            }
          }
          break;
        }
      }
    } else {
      let prevDay = todayStart - DAY_MS;
      for (let i = 1; i < votingHistory.length; i++) {
        if (votingHistory[i] === prevDay) {
          streak++;
          prevDay -= DAY_MS;
        } else {
          break;
        }
      }
    }
    return streak;
  }, [votingHistory]);

  const getLeaderboard = useCallback(() => {
    const now = Date.now();
    return users
      .map((user) => {
        let points = 0;
        if (user.username === "@you") {
          points = pointsHistory
            .filter((entry) => {
              if (leaderboardCategory !== "All" && entry.category !== leaderboardCategory) return false;
              if (leaderboardPeriod === "weekly") return now - entry.resolvedAt <= WEEK_MS;
              if (leaderboardPeriod === "monthly") return now - entry.resolvedAt <= MONTH_MS;
              return true;
            })
            .reduce((sum, entry) => sum + entry.points, 0);
        } else {
          points = user.totalPoints;
          if (leaderboardPeriod === "weekly") points = Math.floor(points * 0.2);
          else if (leaderboardPeriod === "monthly") points = Math.floor(points * 0.5);
          if (leaderboardCategory !== "All") points = Math.floor(points * 0.33);
        }
        return { username: user.username, points };
      })
      .sort((a, b) => b.points - a.points)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [users, pointsHistory, leaderboardPeriod, leaderboardCategory]);

  const totalPredictions = userVotes.length;
  const correctPredictions = pointsHistory.filter(
    (entry) => (entry.vote === "up" && entry.result === "Yes") || (entry.vote === "down" && entry.result === "No")
  ).length;
  const correctPercentage = totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) : "0.0";
  const streak = getStreak();
  const leaderboard = useMemo(() => getLeaderboard(), [getLeaderboard]);
  const myRank = leaderboard.find((entry) => entry.username === "@you")?.rank || "N/A";
  const getBadges = useCallback(() => {
    const badges: Badge[] = [];
    if (totalPoints >= 100) badges.push({ name: "Rookie", description: "Earned 100 points", icon: "🏆" });
    if (totalPoints >= 500) badges.push({ name: "Pro", description: "Earned 500 points", icon: "🌟" });
    if (streak >= 7) badges.push({ name: "Streaker", description: "7-day streak", icon: "🔥" });
    if (myRank !== "N/A" && myRank <= 3) badges.push({ name: "Legend", description: "Top 3 on leaderboard", icon: "👑" });
    return badges;
  }, [totalPoints, streak, myRank]);
  const badges = getBadges();
  const categoryStats = useMemo(() => {
    const stats: { [key: string]: { total: number; correct: number } } = {};
    ["Music", "Politics", "Sports"].forEach((cat) => {
      const catVotes = pointsHistory.filter((entry) => entry.category === cat);
      const catCorrect = catVotes.filter(
        (entry) => (entry.vote === "up" && entry.result === "Yes") || (entry.vote === "down" && entry.result === "No")
      ).length;
      stats[cat] = { total: catVotes.length, correct: catCorrect };
    });
    return stats;
  }, [pointsHistory]);

  const handleSaveProfile = useCallback(() => {
    if (!username.trim()) {
      toast.error("Username cannot be empty!", {
        style: { background: "#1a202c", color: "#fff" },
      });
      return;
    }
    if (username !== "@you") {
      setPredictions((prev) =>
        prev.map((p) => (p.user === "@you" ? { ...p, user: username } : p))
      );
    }
    setIsEditing(false);
    toast.success("Profile updated!", {
      style: { background: "#1a202c", color: "#fff" },
    });
  }, [username]);

  const handleShareProfile = useCallback(async () => {
    const shareText = `${avatar} ${username} on NaWhoKnow! Rank: #${myRank}, Points: ${totalPoints}, Correct: ${correctPercentage}%, Streak: ${streak} days, Badges: ${badges.map((b) => b.icon).join("")} 🔥 Join me at nawhoknow.com/u/${username.replace("@", "")}`;
    if (badgeRef.current) {
      try {
        const canvas = await html2canvas(badgeRef.current);
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
        const file = new File([blob], "nawhoknow-badge.png", { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: `${username}'s NaWhoKnow Profile`,
            text: shareText,
            url: `https://nawhoknow.com/u/${username.replace("@", "")}`,
            files: [file],
          });
        } else {
          navigator.clipboard.writeText(shareText);
          toast.success("Profile link and badge URL copied to clipboard!", {
            style: { background: "#1a202c", color: "#fff" },
          });
        }
      } catch (err) {
        console.error("Share failed:", err);
        navigator.clipboard.writeText(shareText);
        toast.success("Profile link copied to clipboard!", {
          style: { background: "#1a202c", color: "#fff" },
        });
      }
    }
  }, [username, avatar, totalPoints, correctPercentage, streak, badges, myRank]);

  const filteredPredictions = useMemo(() => {
    return predictions
      .filter((p) => (activeTab === "active" ? Date.now() - p.createdAt < EXPIRY_TIME : p.result !== null))
      .filter((p) => categoryFilter === "All" || p.category === categoryFilter)
      .sort((a, b) => {
        switch (filter) {
          case "latest":
            return b.createdAt - a.createdAt;
          case "ending":
            return a.createdAt + EXPIRY_TIME - (b.createdAt + EXPIRY_TIME);
          case "trending":
          default:
            return b.upvotes - a.upvotes;
        }
      });
  }, [predictions, categoryFilter, filter, activeTab]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <Toaster position="top-right" />
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in">
          <Flame className="w-10 h-10 mx-auto text-red-500 animate-pulse" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">NaWhoKnow 🔥</h1>
          <p className="text-gray-600 dark:text-gray-300">Make wild predictions, vote, and go viral!</p>
        </div>

        {/* Profile Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">My Profile</h2>
          <div ref={badgeRef} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-slide-up">
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 rounded-md border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">Avatar</label>
                  <select
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full p-2 rounded-md border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="😎">😎 Cool</option>
                    <option value="🦁">🦁 Lion</option>
                    <option value="🌟">🌟 Star</option>
                    <option value="🚀">🚀 Rocket</option>
                    <option value="🐘">🐘 Elephant</option>
                    <option value="🎤">🎤 Mic</option>
                    <option value="⚽">⚽ Football</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-transform transform hover:scale-105"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 dark:bg-gray-700 dark:text-white transition-transform transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">{avatar}</span>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{username}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total Predictions: {totalPredictions} • Correct: {correctPercentage}% • Points: {totalPoints}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Streak: {streak} days</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Rank: #{myRank}</p>
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <div key={badge.name} className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-sm">
                        <span>{badge.icon}</span>
                        <span>{badge.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Category Stats</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {["Music", "Politics", "Sports"].map((cat) => (
                      <p key={cat}>
                        {cat}: {categoryStats[cat].total} votes,{" "}
                        {categoryStats[cat].total > 0
                          ? ((categoryStats[cat].correct / categoryStats[cat].total) * 100).toFixed(1)
                          : "0.0"}
                        % correct
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-transform transform hover:scale-105"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleShareProfile}
                    className="flex items-center gap-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-transform transform hover:scale-105"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-8 animate-slide-up">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Leaderboard</h2>
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setLeaderboardPeriod("weekly")}
              className={`px-3 py-1 rounded-full text-sm ${
                leaderboardPeriod === "weekly"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 dark:text-white"
              } transition-transform transform hover:scale-105`}
            >
              Weekly
            </button>
            <button
              onClick={() => setLeaderboardPeriod("monthly")}
              className={`px-3 py-1 rounded-full text-sm ${
                leaderboardPeriod === "monthly"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 dark:text-white"
              } transition-transform transform hover:scale-105`}
            >
              Monthly
            </button>
            <button
              onClick={() => setLeaderboardPeriod("all-time")}
              className={`px-3 py-1 rounded-full text-sm ${
                leaderboardPeriod === "all-time"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 dark:text-white"
              } transition-transform transform hover:scale-105`}
            >
              All-Time
            </button>
            <select
              value={leaderboardCategory}
              onChange={(e) => setLeaderboardCategory(e.target.value as Category)}
              className="px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-gray-700 dark:text-white"
            >
              <option value="All">All Categories</option>
              <option value="Music">Music</option>
              <option value="Politics">Politics</option>
              <option value="Sports">Sports</option>
            </select>
          </div>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.username}
                className={`p-3 rounded-lg shadow-sm ${
                  entry.username === username
                    ? "bg-red-100 dark:bg-red-900"
                    : "bg-white dark:bg-gray-800"
                } transition-transform transform hover:scale-105`}
              >
                <p className="text-sm text-gray-800 dark:text-white">
                  #{entry.rank} {entry.username} - {entry.points} points
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* New Prediction Input */}
        <div className="mb-4 animate-slide-up">
          <textarea
            value={newPrediction}
            onChange={(e) => setNewPrediction(e.target.value)}
            placeholder="Make a prediction..."
            className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            rows={3}
          ></textarea>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 mt-2 rounded-md border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 transition-transform transform hover:scale-105"
          >
            Predict
          </button>
        </div>

        {/* Prediction Tabs */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1 rounded-full text-sm ${
              activeTab === "active"
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 dark:text-white"
            } transition-transform transform hover:scale-105`}
          >
            Active Predictions
          </button>
          <button
            onClick={() => setActiveTab("resolved")}
            className={`px-3 py-1 rounded-full text-sm ${
              activeTab === "resolved"
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 dark:text-white"
            } transition-transform transform hover:scale-105`}
          >
            Resolved Predictions
          </button>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter("trending")}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === "trending"
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 dark:text-white"
            } transition-transform transform hover:scale-105`}
          >
            🔥 Trending
          </button>
          <button
            onClick={() => setFilter("latest")}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === "latest"
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 dark:text-white"
            } transition-transform transform hover:scale-105`}
          >
            🕒 Latest
          </button>
          <button
  onClick={() => setFilter("ending")}
  className={`px-3 py-1 rounded-full text-sm ${
    filter === "ending"
      ? "bg-red-500 text-white"
      : "bg-gray-200 dark:bg-gray-700 dark:text-white"
  } transition-transform transform hover:scale-105`}
>
  ⌛ Ending Soon
</button>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category)}
            className="px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-gray-700 dark:text-white"
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
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
              <p className="text-lg text-gray-800 dark:text-white">{pred.text}</p>
              <p className="text-sm text-gray-500">{pred.user}</p>
              <p className="text-xs text-gray-400 mt-1">
                {pred.category} • {pred.result ? `Resolved: ${pred.result}` : getTimeLeft(pred.createdAt)}
              </p>
              <div className="mt-2 flex items-center gap-4">
                <button
                  onClick={() => handleVote(pred.id, "up")}
                  disabled={hasVoted(pred.id) || pred.result !== null}
                  className={`flex items-center gap-1 ${
                    getUserVote(pred.id) === "up"
                      ? "text-green-800 font-bold"
                      : "text-green-600"
                  } hover:scale-110 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Check className="w-4 h-4" /> {pred.upvotes}
                </button>
                <button
                  onClick={() => handleVote(pred.id, "down")}
                  disabled={hasVoted(pred.id) || pred.result !== null}
                  className={`flex items-center gap-1 ${
                    getUserVote(pred.id) === "down"
                      ? "text-red-800 font-bold"
                      : "text-red-600"
                  } hover:scale-110 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <X className="w-4 h-4" /> {pred.downvotes}
                </button>
                {hasVoted(pred.id) && pred.result === null && (
                  <span className="text-xs text-gray-500">Vote locked until expiry</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Points History */}
        {pointsHistory.length > 0 && (
          <div className="mt-8 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Points History</h2>
            <div className="space-y-2">
              {pointsHistory.map((entry) => (
                <div
                  key={entry.predictionId}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-transform transform hover:scale-105"
                >
                  <p className="text-sm text-gray-800 dark:text-white">{entry.text}</p>
                  <p className="text-xs text-gray-500">
                    Your vote: {entry.vote === "up" ? "Yes" : "No"} • Result: {entry.result} • Points:{" "}
                    <span className={entry.points >= 0 ? "text-green-600" : "text-red-600"}>
                      {entry.points > 0 ? `+${entry.points}` : entry.points}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    )}