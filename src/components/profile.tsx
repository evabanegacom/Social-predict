import { Share2 } from 'lucide-react'
import React, { useCallback, useEffect, useRef } from 'react'
import { useFetchVotes, useLeaderboard } from '../hooks';
import type { Badge } from '../lib/types';
import { useAuth } from '../global-context';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

const Profile = () => {
    const badgeRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const {leaderboardPeriod, leaderboardCategory, predictionCategories, user} = useAuth()
    const [username, setUsername] = React.useState(user?.username || "Anonymous");
    const [avatar, setAvatar] = React.useState("😎");
    const { userVotes } = useFetchVotes()
    const { leaderboard, currentUser } = useLeaderboard(leaderboardPeriod, leaderboardCategory)

    const categoryStats = predictionCategories?.reduce((acc, category) => {
        acc[category] = {
            total: userVotes.filter(vote => vote?.category === category)?.length,
            correct: userVotes.filter(vote => vote?.category === category && vote?.correct)?.length
        };
        return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    console.log({categoryStats})
    

    // console.log({currentUser, leaderboard, userVotes, categoryStats});
    const handleSaveProfile = () => {
        // Logic to save profile changes
        setIsEditing(false);
        console.log("Profile saved:", { username, avatar });
    }

    console.log({userVotes})
    const totalPredictions = userVotes?.length;
    const correctVotes = userVotes?.filter(vote => vote?.correct)?.length;
    const correctPercentage = totalPredictions > 0 ? ((correctVotes / totalPredictions) * 100).toFixed(1) : "0.0";
    const totalPoints = userVotes?.reduce((total, vote) => total + (vote.points || 0), 0);

    const getStreak = useCallback(() => {
        if (userVotes.length === 0) return 0;
      
        // Sort by vote date (most recent first)
        const sortedVotes = [...userVotes].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      
        let streak = 1;
        for (let i = 1; i < sortedVotes.length; i++) {
          const prevVote = sortedVotes[i - 1];
          const currVote = sortedVotes[i];
      
          const prevDay = new Date(prevVote.date).setHours(0, 0, 0, 0);
          const currDay = new Date(currVote.date).setHours(0, 0, 0, 0);
      
          // Check for consecutive days AND same correctness
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

    useEffect(() => {
        if (streak == 3 || streak == 7 || streak == 14) {
            toast.success(`🔥 ${streak}-day streak achieved! Keep it up!`, {
                duration: 4000,
                style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)" },
            });
        }
    }, [userVotes, streak]);
const myRank = (currentUser?.rank ?? (leaderboard.findIndex(u => u.id === currentUser?.id) + 1)) || null;

const getBadges = useCallback(() => {
        const badges: Badge[] = [];
        if (totalPoints >= 100) badges.push({ name: "Rookie", description: "Earned 100 points", icon: "🏆" });
        if (totalPoints >= 500) badges.push({ name: "Pro", description: "Earned 500 points", icon: "🌟" });
        if (streak >= 7) badges.push({ name: "Streaker", description: "7-day streak", icon: "🔥" });
        if (myRank && myRank <= 3) badges.push({ name: "Legend", description: "Top 3 on leaderboard", icon: "👑" });
        return badges;
      }, [totalPoints, streak, myRank]);
      const badges = getBadges();

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
      
  return (
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
            <p className="text-sm text-gray-300">
            Daily Streak: 
            <span className="font-bold text-blue-400">{user?.streak} 🔥</span>
            </p>
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
              <p>
                All Categories: {totalPredictions} votes,{" "}
                {totalPredictions > 0
                  ? ((correctVotes / totalPredictions) * 100).toFixed(1)
                  : "0.0"}% correct
              </p>
              {predictionCategories?.filter(cat => cat !='All')?.map((cat) => (
                <p key={cat}>
                  {cat}: {categoryStats[cat]?.total} votes,{" "}
                  {categoryStats[cat]?.total > 0
                    ? ((categoryStats[cat]?.correct / categoryStats[cat]?.total) * 100).toFixed(1)
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
  )
}

export default Profile