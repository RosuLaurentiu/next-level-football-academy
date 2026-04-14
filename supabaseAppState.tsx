import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BASE_CHALLENGES,
  DEFAULT_QUOTES,
  buildLeaderboardFromSnapshots,
  calculateStreak,
  getLevelInfo,
  getQuoteOfTheDay,
  getTodayKey,
  getTrainingPlanForDate,
} from "./appData";
import { AppStateContext } from "./appStateContext";
import { supabase } from "./supabaseClient";
import type {
  Badge,
  Challenge,
  LeaderboardProfileSnapshot,
  PlayerProfile,
  RankedPlayer,
  TrainingLogEntry,
  ChallengeLogEntry,
} from "./types";

interface ProfileRow {
  user_id: string;
  username: string;
  avatar_id: string;
  total_xp: number;
  unlocked_badges: Badge[] | null;
  consistency_reward_milestones: number[] | null;
  created_at: string;
}

interface CoachQuoteRow {
  quote: string;
}

interface CoachChallengeRow {
  id: string;
  title: string;
  description: string;
  target: string;
  xp: number;
  level_required: number;
  difficulty: string;
  coach_note: string;
  reward_text: string;
  badge: Badge;
}

interface TrainingCompletionRow {
  user_id: string;
  date_key: string;
  task_id: string;
  task_title: string;
  xp: number;
}

interface ChallengeCompletionRow {
  user_id: string;
  challenge_id: string;
  title: string;
  xp: number;
  completed_on: string;
}

function formatSupabaseError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "That email and password do not match our training records.";
  }

  if (message.includes("User already registered")) {
    return "That email is already on the team sheet.";
  }

  return message;
}

function toDateKey(value: string): string {
  return getTodayKey(new Date(value));
}

function mapDifficulty(value: string): Challenge["difficulty"] {
  if (value === "Starter" || value === "Skilled" || value === "Advanced" || value === "Coach Pick") {
    return value;
  }

  return "Coach Pick";
}

function mapTrainingLog(rows: TrainingCompletionRow[]): TrainingLogEntry[] {
  return rows.map((row) => ({
    dateKey: row.date_key,
    taskId: row.task_id,
    taskTitle: row.task_title,
    xp: row.xp,
  }));
}

function mapChallengeLog(rows: ChallengeCompletionRow[]): ChallengeLogEntry[] {
  return rows.map((row) => ({
    completedOn: row.completed_on,
    challengeId: row.challenge_id,
    title: row.title,
    xp: row.xp,
  }));
}

function mapCoachChallenge(row: CoachChallengeRow): Challenge {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    target: row.target,
    xp: row.xp,
    levelRequired: row.level_required,
    difficulty: mapDifficulty(row.difficulty),
    coachNote: row.coach_note,
    rewardText: row.reward_text,
    badge: row.badge,
  };
}

function buildLeaderboardSnapshots(
  profiles: ProfileRow[],
  trainingRows: TrainingCompletionRow[],
  challengeRows: ChallengeCompletionRow[],
): LeaderboardProfileSnapshot[] {
  const trainingByUser = new Map<string, TrainingLogEntry[]>();
  const challengeByUser = new Map<string, ChallengeLogEntry[]>();

  for (const row of trainingRows) {
    const existing = trainingByUser.get(row.user_id) ?? [];
    existing.push({
      dateKey: row.date_key,
      taskId: row.task_id,
      taskTitle: row.task_title,
      xp: row.xp,
    });
    trainingByUser.set(row.user_id, existing);
  }

  for (const row of challengeRows) {
    const existing = challengeByUser.get(row.user_id) ?? [];
    existing.push({
      completedOn: row.completed_on,
      challengeId: row.challenge_id,
      title: row.title,
      xp: row.xp,
    });
    challengeByUser.set(row.user_id, existing);
  }

  return profiles.map((profile) => ({
    userId: profile.user_id,
    username: profile.username,
    avatarId: profile.avatar_id,
    totalXp: profile.total_xp,
    trainingLog: trainingByUser.get(profile.user_id) ?? [],
    challengeLog: challengeByUser.get(profile.user_id) ?? [],
  }));
}

function mapProfile(
  profile: ProfileRow,
  trainingRows: TrainingCompletionRow[],
  challengeRows: ChallengeCompletionRow[],
): PlayerProfile {
  const trainingLog = mapTrainingLog(trainingRows);
  const challengeLog = mapChallengeLog(challengeRows);

  return {
    userId: profile.user_id,
    username: profile.username,
    avatarId: profile.avatar_id,
    totalXp: profile.total_xp,
    completedChallengeIds: challengeLog.map((entry) => entry.challengeId),
    trainingLog,
    challengeLog,
    unlockedBadges: profile.unlocked_badges ?? [],
    consistencyRewardMilestones: profile.consistency_reward_milestones ?? [],
    createdAt: toDateKey(profile.created_at),
  };
}

async function fetchRemoteSnapshot(userId: string, todayKey: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const [
    profileResult,
    quoteResult,
    coachChallengeResult,
    activeUsersResult,
    allProfilesResult,
    allTrainingResult,
    allChallengeResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, username, avatar_id, total_xp, unlocked_badges, consistency_reward_milestones, created_at")
      .eq("user_id", userId)
      .single<ProfileRow>(),
    supabase
      .from("coach_quotes")
      .select("quote")
      .order("created_at", { ascending: false })
      .returns<CoachQuoteRow[]>(),
    supabase
      .from("coach_challenges")
      .select("id, title, description, target, xp, level_required, difficulty, coach_note, reward_text, badge")
      .order("created_at", { ascending: false })
      .returns<CoachChallengeRow[]>(),
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("user_id, username, avatar_id, total_xp, unlocked_badges, consistency_reward_milestones, created_at")
      .returns<ProfileRow[]>(),
    supabase
      .from("training_completions")
      .select("user_id, date_key, task_id, task_title, xp")
      .returns<TrainingCompletionRow[]>(),
    supabase
      .from("challenge_completions")
      .select("user_id, challenge_id, title, xp, completed_on")
      .returns<ChallengeCompletionRow[]>(),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (quoteResult.error) {
    throw new Error(quoteResult.error.message);
  }

  if (coachChallengeResult.error) {
    throw new Error(coachChallengeResult.error.message);
  }

  if (activeUsersResult.error) {
    throw new Error(activeUsersResult.error.message);
  }

  if (allProfilesResult.error) {
    throw new Error(allProfilesResult.error.message);
  }

  if (allTrainingResult.error) {
    throw new Error(allTrainingResult.error.message);
  }

  if (allChallengeResult.error) {
    throw new Error(allChallengeResult.error.message);
  }

  const allProfiles = allProfilesResult.data ?? [];
  const allTraining = allTrainingResult.data ?? [];
  const allChallenges = allChallengeResult.data ?? [];
  const currentTrainingRows = allTraining.filter((row) => row.user_id === userId);
  const currentChallengeRows = allChallenges.filter((row) => row.user_id === userId);
  const snapshots = buildLeaderboardSnapshots(allProfiles, allTraining, allChallenges);

  return {
    player: mapProfile(profileResult.data, currentTrainingRows, currentChallengeRows),
    quotes: (quoteResult.data ?? []).map((row) => row.quote),
    customChallenges: (coachChallengeResult.data ?? []).map(mapCoachChallenge),
    weeklyLeaderboard: buildLeaderboardFromSnapshots("weekly", snapshots, userId, todayKey),
    monthlyLeaderboard: buildLeaderboardFromSnapshots("monthly", snapshots, userId, todayKey),
    activeUsers: activeUsersResult.count ?? allProfiles.length,
  };
}

function createCoachChallenge(title: string, description: string, focus: string): Challenge {
  const stamp = Date.now();

  return {
    id: `coach-${stamp}`,
    title,
    description,
    target: focus,
    xp: 130,
    levelRequired: 2,
    difficulty: "Coach Pick",
    coachNote: "Coach panel challenge. Award progress only after the player completes the full task honestly.",
    rewardText: "Coach Pick badge unlocked.",
    badge: {
      id: `coach-badge-${stamp}`,
      label: "Coach Pick",
      description: `${title} completed with strong effort.`,
      rarity: "Legendary",
      accent: "gold",
    },
  };
}

export function SupabaseAppStateProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [quotes, setQuotes] = useState<string[]>(DEFAULT_QUOTES);
  const [customChallenges, setCustomChallenges] = useState<Challenge[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<RankedPlayer[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<RankedPlayer[]>([]);
  const [currentWeeklyRank, setCurrentWeeklyRank] = useState<RankedPlayer | null>(null);
  const [currentMonthlyRank, setCurrentMonthlyRank] = useState<RankedPlayer | null>(null);
  const [activeUsers, setActiveUsers] = useState(0);

  const todayKey = getTodayKey();
  const todayPlan = getTrainingPlanForDate(todayKey);

  const resetSignedOutState = () => {
    setPlayer(null);
    setQuotes(DEFAULT_QUOTES);
    setCustomChallenges([]);
    setWeeklyLeaderboard([]);
    setMonthlyLeaderboard([]);
    setCurrentWeeklyRank(null);
    setCurrentMonthlyRank(null);
    setActiveUsers(0);
  };

  const loadSignedInState = async (userId: string) => {
    setInitializing(true);

    try {
      const snapshot = await fetchRemoteSnapshot(userId, todayKey);
      setPlayer(snapshot.player);
      setQuotes(snapshot.quotes.length > 0 ? snapshot.quotes : DEFAULT_QUOTES);
      setCustomChallenges(snapshot.customChallenges);
      setWeeklyLeaderboard(snapshot.weeklyLeaderboard.topTen);
      setMonthlyLeaderboard(snapshot.monthlyLeaderboard.topTen);
      setCurrentWeeklyRank(snapshot.weeklyLeaderboard.currentUser);
      setCurrentMonthlyRank(snapshot.monthlyLeaderboard.currentUser);
      setActiveUsers(snapshot.activeUsers);
      return true;
    } catch (error) {
      console.error("Unable to load Supabase app state", error);
      resetSignedOutState();
      return false;
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setInitializing(false);
      return;
    }

    const supabaseClient = supabase;
    let active = true;

    const bootstrap = async () => {
      const { data, error } = await supabaseClient.auth.getSession();

      if (!active) {
        return;
      }

      if (error || !data.session?.user) {
        setCurrentUserId(null);
        resetSignedOutState();
        setInitializing(false);
        return;
      }

      setCurrentUserId(data.session.user.id);
      await loadSignedInState(data.session.user.id);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      if (!session?.user) {
        setCurrentUserId(null);
        resetSignedOutState();
        setInitializing(false);
        return;
      }

      setCurrentUserId(session.user.id);
      void loadSignedInState(session.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [todayKey]);

  const todayCompletedTaskIds = player
    ? player.trainingLog
        .filter(
          (entry) => entry.dateKey === todayKey && entry.taskId !== "session-bonus" && !entry.taskId.startsWith("consistency-"),
        )
        .map((entry) => entry.taskId)
    : [];
  const levelInfo = player ? getLevelInfo(player.totalXp) : getLevelInfo(0);
  const streakDays = player ? calculateStreak(player.trainingLog, todayKey) : 0;
  const allChallenges = useMemo(() => [...BASE_CHALLENGES, ...customChallenges], [customChallenges]);
  const todayQuote = getQuoteOfTheDay(quotes.length > 0 ? quotes : DEFAULT_QUOTES, todayKey);

  const login = async (identifier: string, password: string) => {
    if (!supabase) {
      return { ok: false, message: "Supabase is not configured." };
    }

    const email = identifier.trim();

    if (!email.includes("@")) {
      return { ok: false, message: "Use the email address linked to the player account." };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { ok: false, message: formatSupabaseError(error.message) };
    }

    return { ok: true, message: "Welcome back. Your training world is ready." };
  };

  const signUp = async (username: string, password: string, avatarId: string, email?: string) => {
    if (!supabase) {
      return { ok: false, message: "Supabase is not configured." };
    }

    const cleanUsername = username.trim();
    const cleanEmail = email?.trim() ?? "";

    if (cleanUsername.length < 2 || cleanUsername.length > 24) {
      return { ok: false, message: "Choose a player name between 2 and 24 characters." };
    }

    if (!cleanEmail.includes("@")) {
      return { ok: false, message: "Add a real email address for the player account." };
    }

    if (password.trim().length < 6) {
      return { ok: false, message: "Use a password with at least 6 characters." };
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
          avatar_id: avatarId,
        },
      },
    });

    if (error) {
      return { ok: false, message: formatSupabaseError(error.message) };
    }

    if (!data.session) {
      return {
        ok: true,
        message: "Account created. Check your email to confirm the player account if confirmations are enabled.",
        requiresVerification: true,
      };
    }

    return { ok: true, message: "Account created. Time to start your academy journey." };
  };

  const logout = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setCurrentUserId(null);
    resetSignedOutState();
  };

  const completeTrainingTask = async (taskId: string) => {
    if (!supabase || !currentUserId || !player) {
      return { ok: false, message: "Log in first to save your training." };
    }

    const task = todayPlan.tasks.find((entry) => entry.id === taskId);
    if (!task) {
      return { ok: false, message: "That drill is not in today's plan." };
    }

    const { error } = await supabase.rpc("complete_training_task", {
      session_task_ids_input: todayPlan.tasks.map((entry) => entry.id),
      task_id_input: task.id,
      task_title_input: task.title,
      training_date_input: todayKey,
      xp_input: task.xp,
    });

    if (error) {
      return { ok: false, message: formatSupabaseError(error.message) };
    }

    await loadSignedInState(currentUserId);
    return { ok: true, message: `${task.title} completed. XP earned through real practice.` };
  };

  const completeChallenge = async (challengeId: string) => {
    if (!supabase || !currentUserId || !player) {
      return { ok: false, message: "Log in first to save your challenge." };
    }

    const challenge = allChallenges.find((entry) => entry.id === challengeId);
    if (!challenge) {
      return { ok: false, message: "That challenge could not be found." };
    }

    const { error } = await supabase.rpc("complete_challenge", {
      badge_input: challenge.badge,
      challenge_id_input: challenge.id,
      completed_on_input: todayKey,
      level_required_input: challenge.levelRequired,
      title_input: challenge.title,
      xp_input: challenge.xp,
    });

    if (error) {
      return { ok: false, message: formatSupabaseError(error.message) };
    }

    await loadSignedInState(currentUserId);
    return { ok: true, message: `${challenge.title} completed. Badge unlocked.` };
  };

  const addCoachQuote = async (quote: string) => {
    if (!supabase || !currentUserId) {
      return { ok: false, message: "Log in first to use the coach panel." };
    }

    const cleanQuote = quote.trim();

    if (!cleanQuote) {
      return { ok: false, message: "Write a motivational quote first." };
    }

    const { error } = await supabase.from("coach_quotes").insert({
      created_by: currentUserId,
      quote: cleanQuote,
    });

    if (error) {
      return { ok: false, message: formatSupabaseError(error.message) };
    }

    await loadSignedInState(currentUserId);
    return { ok: true, message: "New motivational quote added to the daily rotation." };
  };

  const addCoachChallenge = async (title: string, description: string, focus: string) => {
    if (!supabase || !currentUserId) {
      return { ok: false, message: "Log in first to use the coach panel." };
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanFocus = focus.trim();

    if (!cleanTitle || !cleanDescription || !cleanFocus) {
      return { ok: false, message: "Add a title, challenge idea, and target before publishing." };
    }

    const challenge = createCoachChallenge(cleanTitle, cleanDescription, cleanFocus);
    const { error } = await supabase.from("coach_challenges").insert({
      badge: challenge.badge,
      coach_note: challenge.coachNote,
      created_by: currentUserId,
      description: challenge.description,
      difficulty: challenge.difficulty,
      id: challenge.id,
      level_required: challenge.levelRequired,
      reward_text: challenge.rewardText,
      target: challenge.target,
      title: challenge.title,
      xp: challenge.xp,
    });

    if (error) {
      return { ok: false, message: formatSupabaseError(error.message) };
    }

    await loadSignedInState(currentUserId);
    return { ok: true, message: "New coach challenge published for the academy." };
  };

  const refreshLeaderboard = async () => {
    if (!currentUserId) {
      return { ok: false, message: "Log in first to refresh rankings." };
    }

    const loaded = await loadSignedInState(currentUserId);

    if (!loaded) {
      return { ok: false, message: "The live rankings could not be refreshed right now." };
    }

    return { ok: true, message: "Live rankings refreshed." };
  };

  const value = useMemo(
    () => ({
      initializing,
      usesSupabase: true,
      requiresEmailAuth: true,
      player,
      todayKey,
      todayPlan,
      todayQuote,
      todayCompletedTaskIds,
      levelInfo,
      streakDays,
      allChallenges,
      weeklyLeaderboard,
      monthlyLeaderboard,
      currentWeeklyRank,
      currentMonthlyRank,
      activeUsers,
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
      activeUsers,
      allChallenges,
      currentMonthlyRank,
      currentWeeklyRank,
      initializing,
      levelInfo,
      monthlyLeaderboard,
      player,
      streakDays,
      todayCompletedTaskIds,
      todayKey,
      todayPlan,
      todayQuote,
      weeklyLeaderboard,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
