export interface AvatarOption {
  id: string;
  label: string;
  initials: string;
  accent: string;
  glow: string;
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  rarity: "Rare" | "Epic" | "Legendary";
  accent: "green" | "orange" | "blue" | "gold";
}

export interface TrainingTask {
  id: string;
  category: "Warm-up" | "Ball Control" | "Passing" | "Fitness" | "Bonus";
  title: string;
  duration: string;
  focus: string;
  description: string;
  steps: string[];
  xp: number;
  accent: "green" | "orange" | "blue" | "gold";
}

export interface TrainingPlan {
  id: string;
  title: string;
  theme: string;
  spotlight: string;
  tasks: TrainingTask[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: string;
  xp: number;
  levelRequired: number;
  difficulty: "Starter" | "Skilled" | "Advanced" | "Coach Pick";
  coachNote: string;
  rewardText: string;
  badge: Badge;
}

export interface TrainingLogEntry {
  dateKey: string;
  taskId: string;
  taskTitle: string;
  xp: number;
}

export interface ChallengeLogEntry {
  completedOn: string;
  challengeId: string;
  title: string;
  xp: number;
}

export interface PlayerProfile {
  userId?: string;
  username: string;
  avatarId: string;
  totalXp: number;
  completedChallengeIds: string[];
  trainingLog: TrainingLogEntry[];
  challengeLog: ChallengeLogEntry[];
  unlockedBadges: Badge[];
  consistencyRewardMilestones: number[];
  createdAt: string;
}

export interface StoredUser {
  username: string;
  password: string;
  avatarId: string;
}

export interface StoredAppState {
  users: StoredUser[];
  profiles: Record<string, PlayerProfile>;
  quotes: string[];
  customChallenges: Challenge[];
  leaderboardSeed: number;
  activeUsers: number;
}

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  nextXp: number | null;
  progress: number;
}

export interface RankedPlayer {
  rank: number;
  userId?: string;
  username: string;
  avatarId: string;
  xp: number;
  level: number;
  streak: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardProfileSnapshot {
  userId: string;
  username: string;
  avatarId: string;
  totalXp: number;
  trainingLog: TrainingLogEntry[];
  challengeLog: ChallengeLogEntry[];
}
