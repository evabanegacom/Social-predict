
import { useEffect, useState, useMemo, useCallback, useRef, useContext } from "react";
import { Flame, Check, X, Share2, Award} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import html2canvas from "html2canvas";
import type { Prediction, UserVote, PointsHistory, User, Badge, Category, Filter, LeaderboardPeriod, Tab } from "../../lib/types"
import { DAY_MS, EXPIRY_TIME, MONTH_MS, POINTS_FOR_CORRECT, POINTS_FOR_INCORRECT, WEEK_MS, initialPredictions, initialUsers } from "../../lib/utils";
import { useAuth } from "../../global-context";


export default function Home() {
//   const { predictions } = useAuth();
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
                  style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" },
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

  useEffect(() => {
    const streak = getStreak();
    if (streak === 3 || streak === 7 || streak === 14) {
      toast.success(`🔥 ${streak}-day streak achieved! Keep it up!`, {
        duration: 4000,
        style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" },
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
        style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" },
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
      style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" },
    });
  }, [predictions, userVotes, votingHistory]);

  const handleSubmit = useCallback(() => {
    if (!newPrediction.trim() || !selectedCategory) {
      toast.error("Please enter a prediction and select a category!", {
        style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" },
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
      style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" },
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
        style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" },
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
      style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" },
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
            style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" },
          });
        }
      } catch (err) {
        console.error("Share failed:", err);
        navigator.clipboard.writeText(shareText);
        toast.success("Profile link copied to clipboard!", {
          style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" },
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
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Flame className="w-12 h-12 mx-auto text-red-500 animate-pulse" />
          <h1 className="text-4xl font-extrabold text-white">NaWhoKnow 🔥</h1>
          <p className="text-gray-400 text-lg">Make bold predictions, vote, and rise to fame!</p>
        </div>

        {/* Profile Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">My Profile</h2>
          <div ref={badgeRef} className="p-6 bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-700 animate-slide-up">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 mt-1 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Avatar</label>
                  <select
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full p-3 mt-1 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-all transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce">{avatar}</span>
                  <p className="text-xl font-semibold text-white">{username}</p>
                </div>
                <p className="text-sm text-gray-400">
                  Total Predictions: {totalPredictions} • Correct: {correctPercentage}% • Points: {totalPoints}
                </p>
                <p className="text-sm text-gray-400">Streak: {streak} days</p>
                <p className="text-sm text-gray-400">Rank: #{myRank}</p>
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <div key={badge.name} className="flex items-center gap-1 bg-yellow-900/50 text-yellow-300 px-3 py-1 rounded-full text-sm">
                        <span>{badge.icon}</span>
                        <span>{badge.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white">Category Stats</h3>
                  <div className="text-sm text-gray-400">
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
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleShareProfile}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105"
                  >
                    <Share2 className="w-5 h-5" /> Share
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
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
                key={entry.username}
                className={`p-4 rounded-lg ${
                  entry.username === username
                    ? "bg-red-900/50"
                    : "bg-gray-800/80 backdrop-blur-lg border border-gray-700"
                } transition-all transform hover:scale-105`}
              >
                <p className="text-sm text-white">
                  #{entry.rank} {entry.username} - {entry.points} points
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* New Prediction Input */}
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
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === "active"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            } transition-all transform hover:scale-105`}
          >
            Active Predictions
          </button>
          <button
            onClick={() => setActiveTab("resolved")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === "resolved"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            } transition-all transform hover:scale-105`}
          >
            Resolved Predictions
          </button>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setFilter("trending")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === "trending"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            } transition-all transform hover:scale-105`}
          >
            🔥 Trending
          </button>
          <button
            onClick={() => setFilter("latest")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === "latest"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            } transition-all transform hover:scale-105`}
          >
            🕒 Latest
          </button>
          <button
            onClick={() => setFilter("ending")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === "ending"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
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
                  onClick={() => handleVote(pred.id, "up")}
                  disabled={hasVoted(pred.id) || pred.result !== null}
                  className={`flex items-center gap-2 text-sm ${
                    getUserVote(pred.id) === "up"
                      ? "text-green-400 font-bold"
                      : "text-green-500"
                  } hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Check className="w-5 h-5" /> {pred.upvotes}
                </button>
                <button
                  onClick={() => handleVote(pred.id, "down")}
                  disabled={hasVoted(pred.id) || pred.result !== null}
                  className={`flex items-center gap-2 text-sm ${
                    getUserVote(pred.id) === "down"
                      ? "text-red-400 font-bold"
                      : "text-red-500"
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

        {/* Points History */}
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
                    <span className={entry.points >= 0 ? "text-green-400" : "text-red-400"}>
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
  );
}
