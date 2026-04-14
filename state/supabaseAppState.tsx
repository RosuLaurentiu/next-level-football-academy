import {
  useEffect,
  useMemo,
  useRef,
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
  parseDateKey,
} from "../data/appData";
import { AppStateContext } from "./appStateContext";
import { supabase } from "../lib/supabaseClient";
import type {
  Badge,
  Challenge,
  LeaderboardProfileSnapshot,
  PlayerProfile,
  RankedPlayer,
  TrainingLogEntry,
  ChallengeLogEntry,
  TrainingPlan,
  TrainingTask,
} from "../data/types";

interface ProfileRow {
  user_id: string;
  username: string;
  email: string | null;
  avatar_id: string;
  role: "player" | "admin";
  is_suspended: boolean;
  total_xp: number;
  unlocked_badges: Badge[] | null;
  consistency_reward_milestones: number[] | null;
  created_at: string;
}

interface LeaderboardProfileRow {
  user_id: string;
  username: string;
  avatar_id: string;
  total_xp: number;
}

interface CoachQuoteRow {
  quote: string;
}

interface CoachChallengeRow {
  id: string;
  title: string;
  description: string;
  target: string;
  duration: string;
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
    return "Acest email și această parolă nu se potrivesc cu fișa noastră de antrenament.";
  }

  if (message.includes("User already registered")) {
    return "Acest email este deja pe foaia de echipă.";
  }

  if (message.includes("You must be logged in to save your training progress.")) {
    return "Autentifică-te mai întâi ca să-ți salvezi progresul la antrenament.";
  }

  if (message.includes("That drill is already completed for today.")) {
    return "Acest exercițiu este deja finalizat azi.";
  }

  if (message.includes("That challenge badge is already in your collection.")) {
    return "Insigna acestei provocări este deja în colecția ta.";
  }

  if (message.includes("Reach level")) {
    return message.replace("Reach level", "Ajungi la nivelul").replace("to unlock this challenge.", "ca să deblochezi această provocare.");
  }

  if (message.includes("Contul tau este suspendat")) {
    return "Contul tau este suspendat temporar. Cere ajutorul antrenorului.";
  }

  return message;
}

function toDateKey(value: string): string {
  return getTodayKey(new Date(value));
}

function mapDifficulty(value: string): Challenge["difficulty"] {
  if (value === "Starter" || value === "Skilled" || value === "Advanced" || value === "Coach Pick") {
    if (value === "Skilled") {
      return "Talentat";
    }

    if (value === "Advanced") {
      return "Avansat";
    }

    if (value === "Coach Pick") {
      return "Alegerea antrenorului";
    }

    return "Starter";
  }

  return "Alegerea antrenorului";
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
    duration: row.duration,
    xp: row.xp,
    levelRequired: row.level_required,
    difficulty: mapDifficulty(row.difficulty),
    coachNote: row.coach_note,
    rewardText: row.reward_text,
    badge: row.badge,
  };
}

function normaliseSteps(value: unknown): TrainingTask["steps"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return {
          title: "Pas",
          description: entry,
        };
      }

      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        const title = typeof record.title === "string" ? record.title.trim() : "";
        const description = typeof record.description === "string" ? record.description.trim() : "";
        const videoUrl = typeof record.videoUrl === "string" ? record.videoUrl.trim() : "";
        const fallbackVideo = typeof record.video_url === "string" ? record.video_url.trim() : "";

        return {
          title: title || "Pas",
          description: description || title || "",
          videoUrl: videoUrl || fallbackVideo || undefined,
        };
      }

      return null;
    })
    .filter((entry): entry is { title: string; description: string; videoUrl?: string } => Boolean(entry && entry.description));
}

function toDailyTask(value: unknown, fallbackAccent: "green" | "orange" | "blue" | "gold"): TrainingTask {
  const record = (value && typeof value === "object") ? (value as Record<string, unknown>) : {};

  return {
    id: String(record.id ?? `generated-${fallbackAccent}`),
    category: (record.category as TrainingTask["category"]) ?? "Mental",
    title: String(record.title ?? "Modulul zilei"),
    duration: String(record.duration ?? "0 min"),
    focus: String(record.focus ?? "Focus"),
    description: String(record.description ?? ""),
    steps: normaliseSteps(record.steps),
    videoUrl:
      (typeof record.videoUrl === "string" ? record.videoUrl : undefined) ??
      (typeof record.youtubeUrl === "string" ? record.youtubeUrl : undefined) ??
      (typeof record.youtube_url === "string" ? record.youtube_url : undefined),
    thumbnailUrl:
      (typeof record.thumbnailUrl === "string" ? record.thumbnailUrl : undefined) ??
      (typeof record.thumbnail_url === "string" ? record.thumbnail_url : undefined),
    exerciseType: record.exerciseType as TrainingTask["exerciseType"] | undefined,
    xp: Number(record.xp ?? 0),
    accent: (record.accent as TrainingTask["accent"]) ?? fallbackAccent,
  };
}

function toDailyChallenge(value: unknown): Challenge | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  return {
    id: String(record.id ?? "daily-challenge"),
    title: String(record.title ?? "Provocare bonus"),
    description: String(record.description ?? ""),
    target: String(record.target ?? ""),
    duration: typeof record.duration === "string" ? record.duration : "5-20 min",
    xp: Number(record.xp ?? 0),
    levelRequired: Number(record.levelRequired ?? 1),
    difficulty: (record.difficulty as Challenge["difficulty"]) ?? "Starter",
    coachNote: String(record.coachNote ?? ""),
    rewardText: String(record.rewardText ?? ""),
    badge: (record.badge as Badge) ?? {
      id: "daily-badge",
      label: "Insigna zilei",
      description: "Provocare zilnica finalizata.",
      rarity: "Rară",
      accent: "blue",
    },
  };
}

function buildLeaderboardSnapshots(
  profiles: LeaderboardProfileRow[],
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

function getDateKeyDaysAgo(baseDateKey: string, days: number): string {
  const date = parseDateKey(baseDateKey);
  date.setDate(date.getDate() - days);
  return getTodayKey(date);
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
    email: profile.email,
    avatarId: profile.avatar_id,
    role: profile.role,
    isSuspended: profile.is_suspended,
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
    throw new Error("Supabase nu este configurat.");
  }

  const leaderboardWindowStart = getDateKeyDaysAgo(todayKey, 29);

  const [
    profileResult,
    currentTrainingResult,
    currentChallengeResult,
    quoteResult,
    coachChallengeResult,
    leaderboardProfilesResult,
    recentTrainingResult,
    recentChallengeResult,
    dailyContentResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, username, email, avatar_id, role, is_suspended, total_xp, unlocked_badges, consistency_reward_milestones, created_at")
      .eq("user_id", userId)
      .single<ProfileRow>(),
    supabase
      .from("training_completions")
      .select("user_id, date_key, task_id, task_title, xp")
      .eq("user_id", userId)
      .order("date_key", { ascending: false })
      .returns<TrainingCompletionRow[]>(),
    supabase
      .from("challenge_completions")
      .select("user_id, challenge_id, title, xp, completed_on")
      .eq("user_id", userId)
      .order("completed_on", { ascending: false })
      .returns<ChallengeCompletionRow[]>(),
    supabase
      .from("coach_quotes")
      .select("quote")
      .order("created_at", { ascending: false })
      .returns<CoachQuoteRow[]>(),
    supabase
      .from("coach_challenges")
      .select("id, title, description, target, duration, xp, level_required, difficulty, coach_note, reward_text, badge")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .returns<CoachChallengeRow[]>(),
    supabase
      .from("profiles")
      .select("user_id, username, avatar_id, total_xp")
      .returns<LeaderboardProfileRow[]>(),
    supabase
      .from("training_completions")
      .select("user_id, date_key, task_id, task_title, xp")
      .gte("date_key", leaderboardWindowStart)
      .returns<TrainingCompletionRow[]>(),
    supabase
      .from("challenge_completions")
      .select("user_id, challenge_id, title, xp, completed_on")
      .gte("completed_on", leaderboardWindowStart)
      .returns<ChallengeCompletionRow[]>(),
    supabase.rpc("fetch_daily_training_content", {
      target_date: todayKey,
      force_regenerate: false,
    }),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (quoteResult.error) {
    throw new Error(quoteResult.error.message);
  }

  if (currentTrainingResult.error) {
    throw new Error(currentTrainingResult.error.message);
  }

  if (currentChallengeResult.error) {
    throw new Error(currentChallengeResult.error.message);
  }

  if (coachChallengeResult.error) {
    throw new Error(coachChallengeResult.error.message);
  }

  if (leaderboardProfilesResult.error) {
    throw new Error(leaderboardProfilesResult.error.message);
  }

  if (recentTrainingResult.error) {
    throw new Error(recentTrainingResult.error.message);
  }

  if (recentChallengeResult.error) {
    throw new Error(recentChallengeResult.error.message);
  }

  if (dailyContentResult.error) {
    throw new Error(dailyContentResult.error.message);
  }

  const leaderboardProfiles = leaderboardProfilesResult.data ?? [];
  const currentTrainingRows = currentTrainingResult.data ?? [];
  const currentChallengeRows = currentChallengeResult.data ?? [];
  const recentTrainingRows = recentTrainingResult.data ?? [];
  const recentChallengeRows = recentChallengeResult.data ?? [];
  const snapshots = buildLeaderboardSnapshots(leaderboardProfiles, recentTrainingRows, recentChallengeRows);
  const dailyRaw = (dailyContentResult.data ?? {}) as Record<string, unknown>;
  const mentalTask = toDailyTask(dailyRaw.mental, "blue");
  const physicalTask = toDailyTask(dailyRaw.physical, "orange");
  const technicalTask = toDailyTask(dailyRaw.technical, "green");
  const todayPlan: TrainingPlan = {
    id: `generated-${todayKey}`,
    title: "Sesiunea Zilei",
    theme: "Module generate automat de antrenor pentru toti jucatorii.",
    spotlight: "Urmeaza ordinea: Mental, Fizic, Tehnic, apoi provocare bonus.",
    tasks: [mentalTask, physicalTask, technicalTask],
  };
  const todayChallenge = toDailyChallenge(dailyRaw.challenge);

  return {
    player: mapProfile(profileResult.data, currentTrainingRows, currentChallengeRows),
    quotes: (quoteResult.data ?? []).map((row) => row.quote),
    customChallenges: (coachChallengeResult.data ?? []).map(mapCoachChallenge),
    todayPlan,
    todayChallenge,
    dailyLeaderboard: buildLeaderboardFromSnapshots("daily", snapshots, userId, todayKey),
    weeklyLeaderboard: buildLeaderboardFromSnapshots("weekly", snapshots, userId, todayKey),
    monthlyLeaderboard: buildLeaderboardFromSnapshots("monthly", snapshots, userId, todayKey),
  };
}

export function SupabaseAppStateProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [quotes, setQuotes] = useState<string[]>(DEFAULT_QUOTES);
  const [customChallenges, setCustomChallenges] = useState<Challenge[]>([]);
  const [generatedTodayPlan, setGeneratedTodayPlan] = useState<TrainingPlan | null>(null);
  const [todayChallenge, setTodayChallenge] = useState<Challenge | null>(null);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<RankedPlayer[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<RankedPlayer[]>([]);
  const [dailyLeaderboard, setDailyLeaderboard] = useState<RankedPlayer[]>([]);
  const [currentDailyRank, setCurrentDailyRank] = useState<RankedPlayer | null>(null);
  const [currentWeeklyRank, setCurrentWeeklyRank] = useState<RankedPlayer | null>(null);
  const [currentMonthlyRank, setCurrentMonthlyRank] = useState<RankedPlayer | null>(null);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayKey = getTodayKey();
  const fallbackPlan = getTrainingPlanForDate(todayKey);
  const todayPlan = generatedTodayPlan ?? fallbackPlan;

  const resetSignedOutState = () => {
    setPlayer(null);
    setQuotes(DEFAULT_QUOTES);
    setCustomChallenges([]);
    setGeneratedTodayPlan(null);
    setTodayChallenge(null);
    setDailyLeaderboard([]);
    setCurrentDailyRank(null);
    setWeeklyLeaderboard([]);
    setMonthlyLeaderboard([]);
    setCurrentWeeklyRank(null);
    setCurrentMonthlyRank(null);
  };

  const applySnapshot = (snapshot: Awaited<ReturnType<typeof fetchRemoteSnapshot>>) => {
    setPlayer(snapshot.player);
    setQuotes(snapshot.quotes.length > 0 ? snapshot.quotes : DEFAULT_QUOTES);
    setCustomChallenges(snapshot.customChallenges);
    setGeneratedTodayPlan(snapshot.todayPlan);
    setTodayChallenge(snapshot.todayChallenge);
    setDailyLeaderboard(snapshot.dailyLeaderboard.topTen);
    setCurrentDailyRank(snapshot.dailyLeaderboard.currentUser);
    setWeeklyLeaderboard(snapshot.weeklyLeaderboard.topTen);
    setMonthlyLeaderboard(snapshot.monthlyLeaderboard.topTen);
    setCurrentWeeklyRank(snapshot.weeklyLeaderboard.currentUser);
    setCurrentMonthlyRank(snapshot.monthlyLeaderboard.currentUser);
  };

  const loadSignedInState = async (userId: string) => {
    setInitializing(true);

    try {
      const snapshot = await fetchRemoteSnapshot(userId, todayKey);
      applySnapshot(snapshot);
      return true;
    } catch (error) {
      console.error("Nu s-a putut încărca starea aplicației din Supabase", error);
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

  useEffect(() => {
    if (!supabase || !currentUserId) {
      return;
    }

    const scheduleReload = () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }

      reloadTimerRef.current = setTimeout(() => {
        void loadSignedInState(currentUserId);
      }, 180);
    };

    const client = supabase;
    const channel = client
      .channel(`academy-live-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        scheduleReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "training_completions" },
        scheduleReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenge_completions" },
        scheduleReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coach_training_modules" },
        scheduleReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coach_challenges" },
        scheduleReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_training_content" },
        scheduleReload,
      )
      .subscribe();

    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
      void client.removeChannel(channel);
    };
  }, [currentUserId, todayKey]);

  const todayCompletedTaskIds = player
    ? player.trainingLog
        .filter(
          (entry) => entry.dateKey === todayKey && entry.taskId !== "session-bonus" && !entry.taskId.startsWith("consistency-"),
        )
        .map((entry) => entry.taskId)
    : [];
  const levelInfo = player ? getLevelInfo(player.totalXp) : getLevelInfo(0);
  const isAdmin = player?.role === "admin" && !player?.isSuspended;
  const streakDays = player ? calculateStreak(player.trainingLog, todayKey) : 0;
  const allChallenges = useMemo(() => [...BASE_CHALLENGES, ...customChallenges], [customChallenges]);
  const todayQuote = getQuoteOfTheDay(quotes.length > 0 ? quotes : DEFAULT_QUOTES, todayKey);

  const login = async (identifier: string, password: string) => {
    if (!supabase) {
      return { ok: false, message: "Supabase nu este configurat." };
    }

    const email = identifier.trim();

    if (!email.includes("@")) {
      return { ok: false, message: "Folosește adresa de email legată de contul jucătorului." };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { ok: false, message: formatSupabaseError(error.message) };
    }

    return { ok: true, message: "Bine ai revenit, campionule! Lumea ta de antrenament este pregătită." };
  };

  const signUp = async (username: string, password: string, avatarId: string, email?: string) => {
    if (!supabase) {
      return { ok: false, message: "Supabase nu este configurat." };
    }

    const cleanUsername = username.trim();
    const cleanEmail = email?.trim() ?? "";

    if (cleanUsername.length < 2 || cleanUsername.length > 24) {
      return { ok: false, message: "Alege un nume de jucător între 2 și 24 de caractere." };
    }

    if (!cleanEmail.includes("@")) {
      return { ok: false, message: "Adaugă o adresă reală de email pentru contul jucătorului." };
    }

    if (password.trim().length < 6) {
      return { ok: false, message: "Folosește o parolă cu cel puțin 6 caractere." };
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
        message: "Cont creat. Verifică emailul ca să confirmi contul jucătorului dacă este activată confirmarea.",
        requiresVerification: true,
      };
    }

    return { ok: true, message: "Cont creat. E timpul să începi aventura ta în academie." };
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
      return { ok: false, message: "Autentifică-te mai întâi ca să-ți salvezi antrenamentul." };
    }

    const previousTotalXp = player.totalXp;
    const previousLevelInfo = getLevelInfo(previousTotalXp);
    const task = todayPlan.tasks.find((entry) => entry.id === taskId);
    if (!task) {
      return { ok: false, message: "Acest exercițiu nu este în planul de azi." };
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

    try {
      const snapshot = await fetchRemoteSnapshot(currentUserId, todayKey);
      applySnapshot(snapshot);
      const gainedXp = Math.max(0, snapshot.player.totalXp - previousTotalXp);
      const newLevelInfo = getLevelInfo(snapshot.player.totalXp);
      return {
        ok: true,
        message: `${task.title} este finalizat. Ai câștigat puncte XP prin antrenament real!`,
        xpGained: gainedXp,
        leveledUp: newLevelInfo.level > previousLevelInfo.level,
        newLevel: newLevelInfo,
      };
    } catch (snapshotError) {
      console.error("Nu s-a putut reîncărca progresul după finalizarea modulului", snapshotError);
      await loadSignedInState(currentUserId);
      return {
        ok: true,
        message: `${task.title} este finalizat. Progresul va fi actualizat imediat ce conexiunea revine stabilă.`,
      };
    }
  };

  const completeChallenge = async (challengeId: string) => {
    if (!supabase || !currentUserId || !player) {
      return { ok: false, message: "Autentifică-te mai întâi ca să-ți salvezi provocarea." };
    }

    const previousTotalXp = player.totalXp;
    const previousLevelInfo = getLevelInfo(previousTotalXp);
    const challenge = allChallenges.find((entry) => entry.id === challengeId);
    if (!challenge) {
      return { ok: false, message: "Această provocare nu a putut fi găsită." };
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

    try {
      const snapshot = await fetchRemoteSnapshot(currentUserId, todayKey);
      applySnapshot(snapshot);
      const gainedXp = Math.max(0, snapshot.player.totalXp - previousTotalXp);
      const newLevelInfo = getLevelInfo(snapshot.player.totalXp);
      return {
        ok: true,
        message: `${challenge.title} este finalizată. Insignă deblocată!`,
        xpGained: gainedXp,
        leveledUp: newLevelInfo.level > previousLevelInfo.level,
        newLevel: newLevelInfo,
      };
    } catch (snapshotError) {
      console.error("Nu s-a putut reîncărca progresul după provocare", snapshotError);
      await loadSignedInState(currentUserId);
      return {
        ok: true,
        message: `${challenge.title} este finalizată. Progresul va fi actualizat imediat ce conexiunea revine stabilă.`,
      };
    }
  };

  const regenerateDailyContent = async (dateKey?: string) => {
    if (!supabase || !currentUserId) {
      return { ok: false, message: "Autentifică-te mai întâi ca să regenerezi ziua." };
    }

    const targetDate = dateKey ?? todayKey;
    const { error } = await supabase.rpc("fetch_daily_training_content", {
      target_date: targetDate,
      force_regenerate: true,
    });

    if (error) {
      return { ok: false, message: formatSupabaseError(error.message) };
    }

    await loadSignedInState(currentUserId);
    return { ok: true, message: `Conținutul zilei ${targetDate} a fost regenerat.` };
  };

  const refreshLeaderboard = async () => {
    if (!currentUserId) {
      return { ok: false, message: "Autentifică-te mai întâi ca să actualizezi clasamentele." };
    }

    const loaded = await loadSignedInState(currentUserId);

    if (!loaded) {
      return { ok: false, message: "Clasamentele live nu au putut fi actualizate acum." };
    }

    return { ok: true, message: "Clasamentele live au fost actualizate." };
  };

  const value = useMemo(
    () => ({
      initializing,
      usesSupabase: true,
      requiresEmailAuth: true,
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
      dailyLeaderboard,
      currentDailyRank,
      weeklyLeaderboard,
      monthlyLeaderboard,
      currentWeeklyRank,
      currentMonthlyRank,
      login,
      signUp,
      logout,
      completeTrainingTask,
      completeChallenge,
      regenerateDailyContent,
      refreshLeaderboard,
    }),
    [
      allChallenges,
      currentMonthlyRank,
      currentDailyRank,
      currentWeeklyRank,
      dailyLeaderboard,
      isAdmin,
      initializing,
      levelInfo,
      monthlyLeaderboard,
      player,
      streakDays,
      todayChallenge,
      todayCompletedTaskIds,
      todayKey,
      todayPlan,
      todayQuote,
      weeklyLeaderboard,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
