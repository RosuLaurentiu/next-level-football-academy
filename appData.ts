import type {
  AvatarOption,
  Badge,
  Challenge,
  LeaderboardProfileSnapshot,
  LevelInfo,
  PlayerProfile,
  RankedPlayer,
  StoredAppState,
  TrainingLogEntry,
  TrainingPlan,
  TrainingTask,
  TrainingTaskStep,
} from "./types";

export const SESSION_BONUS_XP = 60;
export const CONSISTENCY_BONUS_XP = 120;

export const AVATARS: AvatarOption[] = [
  { id: "rocket", label: "Rachetă", initials: "RK", accent: "orange", glow: "#ff9a1f" },
  { id: "falcon", label: "Șoim", initials: "FC", accent: "green", glow: "#18c67b" },
  { id: "storm", label: "Furtună", initials: "ST", accent: "blue", glow: "#2c6bff" },
  { id: "lion", label: "Leu", initials: "LN", accent: "gold", glow: "#ffc629" },
];

export const LEVELS = [
  { level: 1, title: "Rookie de acasă", minXp: 0, nextXp: 120 },
  { level: 2, title: "Constructor de atingeri", minXp: 120, nextXp: 280 },
  { level: 3, title: "Playmaker de cartier", minXp: 280, nextXp: 500 },
  { level: 4, title: "Căpitanul antrenamentului", minXp: 500, nextXp: 780 },
  { level: 5, title: "Liderul academiei", minXp: 780, nextXp: 1120 },
  { level: 6, title: "Schimbător de joc", minXp: 1120, nextXp: 1500 },
  { level: 7, title: "Steaua Next Level", minXp: 1500, nextXp: null },
];

function createMentalTask(
  id: string,
  title: string,
  duration: string,
  focus: string,
  description: string,
  exerciseType: TrainingTask["exerciseType"],
): TrainingTask {
  return {
    id,
    category: "Mental",
    title,
    duration,
    focus,
    description,
    exerciseType,
    steps: [
      {
        title: "Exercițiul mental",
        description,
      },
    ],
    xp: 25,
    accent: "blue",
  };
}

function mapSteps(steps: string[], labels: string[]): TrainingTaskStep[] {
  return steps.map((description, index) => ({
    title: labels[index] ?? `Pasul ${index + 1}`,
    description,
  }));
}

function createPhysicalTask(
  id: string,
  title: string,
  duration: string,
  focus: string,
  description: string,
  steps: string[],
): TrainingTask {
  return {
    id,
    category: "Fizic",
    title,
    duration,
    focus,
    description,
    steps: mapSteps(steps, ["Tehnică lentă", "Repetare", "Viteză", "Reacție / coordonare"]),
    xp: 35,
    accent: "orange",
  };
}

function createTechnicalTask(
  id: string,
  title: string,
  duration: string,
  focus: string,
  description: string,
  steps: string[],
): TrainingTask {
  return {
    id,
    category: "Tehnic",
    title,
    duration,
    focus,
    description,
    steps: mapSteps(steps, ["Repetare", "Complexitate", "Viteză", "Provocare cognitivă"]),
    xp: 45,
    accent: "green",
  };
}

export const TRAINING_PLANS: TrainingPlan[] = [
  {
    id: "control-complet",
    title: "Sesiunea Control Complet",
    theme: "Focus clar, corp pregătit și control fin al mingii.",
    spotlight: "Astăzi construiești liniște, ritm și atingeri de calitate.",
    tasks: [
      createMentalTask(
        "mental-respiratie",
        "Respirație de campion",
        "4 min",
        "Calm, încredere și control emoțional",
        "Respiră 4 secunde, ține 2 secunde, expiră 4 secunde și repetă de 6 ori imaginându-ți primele atingeri perfecte.",
        "Respirație",
      ),
      createPhysicalTask(
        "fizic-pasi-activi",
        "Motorul corpului",
        "7 min",
        "Postură, coordonare și reacție",
        "Îți pregătești corpul pentru pași rapizi și mișcări curate.",
        [
          "Tehnică lentă: mers activ pe vârfuri cu brațele controlate timp de 45 de secunde.",
          "Repetare: 3 runde de genunchi sus și fandări scurte pe distanță mică.",
          "Viteză: 4 sprinturi scurte de 5 metri cu oprire controlată.",
          "Reacție și coordonare: schimbă direcția la fiecare semnal imaginar stânga-dreapta.",
        ],
      ),
      createTechnicalTask(
        "tehnic-atingeri-fine",
        "Atingeri de elită",
        "12 min",
        "Control apropiat și ritm cu mingea",
        "Lucrezi cu mingea aproape de tine și ridici nivelul la fiecare pas.",
        [
          "Repetare: 40 de atingeri interior-exterior cu fiecare picior.",
          "Complexitate: intră și ieși dintre 4 marcaje păstrând mingea sub control.",
          "Viteză: 5 runde rapide de 20 de secunde cu atingeri dese.",
          "Provocare cognitivă: alternează piciorul de fiecare dată când schimbi direcția.",
        ],
      ),
    ],
  },
  {
    id: "viteza-si-viziune",
    title: "Sesiunea Viteză și Viziune",
    theme: "Minte limpede, picioare active și decizii rapide.",
    spotlight: "Jucătorii buni văd și execută mai repede decât ceilalți.",
    tasks: [
      createMentalTask(
        "mental-vizualizare",
        "Vizualizare de joc",
        "3 min",
        "Încredere și concentrare",
        "Închide ochii și imaginează-ți 3 acțiuni reușite: o preluare bună, o schimbare de direcție și o finalizare curată.",
        "Vizualizare",
      ),
      createPhysicalTask(
        "fizic-reactie",
        "Picioare rapide",
        "8 min",
        "Alergare, coordonare și reacție",
        "Îți încălzești corpul ca să poți accelera și reacționa instant.",
        [
          "Tehnică lentă: pași mici pe loc cu spatele drept și brațele active.",
          "Repetare: 3 runde de sărituri laterale și pași înapoi controlat.",
          "Viteză: 5 accelerări scurte de 6 metri cu revenire relaxată.",
          "Reacție și coordonare: schimbă modelul de pași la fiecare număr rostit în minte de la 1 la 4.",
        ],
      ),
      createTechnicalTask(
        "tehnic-pasa-si-scanare",
        "Pasă și scanare",
        "11 min",
        "Pase curate și decizii rapide",
        "Îți antrenezi pasarea, orientarea corpului și mintea de joc.",
        [
          "Repetare: 20 de pase la perete cu piciorul puternic și 20 cu piciorul slab.",
          "Complexitate: preia lateral după fiecare pasă și schimbă unghiul.",
          "Viteză: joacă 3 serii rapide de câte 30 de secunde fără pauză lungă.",
          "Provocare cognitivă: spune în minte stânga sau dreapta înainte de fiecare preluare și execută exact direcția aleasă.",
        ],
      ),
    ],
  },
  {
    id: "curaj-si-ritm",
    title: "Sesiunea Curaj și Ritm",
    theme: "Respirație bună, corp stabil și mingea lipită de picior.",
    spotlight: "Curajul crește atunci când repeți corect și cu energie.",
    tasks: [
      createMentalTask(
        "mental-dialog-pozitiv",
        "Vocea campionului",
        "5 min",
        "Dialog pozitiv și disciplină emoțională",
        "Spune de 5 ori: Sunt calm, sunt rapid, sunt pregătit. Apoi începe cu zâmbet și energie.",
        "Dialog pozitiv",
      ),
      createPhysicalTask(
        "fizic-echilibru",
        "Echilibru de fotbalist",
        "6 min",
        "Postură și calitatea mișcării",
        "Îți stabilizezi corpul pentru întoarceri și opriri curate.",
        [
          "Tehnică lentă: echilibru pe un picior câte 20 de secunde pe fiecare parte.",
          "Repetare: 3 runde de fandări laterale și genuflexiuni controlate.",
          "Viteză: 4 serii de pași rapizi înainte-înapoi.",
          "Reacție și coordonare: sari lateral și oprește-te imediat în poziție stabilă.",
        ],
      ),
      createTechnicalTask(
        "tehnic-dublu-control",
        "Dublu control",
        "13 min",
        "Mingea aproape, viteză și inteligență",
        "Construiești controlul în spațiu mic și ridici ritmul până la nivel de joc.",
        [
          "Repetare: 50 de atingeri scurte cu alternarea picioarelor.",
          "Complexitate: adaugă întoarceri și schimbări de sens printre 4 jaloane.",
          "Viteză: 4 runde de câte 25 de secunde cu dribling rapid.",
          "Provocare cognitivă: la fiecare a treia atingere schimbi piciorul și direcția fără oprire.",
        ],
      ),
    ],
  },
];

export const DEFAULT_QUOTES = [
  "Campionii cresc atunci când nimeni nu se uită.",
  "Fiecare atingere curată de azi îți construiește încrederea pentru mâine.",
  "Spațiile mici pot crea abilități uriașe de fotbal.",
  "Efortul este superputerea ta atunci când antrenamentul devine greu.",
  "Antrenează-te cu focus și jocul tău va străluci la meci.",
  "Piciorul tău mai slab devine mai puternic cu fiecare încercare curajoasă.",
];

const STREAK_BADGE: Badge = {
  id: "streak-keeper",
  label: "Păstrătorul seriei",
  description: "Câștigată pentru o serie de 7 zile de antrenament.",
  rarity: "Epică",
  accent: "gold",
};

const DRILL_BADGE: Badge = {
  id: "drill-machine",
  label: "Mașina de exerciții",
  description: "Câștigată pentru completarea a 20 de module de antrenament.",
  rarity: "Rară",
  accent: "blue",
};

const CHALLENGE_BADGE: Badge = {
  id: "challenge-hunter",
  label: "Vânător de provocări",
  description: "Câștigată pentru completarea a 3 provocări de fotbal.",
  rarity: "Rară",
  accent: "orange",
};

export const BASE_CHALLENGES: Challenge[] = [
  {
    id: "touch-100",
    title: "Provocarea 100 de atingeri",
    description: "Ajungi la 100 de atingeri controlate fără să lași mingea să fugă prea departe.",
    target: "Scor măsurabil: 100 de atingeri apropiate într-o rundă concentrată",
    duration: "5-8 min",
    xp: 80,
    levelRequired: 1,
    difficulty: "Starter",
    coachNote: "Ține genunchii flexați și atinge mingea ușor.",
    rewardText: "Bonus XP și impact în clasament dacă termini provocarea.",
    badge: {
      id: "touch-collector",
      label: "Colecționarul de atingeri",
      description: "A terminat provocarea 100 de atingeri.",
      rarity: "Rară",
      accent: "green",
    },
  },
  {
    id: "weak-foot",
    title: "Constructorul piciorului slab",
    description: "Folosește piciorul mai slab pentru pase, întoarceri și finalizări într-o rundă completă.",
    target: "Scor măsurabil: 20 de pase și 10 driblinguri cu piciorul mai slab",
    duration: "8-12 min",
    xp: 95,
    levelRequired: 2,
    difficulty: "Talentat",
    coachNote: "E în regulă să mergi mai încet. Contactul curat contează mai mult decât viteza.",
    rewardText: "Bonus XP mare și progres real pentru ambele picioare.",
    badge: {
      id: "brave-boot",
      label: "Gheata curajoasă",
      description: "A terminat o provocare completă cu piciorul mai slab.",
      rarity: "Rară",
      accent: "orange",
    },
  },
  {
    id: "juggling-club",
    title: "Clubul jongleriilor",
    description: "Construiește ritm și răbdare ținând mingea în aer cu control calm.",
    target: "Scor măsurabil: o serie maximă de 12 jonglerii",
    duration: "6-10 min",
    xp: 110,
    levelRequired: 2,
    difficulty: "Talentat",
    coachNote: "Folosește șireturile și ține privirea relaxată, nu rigidă.",
    rewardText: "Bonus XP și o insignă care arată control adevărat.",
    badge: {
      id: "air-master",
      label: "Maestrul aerului",
      description: "A arătat control excelent la jonglerii.",
      rarity: "Epică",
      accent: "blue",
    },
  },
  {
    id: "speed-dribble",
    title: "Dribling turbo pe viteză",
    description: "Driblează printr-un culoar scurt în viteză, păstrând fiecare întoarcere curată.",
    target: "Scor măsurabil: 6 curse de dribling rapid cu control total",
    duration: "10-15 min",
    xp: 120,
    levelRequired: 3,
    difficulty: "Avansat",
    coachNote: "Împinge mingea în spațiu doar dacă încă o poți prinde sub control.",
    rewardText: "Bonus XP mare și efect direct în clasament.",
    badge: {
      id: "turbo-dribbler",
      label: "Dribleur turbo",
      description: "A terminat o provocare rapidă de control.",
      rarity: "Epică",
      accent: "gold",
    },
  },
  {
    id: "wall-passing",
    title: "Asul paselor la perete",
    description: "Lucrează la perete până când ritmul paselor devine fluid și repetabil.",
    target: "Scor măsurabil: 50 de pase exacte la perete cu ambele picioare",
    duration: "12-20 min",
    xp: 125,
    levelRequired: 3,
    difficulty: "Avansat",
    coachNote: "Primește din timp, apoi pregătește imediat următoarea pasă.",
    rewardText: "Bonus XP premium și impact real în top.",
    badge: {
      id: "rhythm-passer",
      label: "Pasatorul de ritm",
      description: "A construit ritm la pasă și o primă atingere curată.",
      rarity: "Epică",
      accent: "green",
    },
  },
];

const WEEKLY_RIVALS = [
  { username: "Mila", avatarId: "lion", xp: 190, streak: 6 },
  { username: "Noah", avatarId: "storm", xp: 175, streak: 5 },
  { username: "Ava", avatarId: "rocket", xp: 168, streak: 4 },
  { username: "Leo", avatarId: "falcon", xp: 160, streak: 3 },
  { username: "Zara", avatarId: "lion", xp: 154, streak: 5 },
  { username: "Owen", avatarId: "storm", xp: 148, streak: 4 },
  { username: "Sofia", avatarId: "rocket", xp: 142, streak: 2 },
  { username: "Eli", avatarId: "falcon", xp: 135, streak: 4 },
  { username: "Ruby", avatarId: "lion", xp: 128, streak: 3 },
  { username: "Kai", avatarId: "rocket", xp: 121, streak: 2 },
];

const MONTHLY_RIVALS = [
  { username: "Mila", avatarId: "lion", xp: 1180, streak: 12 },
  { username: "Noah", avatarId: "storm", xp: 1105, streak: 10 },
  { username: "Ava", avatarId: "rocket", xp: 1020, streak: 9 },
  { username: "Leo", avatarId: "falcon", xp: 950, streak: 8 },
  { username: "Zara", avatarId: "lion", xp: 920, streak: 8 },
  { username: "Owen", avatarId: "storm", xp: 880, streak: 7 },
  { username: "Sofia", avatarId: "rocket", xp: 835, streak: 6 },
  { username: "Eli", avatarId: "falcon", xp: 790, streak: 7 },
  { username: "Ruby", avatarId: "lion", xp: 760, streak: 5 },
  { username: "Kai", avatarId: "rocket", xp: 715, streak: 4 },
];

export function getAvatarOption(avatarId: string): AvatarOption {
  return AVATARS.find((avatar) => avatar.id === avatarId) ?? AVATARS[0];
}

export function getTodayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function getDaysBetween(laterDate: Date, earlierDate: Date): number {
  return Math.floor((startOfDay(laterDate) - startOfDay(earlierDate)) / 86400000);
}

export function formatLongDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString("ro-RO", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function getTrainingPlanForDate(dateKey: string): TrainingPlan {
  const date = parseDateKey(dateKey);
  const planIndex = date.getDay() % TRAINING_PLANS.length;
  return TRAINING_PLANS[planIndex];
}

function hashText(value: string): number {
  return value.split("").reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0);
}

export function getQuoteOfTheDay(quotes: string[], dateKey: string): string {
  return quotes[hashText(dateKey) % quotes.length];
}

export function getLevelInfo(totalXp: number): LevelInfo {
  const current = [...LEVELS].reverse().find((level) => totalXp >= level.minXp) ?? LEVELS[0];

  if (current.nextXp === null) {
    return {
      level: current.level,
      title: current.title,
      minXp: current.minXp,
      nextXp: null,
      progress: 100,
    };
  }

  const range = current.nextXp - current.minXp;
  const progress = Math.min(100, Math.round(((totalXp - current.minXp) / range) * 100));

  return {
    level: current.level,
    title: current.title,
    minXp: current.minXp,
    nextXp: current.nextXp,
    progress,
  };
}

export function calculateStreak(trainingLog: TrainingLogEntry[], todayKey: string): number {
  const uniqueDates = new Set(trainingLog.map((entry) => entry.dateKey));
  let streak = 0;
  let cursor = parseDateKey(todayKey);

  while (uniqueDates.has(getTodayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return streak;
}

export function calculateRecentXp(profile: PlayerProfile, days: number, todayKey: string): number {
  const today = parseDateKey(todayKey);
  const trainingXp = profile.trainingLog.reduce((total, entry) => {
    const difference = getDaysBetween(today, parseDateKey(entry.dateKey));
    return difference >= 0 && difference < days ? total + entry.xp : total;
  }, 0);

  const challengeXp = profile.challengeLog.reduce((total, entry) => {
    const difference = getDaysBetween(today, parseDateKey(entry.completedOn));
    return difference >= 0 && difference < days ? total + entry.xp : total;
  }, 0);

  return trainingXp + challengeXp;
}

function ensureBadge(badges: Badge[], badge: Badge): Badge[] {
  return badges.some((current) => current.id === badge.id) ? badges : [...badges, badge];
}

export function awardMilestoneBadges(profile: PlayerProfile, todayKey: string): PlayerProfile {
  let nextProfile = { ...profile, unlockedBadges: [...profile.unlockedBadges] };
  const streak = calculateStreak(nextProfile.trainingLog, todayKey);
  const taskCount = nextProfile.trainingLog.filter((entry) => entry.taskId !== "session-bonus").length;

  if (streak >= 7) {
    nextProfile = { ...nextProfile, unlockedBadges: ensureBadge(nextProfile.unlockedBadges, STREAK_BADGE) };
  }

  if (taskCount >= 20) {
    nextProfile = { ...nextProfile, unlockedBadges: ensureBadge(nextProfile.unlockedBadges, DRILL_BADGE) };
  }

  if (nextProfile.completedChallengeIds.length >= 3) {
    nextProfile = { ...nextProfile, unlockedBadges: ensureBadge(nextProfile.unlockedBadges, CHALLENGE_BADGE) };
  }

  return nextProfile;
}

export function createStarterStore(): StoredAppState {
  const createdAt = getTodayKey();
  const demoProfile: PlayerProfile = {
    username: "sam10",
    email: "sam10@example.com",
    avatarId: "rocket",
    role: "admin",
    isSuspended: false,
    totalXp: 150,
    completedChallengeIds: ["touch-100"],
    trainingLog: [
      { dateKey: createdAt, taskId: "mental-demo", taskTitle: "Respirație de campion", xp: 25 },
      { dateKey: createdAt, taskId: "fizic-demo", taskTitle: "Motorul corpului", xp: 35 },
      { dateKey: createdAt, taskId: "tehnic-demo", taskTitle: "Atingeri de elită", xp: 45 },
      { dateKey: createdAt, taskId: "session-bonus", taskTitle: "Bonus pentru sesiune completă", xp: 60 },
    ],
    challengeLog: [
      { completedOn: createdAt, challengeId: "touch-100", title: "Provocarea 100 de atingeri", xp: 80 },
    ],
    unlockedBadges: [
      {
        id: "touch-collector",
        label: "Colecționarul de atingeri",
        description: "A terminat provocarea 100 de atingeri.",
        rarity: "Rară",
        accent: "green",
      },
    ],
    consistencyRewardMilestones: [],
    createdAt,
  };

  return {
    users: [{ username: "sam10", password: "academy", avatarId: "rocket" }],
    profiles: { sam10: demoProfile },
    quotes: DEFAULT_QUOTES,
    customChallenges: [],
    leaderboardSeed: 0,
    activeUsers: 164,
  };
}

export function createPlayerProfile(username: string, avatarId: string): PlayerProfile {
  return {
    username,
    avatarId,
    role: "player",
    isSuspended: false,
    totalXp: 0,
    completedChallengeIds: [],
    trainingLog: [],
    challengeLog: [],
    unlockedBadges: [],
    consistencyRewardMilestones: [],
    createdAt: getTodayKey(),
  };
}

export function buildLeaderboard(
  mode: "weekly" | "monthly",
  profile: PlayerProfile,
  todayKey: string,
  leaderboardSeed: number,
): { topTen: RankedPlayer[]; currentUser: RankedPlayer } {
  const basePlayers = mode === "weekly" ? WEEKLY_RIVALS : MONTHLY_RIVALS;
  const userXp = mode === "weekly" ? calculateRecentXp(profile, 7, todayKey) : profile.totalXp;
  const userLevel = getLevelInfo(profile.totalXp).level;
  const userStreak = calculateStreak(profile.trainingLog, todayKey);

  const seededPlayers = basePlayers.map((player, index) => {
    const offset = (leaderboardSeed * 17 + index * 9) % (mode === "weekly" ? 20 : 48);
    const xp = player.xp + offset;

    return {
      username: player.username,
      avatarId: player.avatarId,
      xp,
      level: getLevelInfo(xp).level,
      streak: player.streak,
      isCurrentUser: false,
    };
  });

  const allPlayers = [
    ...seededPlayers,
    {
      username: profile.username,
      avatarId: profile.avatarId,
      xp: userXp,
      level: userLevel,
      streak: userStreak,
      isCurrentUser: true,
    },
  ]
    .sort((first, second) => second.xp - first.xp)
    .map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

  const currentUser = allPlayers.find((player) => player.isCurrentUser) as RankedPlayer;

  return {
    topTen: allPlayers.slice(0, 10),
    currentUser,
  };
}

export function buildLeaderboardFromSnapshots(
  mode: "weekly" | "monthly",
  snapshots: LeaderboardProfileSnapshot[],
  currentUserId: string,
  todayKey: string,
): { topTen: RankedPlayer[]; currentUser: RankedPlayer | null } {
  const allPlayers = snapshots
    .map((snapshot) => {
      const xp = mode === "weekly"
        ? calculateRecentXp(
            {
              userId: snapshot.userId,
              username: snapshot.username,
              avatarId: snapshot.avatarId,
              totalXp: snapshot.totalXp,
              completedChallengeIds: [],
              trainingLog: snapshot.trainingLog,
              challengeLog: snapshot.challengeLog,
              unlockedBadges: [],
              consistencyRewardMilestones: [],
              createdAt: todayKey,
            },
            7,
            todayKey,
          )
        : snapshot.totalXp;

      return {
        userId: snapshot.userId,
        username: snapshot.username,
        avatarId: snapshot.avatarId,
        xp,
        level: getLevelInfo(snapshot.totalXp).level,
        streak: calculateStreak(snapshot.trainingLog, todayKey),
        isCurrentUser: snapshot.userId === currentUserId,
      };
    })
    .sort((first, second) => second.xp - first.xp)
    .map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

  return {
    topTen: allPlayers.slice(0, 10),
    currentUser: allPlayers.find((player) => player.userId === currentUserId) ?? null,
  };
}
