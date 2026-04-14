import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BASE_CHALLENGES,
  CONSISTENCY_BONUS_XP,
  SESSION_BONUS_XP,
  awardMilestoneBadges,
  buildLeaderboard,
  calculateStreak,
  createPlayerProfile,
  createStarterStore,
  getLevelInfo,
  getQuoteOfTheDay,
  getTodayKey,
  getTrainingPlanForDate,
} from "./appData";
import { AppStateContext } from "./appStateContext";
import type {
  Challenge,
  PlayerProfile,
  StoredAppState,
} from "./types";

const STORAGE_KEY = "next-level-football-academy-state";
const USER_KEY = "next-level-football-academy-user";

function normaliseUsername(username: string): string {
  return username.trim().toLowerCase();
}

function readStoredState(): StoredAppState {
  if (typeof window === "undefined") {
    return createStarterStore();
  }

  const rawState = window.localStorage.getItem(STORAGE_KEY);

  if (!rawState) {
    return createStarterStore();
  }

  try {
    return JSON.parse(rawState) as StoredAppState;
  } catch {
    return createStarterStore();
  }
}

function readStoredUser(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(USER_KEY);
}

export function LocalAppStateProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<StoredAppState>(() => readStoredState());
  const [currentUsername, setCurrentUsername] = useState<string | null>(() => readStoredUser());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    if (currentUsername) {
      window.localStorage.setItem(USER_KEY, currentUsername);
    } else {
      window.localStorage.removeItem(USER_KEY);
    }
  }, [currentUsername]);

  const todayKey = getTodayKey();
  const todayPlan = getTrainingPlanForDate(todayKey);
  const player = currentUsername ? store.profiles[currentUsername] ?? null : null;
  const todayCompletedTaskIds = player
    ? player.trainingLog
        .filter(
          (entry) => entry.dateKey === todayKey && entry.taskId !== "session-bonus" && !entry.taskId.startsWith("consistency-"),
        )
        .map((entry) => entry.taskId)
    : [];
  const levelInfo = player ? getLevelInfo(player.totalXp) : getLevelInfo(0);
  const streakDays = player ? calculateStreak(player.trainingLog, todayKey) : 0;
  const allChallenges = useMemo(() => [...BASE_CHALLENGES, ...store.customChallenges], [store.customChallenges]);
  const todayQuote = getQuoteOfTheDay(store.quotes, todayKey);
  const weeklyRankings = player ? buildLeaderboard("weekly", player, todayKey, store.leaderboardSeed) : null;
  const monthlyRankings = player ? buildLeaderboard("monthly", player, todayKey, store.leaderboardSeed) : null;

  const login = async (username: string, password: string) => {
    const cleanUsername = normaliseUsername(username);
    const account = store.users.find((user) => normaliseUsername(user.username) === cleanUsername);

    if (!account || account.password !== password) {
      return { ok: false, message: "That username and password do not match our training records." };
    }

    setCurrentUsername(account.username);
    return { ok: true, message: "Welcome back. Your training world is ready." };
  };

  const signUp = async (username: string, password: string, avatarId: string) => {
    const cleanUsername = username.trim();

    if (cleanUsername.length < 2) {
      return { ok: false, message: "Choose a player name with at least 2 characters." };
    }

    if (password.trim().length < 4) {
      return { ok: false, message: "Use a password with at least 4 characters." };
    }

    const usernameTaken = store.users.some(
      (user) => normaliseUsername(user.username) === normaliseUsername(cleanUsername),
    );

    if (usernameTaken) {
      return { ok: false, message: "That player name is already on the team sheet." };
    }

    const profile = createPlayerProfile(cleanUsername, avatarId);
    setStore((currentStore) => ({
      ...currentStore,
      users: [...currentStore.users, { username: cleanUsername, password, avatarId }],
      profiles: { ...currentStore.profiles, [cleanUsername]: profile },
      activeUsers: currentStore.activeUsers + 1,
    }));
    setCurrentUsername(cleanUsername);

    return { ok: true, message: "Account created. Time to start your academy journey." };
  };

  const logout = async () => {
    setCurrentUsername(null);
  };

  const completeTrainingTask = async (taskId: string) => {
    if (!currentUsername || !player) {
      return { ok: false, message: "Log in first to save your training." };
    }

    const task = todayPlan.tasks.find((entry) => entry.id === taskId);
    if (!task) {
      return { ok: false, message: "That drill is not in today's plan." };
    }

    const alreadyDone = player.trainingLog.some(
      (entry) => entry.dateKey === todayKey && entry.taskId === taskId,
    );
    if (alreadyDone) {
      return { ok: false, message: "That drill is already completed for today." };
    }

    setStore((currentStore) => {
      const currentProfile = currentStore.profiles[currentUsername];
      const updatedTrainingLog = [
        ...currentProfile.trainingLog,
        {
          dateKey: todayKey,
          taskId: task.id,
          taskTitle: task.title,
          xp: task.xp,
        },
      ];

      let updatedProfile: PlayerProfile = {
        ...currentProfile,
        totalXp: currentProfile.totalXp + task.xp,
        trainingLog: updatedTrainingLog,
      };

      const completedToday = new Set(
        updatedProfile.trainingLog
          .filter((entry) => entry.dateKey === todayKey && entry.taskId !== "session-bonus")
          .map((entry) => entry.taskId),
      );

      const fullSessionComplete = todayPlan.tasks.every((entry) => completedToday.has(entry.id));
      const sessionBonusGranted = updatedProfile.trainingLog.some(
        (entry) => entry.dateKey === todayKey && entry.taskId === "session-bonus",
      );

      if (fullSessionComplete && !sessionBonusGranted) {
        updatedProfile = {
          ...updatedProfile,
          totalXp: updatedProfile.totalXp + SESSION_BONUS_XP,
          trainingLog: [
            ...updatedProfile.trainingLog,
            {
              dateKey: todayKey,
              taskId: "session-bonus",
              taskTitle: "Full Session Bonus",
              xp: SESSION_BONUS_XP,
            },
          ],
        };
      }

      const streak = calculateStreak(updatedProfile.trainingLog, todayKey);
      const completedMilestone = Math.floor(streak / 7);
      const alreadyAwardedMilestone = updatedProfile.consistencyRewardMilestones.includes(completedMilestone);

      if (completedMilestone > 0 && !alreadyAwardedMilestone) {
        updatedProfile = {
          ...updatedProfile,
          totalXp: updatedProfile.totalXp + CONSISTENCY_BONUS_XP,
          consistencyRewardMilestones: [
            ...updatedProfile.consistencyRewardMilestones,
            completedMilestone,
          ],
          trainingLog: [
            ...updatedProfile.trainingLog,
            {
              dateKey: todayKey,
              taskId: `consistency-${completedMilestone}`,
              taskTitle: "7-Day Consistency Bonus",
              xp: CONSISTENCY_BONUS_XP,
            },
          ],
        };
      }

      updatedProfile = awardMilestoneBadges(updatedProfile, todayKey);

      return {
        ...currentStore,
        profiles: {
          ...currentStore.profiles,
          [currentUsername]: updatedProfile,
        },
      };
    });

    return { ok: true, message: `${task.title} completed. XP earned through real practice.` };
  };

  const completeChallenge = async (challengeId: string) => {
    if (!currentUsername || !player) {
      return { ok: false, message: "Log in first to save your challenge." };
    }

    const challenge = allChallenges.find((entry) => entry.id === challengeId);
    if (!challenge) {
      return { ok: false, message: "That challenge could not be found." };
    }

    if (levelInfo.level < challenge.levelRequired) {
      return { ok: false, message: `Reach level ${challenge.levelRequired} to unlock this challenge.` };
    }

    if (player.completedChallengeIds.includes(challengeId)) {
      return { ok: false, message: "That challenge badge is already in your collection." };
    }

    setStore((currentStore) => {
      const currentProfile = currentStore.profiles[currentUsername];
      let updatedProfile: PlayerProfile = {
        ...currentProfile,
        totalXp: currentProfile.totalXp + challenge.xp,
        completedChallengeIds: [...currentProfile.completedChallengeIds, challengeId],
        challengeLog: [
          ...currentProfile.challengeLog,
          {
            completedOn: todayKey,
            challengeId,
            title: challenge.title,
            xp: challenge.xp,
          },
        ],
        unlockedBadges: currentProfile.unlockedBadges.some((badge) => badge.id === challenge.badge.id)
          ? currentProfile.unlockedBadges
          : [...currentProfile.unlockedBadges, challenge.badge],
      };

      updatedProfile = awardMilestoneBadges(updatedProfile, todayKey);

      return {
        ...currentStore,
        profiles: {
          ...currentStore.profiles,
          [currentUsername]: updatedProfile,
        },
      };
    });

    return { ok: true, message: `${challenge.title} completed. Badge unlocked.` };
  };

  const addCoachQuote = async (quote: string) => {
    const cleanQuote = quote.trim();
    if (!cleanQuote) {
      return { ok: false, message: "Write a motivational quote first." };
    }

    setStore((currentStore) => ({
      ...currentStore,
      quotes: [cleanQuote, ...currentStore.quotes],
    }));

    return { ok: true, message: "New motivational quote added to the daily rotation." };
  };

  const addCoachChallenge = async (title: string, description: string, focus: string) => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanFocus = focus.trim();

    if (!cleanTitle || !cleanDescription || !cleanFocus) {
      return { ok: false, message: "Add a title, challenge idea, and target before publishing." };
    }

    const stamp = Date.now();
    const challenge: Challenge = {
      id: `coach-${stamp}`,
      title: cleanTitle,
      description: cleanDescription,
      target: cleanFocus,
      xp: 130,
      levelRequired: 2,
      difficulty: "Coach Pick",
      coachNote: "Coach panel challenge. Award progress only after the player completes the full task honestly.",
      rewardText: "Coach Pick badge unlocked.",
      badge: {
        id: `coach-badge-${stamp}`,
        label: "Coach Pick",
        description: `${cleanTitle} completed with strong effort.`,
        rarity: "Legendary",
        accent: "gold",
      },
    };

    setStore((currentStore) => ({
      ...currentStore,
      customChallenges: [challenge, ...currentStore.customChallenges],
    }));

    return { ok: true, message: "New coach challenge published for the academy." };
  };

  const refreshLeaderboard = async () => {
    setStore((currentStore) => ({
      ...currentStore,
      leaderboardSeed: currentStore.leaderboardSeed + 1,
      activeUsers: 150 + ((currentStore.leaderboardSeed + 1) * 13) % 45,
    }));

    return { ok: true, message: "Rankings updated." };
  };

  const value = useMemo(
    () => ({
      initializing: false,
      usesSupabase: false,
      requiresEmailAuth: false,
      player,
      todayKey,
      todayPlan,
      todayQuote,
      todayCompletedTaskIds,
      levelInfo,
      streakDays,
      allChallenges,
      weeklyLeaderboard: weeklyRankings?.topTen ?? [],
      monthlyLeaderboard: monthlyRankings?.topTen ?? [],
      currentWeeklyRank: weeklyRankings?.currentUser ?? null,
      currentMonthlyRank: monthlyRankings?.currentUser ?? null,
      activeUsers: store.activeUsers,
      login,
      signUp,
      logout,
      completeTrainingTask,
      completeChallenge,
      addCoachQuote,
      addCoachChallenge,
      refreshLeaderboard,
    }),
    [
      allChallenges,
      levelInfo,
      monthlyRankings,
      player,
      store.activeUsers,
      streakDays,
      todayCompletedTaskIds,
      todayKey,
      todayPlan,
      todayQuote,
      weeklyRankings,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
