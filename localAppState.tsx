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
  const isAdmin = player?.role === "admin";
  const streakDays = player ? calculateStreak(player.trainingLog, todayKey) : 0;
  const allChallenges = useMemo(() => [...BASE_CHALLENGES, ...store.customChallenges], [store.customChallenges]);
  const todayChallenge = allChallenges.find(
    (challenge) =>
      challenge.levelRequired <= levelInfo.level &&
      !player?.completedChallengeIds.includes(challenge.id),
  ) ?? allChallenges.find((challenge) => challenge.levelRequired <= levelInfo.level) ?? null;
  const todayQuote = getQuoteOfTheDay(store.quotes, todayKey);
  const weeklyRankings = player ? buildLeaderboard("weekly", player, todayKey, store.leaderboardSeed) : null;
  const monthlyRankings = player ? buildLeaderboard("monthly", player, todayKey, store.leaderboardSeed) : null;

  const login = async (username: string, password: string) => {
    const cleanUsername = normaliseUsername(username);
    const account = store.users.find((user) => normaliseUsername(user.username) === cleanUsername);

    if (!account || account.password !== password) {
      return { ok: false, message: "Acest nume de utilizator și această parolă nu se potrivesc cu fișa noastră de antrenament." };
    }

    setCurrentUsername(account.username);
    return { ok: true, message: "Bine ai revenit, campionule! Lumea ta de antrenament este pregătită." };
  };

  const signUp = async (username: string, password: string, avatarId: string) => {
    const cleanUsername = username.trim();

    if (cleanUsername.length < 2) {
      return { ok: false, message: "Alege un nume de jucător cu cel puțin 2 caractere." };
    }

    if (password.trim().length < 4) {
      return { ok: false, message: "Folosește o parolă cu cel puțin 4 caractere." };
    }

    const usernameTaken = store.users.some(
      (user) => normaliseUsername(user.username) === normaliseUsername(cleanUsername),
    );

    if (usernameTaken) {
      return { ok: false, message: "Acest nume de jucător este deja pe foaia de echipă." };
    }

    const profile = createPlayerProfile(cleanUsername, avatarId);
    setStore((currentStore) => ({
      ...currentStore,
      users: [...currentStore.users, { username: cleanUsername, password, avatarId }],
      profiles: { ...currentStore.profiles, [cleanUsername]: profile },
      activeUsers: currentStore.activeUsers + 1,
    }));
    setCurrentUsername(cleanUsername);

    return { ok: true, message: "Cont creat. E timpul să începi aventura ta în academie." };
  };

  const logout = async () => {
    setCurrentUsername(null);
  };

  const completeTrainingTask = async (taskId: string) => {
    if (!currentUsername || !player) {
      return { ok: false, message: "Autentifică-te mai întâi ca să-ți salvezi antrenamentul." };
    }

    const task = todayPlan.tasks.find((entry) => entry.id === taskId);
    if (!task) {
      return { ok: false, message: "Acest exercițiu nu este în planul de azi." };
    }

    const alreadyDone = player.trainingLog.some(
      (entry) => entry.dateKey === todayKey && entry.taskId === taskId,
    );
    if (alreadyDone) {
      return { ok: false, message: "Acest exercițiu este deja finalizat azi." };
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
              taskTitle: "Bonus pentru sesiune completă",
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
              taskTitle: "Bonus pentru 7 zile de constanță",
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

    return { ok: true, message: `${task.title} este finalizat. Ai câștigat puncte XP prin antrenament real!` };
  };

  const completeChallenge = async (challengeId: string) => {
    if (!currentUsername || !player) {
      return { ok: false, message: "Autentifică-te mai întâi ca să-ți salvezi provocarea." };
    }

    const challenge = allChallenges.find((entry) => entry.id === challengeId);
    if (!challenge) {
      return { ok: false, message: "Această provocare nu a putut fi găsită." };
    }

    if (levelInfo.level < challenge.levelRequired) {
      return { ok: false, message: `Ajungi la nivelul ${challenge.levelRequired} ca să deblochezi această provocare.` };
    }

    if (player.completedChallengeIds.includes(challengeId)) {
      return { ok: false, message: "Insigna acestei provocări este deja în colecția ta." };
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

    return { ok: true, message: `${challenge.title} este finalizată. Insignă deblocată!` };
  };

  const addCoachQuote = async (quote: string) => {
    const cleanQuote = quote.trim();
    if (!cleanQuote) {
      return { ok: false, message: "Scrie mai întâi un mesaj motivațional." };
    }

    setStore((currentStore) => ({
      ...currentStore,
      quotes: [cleanQuote, ...currentStore.quotes],
    }));

    return { ok: true, message: "Mesajul motivațional a fost adăugat în rotația zilnică." };
  };

  const addCoachChallenge = async (title: string, description: string, focus: string) => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanFocus = focus.trim();

    if (!cleanTitle || !cleanDescription || !cleanFocus) {
      return { ok: false, message: "Adaugă un titlu, o idee de provocare și o țintă înainte să publici." };
    }

    const stamp = Date.now();
    const challenge: Challenge = {
      id: `coach-${stamp}`,
      title: cleanTitle,
      description: cleanDescription,
      target: cleanFocus,
      duration: "5-20 min",
      xp: 130,
      levelRequired: 2,
      difficulty: "Alegerea antrenorului",
      coachNote: "Provocare din panoul antrenorului. Oferă progres doar după ce jucătorul termină sincer întreaga misiune.",
      rewardText: "Insigna Alegerea antrenorului a fost deblocată.",
      badge: {
        id: `coach-badge-${stamp}`,
        label: "Alegerea antrenorului",
        description: `${cleanTitle} a fost terminată cu multă determinare.`,
        rarity: "Legendară",
        accent: "gold",
      },
    };

    setStore((currentStore) => ({
      ...currentStore,
      customChallenges: [challenge, ...currentStore.customChallenges],
    }));

    return { ok: true, message: "Noua provocare a antrenorului a fost publicată în academie." };
  };

  const refreshLeaderboard = async () => {
    setStore((currentStore) => ({
      ...currentStore,
      leaderboardSeed: currentStore.leaderboardSeed + 1,
      activeUsers: 150 + ((currentStore.leaderboardSeed + 1) * 13) % 45,
    }));

    return { ok: true, message: "Clasamentele au fost actualizate." };
  };

  const regenerateDailyContent = async () => {
    return {
      ok: false,
      message: "Generarea zilnica automata este disponibila doar in modul Supabase.",
    };
  };

  const value = useMemo(
    () => ({
      initializing: false,
      usesSupabase: false,
      requiresEmailAuth: false,
      player,
      isAdmin,
      todayKey,
      todayPlan,
      todayChallenge,
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
      regenerateDailyContent,
      refreshLeaderboard,
    }),
    [
      allChallenges,
      isAdmin,
      levelInfo,
      monthlyRankings,
      player,
      store.activeUsers,
      streakDays,
      todayCompletedTaskIds,
      todayKey,
      todayChallenge,
      todayPlan,
      todayQuote,
      weeklyRankings,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
