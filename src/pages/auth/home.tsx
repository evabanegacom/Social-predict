import { Toaster } from "react-hot-toast";
import Predictions from "../../components/prediction";
import LeaderBoard from "../../components/leaderBoard";
import PointsHistory from "../../components/points-history";
import Profile from "../../components/profile";
import Header from "../../components/header";
import Rewards from "../../components/rewards";
import PredictionSpotlight from "../../components/prediction-spotlight";
import ActivityFeed from "../../components/activity-feed";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"main" | "spotlight" | "activity">("main");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans relative">
      <Toaster position="top-right" />
      {/* Side panels for desktop */}
      <div className="hidden md:block">
        <PredictionSpotlight />
        <ActivityFeed />
      </div>
      <div className="max-w-2xl mx-auto">
        <Header />
        {/* Tab navigation for mobile */}
        <div className="md:hidden flex justify-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("main")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === "main"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            } transition-all transform hover:scale-105`}
          >
            Main
          </button>
          <button
            onClick={() => setActiveTab("spotlight")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === "spotlight"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            } transition-all transform hover:scale-105`}
          >
            Spotlight
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === "activity"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            } transition-all transform hover:scale-105`}
          >
            Activity
          </button>
        </div>
        {/* Content based on active tab */}
        {activeTab === "main" && (
          <div className="space-y-8">
            <Profile />
            <LeaderBoard />
            <Rewards />
            <Predictions />
            <PointsHistory />
          </div>
        )}
        {activeTab === "spotlight" && (
          <div className="md:hidden">
            <PredictionSpotlight />
          </div>
        )}
        {activeTab === "activity" && (
          <div className="md:hidden">
            <ActivityFeed />
          </div>
        )}
      </div>
    </div>
  );
}
