import { Share2, X as XIcon, Facebook, Linkedin, Twitter } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useFetchVotes, useLeaderboard } from '../hooks';
import type { Badge } from '../lib/types';
import { useAuth } from '../global-context';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

const Profile = () => {
    const badgeRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const { leaderboardPeriod, leaderboardCategory, predictionCategories, user, pointsHistory } = useAuth();
    const [username, setUsername] = useState(user?.username || "Anonymous");
    const [avatar, setAvatar] = useState("😎");
    const { userVotes } = useFetchVotes();
    const { leaderboard, currentUser } = useLeaderboard(leaderboardPeriod, leaderboardCategory);
    const totalPointHistory = pointsHistory?.reduce((total, entry) => total + (entry?.points || 0), 0);
    const categoryStats = predictionCategories?.reduce((acc, category) => {
        acc[category] = {
            total: userVotes?.filter(vote => vote?.category === category)?.length,
            correct: userVotes?.filter(vote => vote?.category === category && vote?.correct)?.length
        };
        return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    const handleSaveProfile = () => {
        setIsEditing(false);
        console.log("Profile saved:", { username, avatar });
    };

    const totalPredictions = userVotes?.length || 0;
    const correctVotes = userVotes?.filter(vote => vote?.correct)?.length || 0;
    const correctPercentage = totalPredictions > 0 ? ((correctVotes / totalPredictions) * 100).toFixed(1) : "0.0";
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

    useEffect(() => {
        if (streak === 3 || streak === 7 || streak === 14) {
            toast.success(`🔥 ${streak}-day streak achieved! Keep it up!`, {
                duration: 4000,
                style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
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

    const generateShareCard = useCallback(async (retryWithSimplified = false) => {
        if (!badgeRef.current) {
            console.error("Badge ref is not set or element is not rendered");
            toast.error("Profile card element not found!", {
                style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
            });
            return null;
        }

        const isVisible = badgeRef.current.offsetParent !== null;
        if (!isVisible) {
            console.error("Badge ref element is not visible");
            toast.error("Profile card is not visible!", {
                style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
            });
            return null;
        }

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const canvas = await html2canvas(badgeRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#1f2937",
                logging: true,
                width: badgeRef.current.offsetWidth,
                height: badgeRef.current.offsetHeight,
            });
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1.0));
            if (!blob) {
                console.error("Failed to create blob from canvas");
                toast.error("Failed to generate image from card!", {
                    style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
                });
                return null;
            }
            console.log("Canvas generated successfully, blob size:", blob.size);
            return new File([blob], "whoknows-profile-card.png", { type: "image/png" });
        } catch (err) {
            console.error("Card generation failed:", err);
            if (!retryWithSimplified && err.message?.includes("oklch")) {
                console.warn("Retrying with simplified styles due to oklch error");
                badgeRef.current.classList.add("simplified-styles");
                const file = await generateShareCard(true);
                badgeRef.current.classList.remove("simplified-styles");
                return file;
            }
            toast.error(`Failed to generate card: ${err.message || 'Unknown error'}`, {
                style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
            });
            return null;
        }
    }, []);

    const handleShareProfile = useCallback(async (platform: string) => {
        const profileUrl = `https://whoknows.netlify.app/u/${username.replace("@", "")}`;
        const shareText = `${avatar} ${username} on WhoKnows! Rank: #${myRank || 'N/A'}, Points: ${totalPoints}, Correct: ${correctPercentage}%, Streak: ${streak} days, Badges: ${badges.map((b) => b.icon).join("")} 🔥 Join me at ${profileUrl}`;
        const file = await generateShareCard();

        if (!file) {
            console.warn("Falling back to text sharing due to card generation failure");
            try {
                await navigator.clipboard.writeText(shareText);
                toast.error("Failed to generate profile card, copied text instead!", {
                    style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
                });
            } catch (err) {
                console.error("Clipboard text copy failed:", err);
                toast.error("Failed to copy profile details!", {
                    style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
                });
            }
            setShowShareModal(false);
            return;
        }

        const shareData = {
            title: `${username}'s WhoKnows Profile`,
            text: shareText,
            url: profileUrl,
            files: [file],
        };

        if (platform === 'native' && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share(shareData);
                toast.success("Profile shared successfully!", {
                    style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
                });
            } catch (err) {
                console.error("Native share failed:", err);
                toast.error("Failed to share natively, try another platform!", {
                    style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
                });
            }
        } else {
            let shareUrl = '';
            switch (platform) {
                case 'x':
                    shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                    break;
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}&quote=${encodeURIComponent(shareText)}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent(shareData.title)}&summary=${encodeURIComponent(shareText)}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                    break;
                default:
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({ "image/png": file })
                        ]);
                        toast.success("Profile card copied to clipboard! Paste it on your preferred platform.", {
                            style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
                        });
                    } catch (err) {
                        console.error("Clipboard image copy failed:", err);
                        await navigator.clipboard.writeText(shareText);
                        toast.success("Profile text copied to clipboard!", {
                            style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
                        });
                    }
                    setShowShareModal(false);
                    return;
            }
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
            toast.success(`Opened ${platform} for sharing!`, {
                style: { background: "#1f2937", color: "#ffffff", border: "1px solid rgba(167, 139, 250, 0.2)" },
            });
        }
        setShowShareModal(false);
    }, [username, avatar, totalPoints, correctPercentage, streak, badges, myRank, generateShareCard]);

    return (
        <div className="mb-8">
            <style>
                {`
                    .simplified-styles, .simplified-styles * {
                        background: #1f2937 !important;
                        color: #ffffff !important;
                        border-color: #4b5563 !important;
                    }
                    .simplified-styles .bg-yellow-900\\/50 {
                        background: #78350f !important;
                    }
                    .simplified-styles .text-yellow-300 {
                        color: #fef08a !important;
                    }
                    .simplified-styles .text-blue-400 {
                        color: #60a5fa !important;
                    }
                `}
            </style>
            {/* <h2 className="text-2xl font-bold text-white mb-4">My Profile</h2> */}
            <div
                ref={badgeRef}
                className="p-6 bg-[#1f2937] rounded-xl border border-[#4b5563] shadow-xl max-w-md mx-auto"
            >
                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-[#9ca3af]">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-3 mt-1 rounded-lg bg-[#374151] border border-[#4b5563] text-white focus:outline-none focus:ring-2 focus:ring-[#ef4444]"
                                placeholder="Enter username"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-[#9ca3af]">Avatar</label>
                            <select
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                                className="w-full p-3 mt-1 rounded-lg bg-[#374151] border border-[#4b5563] text-white focus:outline-none focus:ring-2 focus:ring-[#ef4444]"
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
                                className="bg-[#ef4444] text-white px-6 py-2 rounded-lg hover:bg-[#dc2626] transition-all transform hover:scale-105"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="bg-[#374151] text-white px-6 py-2 rounded-lg hover:bg-[#4b5563] transition-all transform hover:scale-105"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-5xl">{avatar}</span>
                            <p className="text-2xl font-bold text-white">{username}</p>
                        </div>
                        <div className="text-sm text-[#9ca3af] flex justify-center gap-2">
                            <span>Daily Streak:</span>
                            <span className="font-bold text-[#60a5fa]">{streak} 🔥</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-[#9ca3af] bg-[#374151] p-4 rounded-lg">
                            <div>
                                <p>Total Predictions</p>
                                <p className="font-bold text-white">{totalPredictions}</p>
                            </div>
                            <div>
                                <p>Correct</p>
                                <p className="font-bold text-white">{correctPercentage}%</p>
                            </div>
                            <div>
                                <p>Points</p>
                                <p className="font-bold text-white">{totalPoints}</p>
                            </div>
                            <div>
                                <p>Rank</p>
                                <p className="font-bold text-white">#{myRank || 'N/A'}</p>
                            </div>
                        </div>
                        <p className="text-sm text-[#9ca3af]">
                            Points after Gift redemption: <span className="font-bold">{totalPointHistory ?? 0}</span>
                        </p>
                        {badges.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2">
                                {badges.map((badge) => (
                                    <div
                                        key={badge.name}
                                        className="flex items-center gap-1 bg-[#78350f] text-[#fef08a] px-3 py-1 rounded-full text-xs"
                                    >
                                        <span>{badge.icon}</span>
                                        <span>{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-white">Category Stats</h3>
                            <div className="text-xs text-[#9ca3af] grid gap-1">
                                <p>
                                    All Categories: {totalPredictions} votes, {correctPercentage}% correct
                                </p>
                                {predictionCategories?.filter(cat => cat !== 'All')?.map((cat) => (
                                    <p key={cat}>
                                        {cat}: {categoryStats[cat]?.total} votes,{" "}
                                        {categoryStats[cat]?.total > 0
                                            ? ((categoryStats[cat]?.correct / categoryStats[cat]?.total) * 100).toFixed(1)
                                            : "0.0"}% correct
                                    </p>
                                ))}
                            </div>
                        </div>
                        <div className="text-xs text-[#9ca3af] mt-2">
                            Join me at WhoKnows! whoknows.netlify.app
                        </div>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-[#ef4444] text-white px-6 py-2 rounded-lg hover:bg-[#dc2626] transition-all transform hover:scale-105"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="flex items-center gap-2 bg-[#2563eb] text-white px-6 py-2 rounded-lg hover:bg-[#1d4ed8] transition-all transform hover:scale-105"
                            >
                                <Share2 className="w-5 h-5" /> Share
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showShareModal && (
                <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50">
                    <div className="bg-[#1f2937] p-6 rounded-xl border border-[#4b5563] max-w-sm w-full">
                        <h3 className="text-lg font-bold text-white mb-4">Share Your Profile</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleShareProfile('x')}
                                className="flex items-center justify-center gap-2 bg-[#2563eb] text-white px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition-all"
                            >
                                <XIcon className="w-5 h-5" /> X
                            </button>
                            <button
                                onClick={() => handleShareProfile('facebook')}
                                className="flex items-center justify-center gap-2 bg-[#1e40af] text-white px-4 py-2 rounded-lg hover:bg-[#1e3a8a] transition-all"
                            >
                                <Facebook className="w-5 h-5" /> Facebook
                            </button>
                            <button
                                onClick={() => handleShareProfile('linkedin')}
                                className="flex items-center justify-center gap-2 bg-[#3b82f6] text-white px-4 py-2 rounded-lg hover:bg-[#2563eb] transition-all"
                            >
                                <Linkedin className="w-5 h-5" /> LinkedIn
                            </button>
                            <button
                                onClick={() => handleShareProfile('twitter')}
                                className="flex items-center justify-center gap-2 bg-[#60a5fa] text-white px-4 py-2 rounded-lg hover:bg-[#3b82f6] transition-all"
                            >
                                <Twitter className="w-5 h-5" /> Twitter
                            </button>
                            <button
                                onClick={() => handleShareProfile('clipboard')}
                                className="flex items-center justify-center gap-2 bg-[#4b5563] text-white px-4 py-2 rounded-lg hover:bg-[#6b7280] transition-all"
                            >
                                <Share2 className="w-5 h-5" /> Copy
                            </button>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="flex items-center justify-center gap-2 bg-[#374151] text-white px-4 py-2 rounded-lg hover:bg-[#4b5563] transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;