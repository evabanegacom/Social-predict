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
    predictionId: number;
    voteType: "up" | "down";
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

//   {
//     "status": 200,
//     "message": "Predictions retrieved successfully.",
//     "data": [
//         {
//             "id": 1,
//             "topic": "Will Nigeria hold a peaceful election in 2027?",
//             "category": "Politics",
//             "vote_options": {
//                 "no": 0,
//                 "yes": 0,
//                 "maybe": 0
//             },
//             "time_left": "160d 0h 44m"
//         }
//     ]
// }

export interface PredictionResponse {
    status: number;
    message: string;
    data: Prediction[];
  }

  export type Filter = "trending" | "latest" | "ending";
  export type Category = "All" | "Music" | "Politics" | "Sports";
  export type LeaderboardPeriod = "weekly" | "monthly" | "all-time";
  export type Tab = "active" | "resolved";