import type { User } from "./types";

export const EXPIRY_TIME = 24 * 60 * 60 * 1000;
export const POINTS_FOR_CORRECT = 10;
export const POINTS_FOR_INCORRECT = -2;
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

export enum VoteOption {
  Yes = "Yes",
  No = "No",
}
