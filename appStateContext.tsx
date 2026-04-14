import { createContext, useContext } from "react";
import type {
  Challenge,
  LevelInfo,
  PlayerProfile,
  RankedPlayer,
  TrainingPlan,
} from "./types";

export interface ActionResult {
  ok: boolean;
  message: string;
  requiresVerification?: boolean;
}

export interface AppStateContextValue {
  initializing: boolean;
  usesSupabase: boolean;
  requiresEmailAuth: boolean;
  player: PlayerProfile | null;
  isAdmin: boolean;
  todayKey: string;
  todayPlan: TrainingPlan;
  todayChallenge: Challenge | null;
  todayQuote: string;
  todayCompletedTaskIds: string[];
  levelInfo: LevelInfo;
  streakDays: number;
  allChallenges: Challenge[];
  weeklyLeaderboard: RankedPlayer[];
  monthlyLeaderboard: RankedPlayer[];
  currentWeeklyRank: RankedPlayer | null;
  currentMonthlyRank: RankedPlayer | null;
  activeUsers: number;
  login: (identifier: string, password: string) => Promise<ActionResult>;
  signUp: (
    username: string,
    password: string,
    avatarId: string,
    email?: string,
  ) => Promise<ActionResult>;
  logout: () => Promise<void>;
  completeTrainingTask: (taskId: string) => Promise<ActionResult>;
  completeChallenge: (challengeId: string) => Promise<ActionResult>;
  addCoachQuote: (quote: string) => Promise<ActionResult>;
  addCoachChallenge: (
    title: string,
    description: string,
    focus: string,
  ) => Promise<ActionResult>;
  regenerateDailyContent: (dateKey?: string) => Promise<ActionResult>;
  refreshLeaderboard: () => Promise<ActionResult>;
}

export const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return context;
}
