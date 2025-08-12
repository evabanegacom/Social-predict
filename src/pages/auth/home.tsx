import { Toaster } from "react-hot-toast";
import Predictions from "../../components/prediction";
import LeaderBoard from "../../components/leaderBoard";
import PointsHistory from "../../components/points-history";
import Profile from "../../components/profile";
import Header from "../../components/header";
import Rewards from "../../components/rewards";
import PredictionSpotlight from "../../components/prediction-spotlight";
import ActivityFeed from "../../components/activity-feed";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../global-context";
import { useFetchVotes } from "../../hooks";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"main" | "spotlight" | "activity">("main");
  const { userVotes } = useFetchVotes();
  const totalPoints = userVotes?.reduce((total, vote) => total + (vote.points || 0), 0);
  const [ showProfile, setShowProfile ] = useState(false);
  const predictionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to predictions when component mounts
    predictionsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // useEffect(() => {
  //   // Redirect to login if user is not authenticated
  //   if (!user) {
  //     navigate("/login");
  //   }
  // }, [user, navigate]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-900 text-white pt-6 pb-6 px-4 font-sans relative flex flex-col md:flex-row md:justify-between">
      <Toaster position="top-right" />

      {/* Desktop: left sidebar (PredictionSpotlight) */}
      <div className="hidden md:flex md:flex-col md:w-64 lg:w-72 xl:w-80 mt-24">
        <PredictionSpotlight />
        <PointsHistory />
      </div>
      
      {/* Main content centered */}
      <div className="max-w-2xl mx-auto flex-1 md:mx-0 md:px-8 md:flex md:flex-col md:items-center">
        <Header />

        {/* Mobile tabs */}
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

        {/* Show content on mobile tabs */}
        {activeTab === "main" && (
          <div className="">
            <div className="flex justify-center items-center mb-4">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="cursor-pointer text-sm text-blue-400 hover:text-blue-300"
              >
                {showProfile ? "Hide Profile" : "Show Profile"}
              </button>
            </div>
            {showProfile && (
              <Profile />
            )}
            {/* <Profile /> */}
            {totalPoints > 49 ? <LeaderBoard /> : null}
            {totalPoints > 49 ? <Rewards /> : null}
            <div ref={predictionsRef}>
              <Predictions />
            </div>
            {/* <PointsHistory /> */}
          </div>
        )}
        {activeTab === "spotlight" && (
          <div className="md:hidden">
            <PredictionSpotlight />
            <PointsHistory />
          </div>
        )}
        {activeTab === "activity" && (
          <div className="md:hidden">
            <ActivityFeed />
          </div>
        )}
      </div>

      {/* Desktop: right sidebar (ActivityFeed) */}
      
      <div className="hidden md:flex md:flex-col md:w-64 lg:w-72 xl:w-80 mt-24">
        <ActivityFeed />
      </div>
    </div>
  );
}

