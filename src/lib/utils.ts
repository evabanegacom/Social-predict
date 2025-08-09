import type { Prediction, User } from "./types";

export const EXPIRY_TIME = 24 * 60 * 60 * 1000;
export const POINTS_FOR_CORRECT = 10;
export const POINTS_FOR_INCORRECT = -2;
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const initialUsers: User[] = [
  { username: "@you", totalPoints: 50 },
  { username: "@seunpredicts", totalPoints: 100 },
  { username: "@musicoracle", totalPoints: 80 },
  { username: "@politicsguru", totalPoints: 120 },
];