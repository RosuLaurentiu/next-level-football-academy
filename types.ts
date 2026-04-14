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
  rarity: "Rară" | "Epică" | "Legendară";
  accent: "green" | "orange" | "blue" | "gold";
}

export interface TrainingTaskStep {
  title: string;
  description: string;
  videoUrl?: string;
}

export interface TrainingTask {
  id: string;
  category: "Mental" | "Fizic" | "Tehnic";
  title: string;
  duration: string;
  focus: string;
  description: string;
  steps: TrainingTaskStep[];
  videoUrl?: string;
  thumbnailUrl?: string;
  exerciseType?: "Respirație" | "Vizualizare" | "Concentrare" | "Dialog pozitiv" | "Recunoștință";
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
  duration?: string;
  xp: number;
  levelRequired: number;
  difficulty: "Starter" | "Talentat" | "Avansat" | "Alegerea antrenorului";
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
  email?: string | null;
  avatarId: string;
  role?: "player" | "admin";
  isSuspended?: boolean;
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
  completedTrainings: number;
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
