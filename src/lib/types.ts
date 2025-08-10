import type { VoteOption } from "./utils";

export interface Prediction {
    id: number;
    text: string;
    user: string;
    upvotes: number;
    downvotes: number;
    createdAt: number;
    category: string;
    result: "Yes" | "No" | null;
    time_left: string;
  }
  
export interface UserVote {
    prediction_id: number;
    voteType: VoteOption.Yes | VoteOption.No;
  }
  
export interface PointHistory {
    predictionId: number;
    text: string;
    vote: "up" | "down";
    result: "Yes" | "No";
    points: number;
    category: string;
    resolvedAt: number;
  }
  
export interface User {
    username: string;
    totalPoints: number;
  }
  
export interface Badge {
    name: string;
    description: string;
    icon: string;
  }

export interface PredictionResponse {
    status: number;
    message: string;
    data: Prediction[];
  }

  export type Filter = "trending" | "latest" | "ending";
  export type Category = "All" | "Music" | "Politics" | "Sports";
  export type LeaderboardPeriod = "weekly" | "monthly" | "all-time";
  export type Tab = "active" | "resolved";