
import { Toaster } from "react-hot-toast";
import Predictions from "../../components/prediction";
import LeaderBoard from "../../components/leaderBoard";
import PointsHistory from "../../components/points-history";
import Profile from "../../components/profile";
import Header from "../../components/header";
import Rewards from "../../components/rewards";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        <Header />
        <Profile />
        <LeaderBoard />
        <Rewards />
        <Predictions />
        <PointsHistory />
      </div>
    </div>
  );
}
