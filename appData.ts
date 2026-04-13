import type {
  AvatarOption,
  Badge,
  Challenge,
  LevelInfo,
  PlayerProfile,
  RankedPlayer,
  StoredAppState,
  TrainingLogEntry,
  TrainingPlan,
} from "./types";

export const SESSION_BONUS_XP = 60;
export const CONSISTENCY_BONUS_XP = 120;

export const AVATARS: AvatarOption[] = [
  { id: "rocket", label: "Rocket", initials: "RK", accent: "orange", glow: "#ff9a1f" },
  { id: "falcon", label: "Falcon", initials: "FC", accent: "green", glow: "#18c67b" },
  { id: "storm", label: "Storm", initials: "ST", accent: "blue", glow: "#2c6bff" },
  { id: "lion", label: "Lion", initials: "LN", accent: "gold", glow: "#ffc629" },
];

export const LEVELS = [
  { level: 1, title: "Home Rookie", minXp: 0, nextXp: 120 },
  { level: 2, title: "Touch Builder", minXp: 120, nextXp: 280 },
  { level: 3, title: "Street Playmaker", minXp: 280, nextXp: 500 },
  { level: 4, title: "Training Captain", minXp: 500, nextXp: 780 },
  { level: 5, title: "Academy Leader", minXp: 780, nextXp: 1120 },
  { level: 6, title: "Match Changer", minXp: 1120, nextXp: 1500 },
  { level: 7, title: "Next Level Star", minXp: 1500, nextXp: null },
];

export const TRAINING_PLANS: TrainingPlan[] = [
  {
    id: "first-touch-flow",
    title: "First Touch Flow",
    theme: "Soft feet and sharp focus for total control.",
    spotlight: "Control the ball before it controls you.",
    tasks: [
      {
        id: "flow-warmup",
        category: "Warm-up",
        title: "Dynamic Ball Wake-Up",
        duration: "5 min",
        focus: "Activate hips and ankles",
        description: "Move around your space with the ball and wake up every touch.",
        steps: [
          "20 toe taps on the ball",
          "10 inside-outside touches each foot",
          "Fast side shuffles while keeping the ball close",
        ],
        xp: 25,
        accent: "green",
      },
      {
        id: "flow-control",
        category: "Ball Control",
        title: "Inside-Outside Maze",
        duration: "8 min",
        focus: "Change direction quickly",
        description: "Dribble through 4 objects and keep the ball within one step.",
        steps: [
          "Set up 4 markers in a zig-zag line",
          "Use only the inside and outside of one foot",
          "Repeat with your other foot and beat your first score",
        ],
        xp: 35,
        accent: "blue",
      },
      {
        id: "flow-passing",
        category: "Passing",
        title: "Wall Pass Rhythm",
        duration: "7 min",
        focus: "Pass and receive cleanly",
        description: "Pass against a wall or target and prepare your next touch early.",
        steps: [
          "Complete 20 passes with your strongest foot",
          "Complete 20 passes with your weaker foot",
          "Try 10 one-touch returns if space allows",
        ],
        xp: 30,
        accent: "orange",
      },
      {
        id: "flow-fitness",
        category: "Fitness",
        title: "Quick Feet Ladder",
        duration: "4 min",
        focus: "Explosive foot speed",
        description: "Use lines on the floor or imaginary ladder boxes for quick patterns.",
        steps: [
          "Two feet in every box for one round",
          "Sideways run for one round",
          "Single-leg hops and reset with balance",
        ],
        xp: 25,
        accent: "gold",
      },
      {
        id: "flow-bonus",
        category: "Bonus",
        title: "30-Second Juggle Burst",
        duration: "3 min",
        focus: "Confidence and calm touch",
        description: "Try to keep the ball bouncing without rushing.",
        steps: [
          "Attempt three 30-second rounds",
          "Catch the ball, reset, and stay relaxed",
          "Count your best streak for tomorrow",
        ],
        xp: 20,
        accent: "green",
      },
    ],
  },
  {
    id: "quick-feet-lab",
    title: "Quick Feet Lab",
    theme: "Speed, balance, and brave dribbling in small spaces.",
    spotlight: "Small touches create big moves.",
    tasks: [
      {
        id: "lab-warmup",
        category: "Warm-up",
        title: "Cone Circle Prep",
        duration: "5 min",
        focus: "Stay light on your toes",
        description: "Circle around your ball with playful steps before every move.",
        steps: [
          "Jog one lap around your practice area",
          "Perform 15 heel flicks and 15 high knees",
          "Finish with 20 quick toe taps on the ball",
        ],
        xp: 25,
        accent: "orange",
      },
      {
        id: "lab-control",
        category: "Ball Control",
        title: "Pull-Push Combo",
        duration: "7 min",
        focus: "Turn out of pressure",
        description: "Pull the ball back, push it away, and explode into open space.",
        steps: [
          "Do 12 pull-push turns with your right foot",
          "Do 12 pull-push turns with your left foot",
          "Finish with 6 quick turns around a marker",
        ],
        xp: 35,
        accent: "green",
      },
      {
        id: "lab-passing",
        category: "Passing",
        title: "Gate Passing",
        duration: "8 min",
        focus: "Accuracy and body shape",
        description: "Pass through a small gate using both feet and recover the ball quickly.",
        steps: [
          "Create a gate with two shoes or bottles",
          "Hit the gate 15 times with your strong foot",
          "Hit the gate 15 times with your weaker foot",
        ],
        xp: 30,
        accent: "blue",
      },
      {
        id: "lab-fitness",
        category: "Fitness",
        title: "Sprint and Stop",
        duration: "5 min",
        focus: "Explode then control",
        description: "Sprint for short distances and freeze in a strong football stance.",
        steps: [
          "Sprint 5 metres and stop under control",
          "Backpedal to the start",
          "Complete 6 strong rounds",
        ],
        xp: 25,
        accent: "gold",
      },
      {
        id: "lab-bonus",
        category: "Bonus",
        title: "Weak Foot Finisher",
        duration: "4 min",
        focus: "Bravery on your weaker side",
        description: "Use only your weaker foot to dribble around one object and finish at a target.",
        steps: [
          "Do 8 smooth dribble-and-finish reps",
          "Keep your head up before you strike",
          "Celebrate every clean contact",
        ],
        xp: 20,
        accent: "orange",
      },
    ],
  },
  {
    id: "passing-vision-day",
    title: "Passing Vision Day",
    theme: "Scan, shape, and pass with purpose.",
    spotlight: "Great passers see the next move early.",
    tasks: [
      {
        id: "vision-warmup",
        category: "Warm-up",
        title: "Shoulder Check Starter",
        duration: "4 min",
        focus: "Look before you move",
        description: "Practice checking left and right before every touch.",
        steps: [
          "Walk with the ball and look over each shoulder",
          "Add gentle dribbles while scanning",
          "Finish with 10 quick turns after a scan",
        ],
        xp: 20,
        accent: "blue",
      },
      {
        id: "vision-control",
        category: "Ball Control",
        title: "Open Body Receives",
        duration: "7 min",
        focus: "First touch into space",
        description: "Receive the ball from a wall or self-pass and turn out with your first touch.",
        steps: [
          "Self-pass and open your body to receive",
          "Guide the ball into a side lane",
          "Repeat 10 times on each side",
        ],
        xp: 35,
        accent: "green",
      },
      {
        id: "vision-passing",
        category: "Passing",
        title: "Pass-Move-Receive",
        duration: "8 min",
        focus: "Keep moving after the pass",
        description: "Every pass must be followed by a movement to a new angle.",
        steps: [
          "Pass to the wall or target",
          "Take two quick steps sideways",
          "Receive again and play the next pass",
        ],
        xp: 35,
        accent: "orange",
      },
      {
        id: "vision-fitness",
        category: "Fitness",
        title: "Core Balance Hold",
        duration: "4 min",
        focus: "Stay strong when turning",
        description: "Use simple football balance positions to build control.",
        steps: [
          "20-second plank hold",
          "10 side lunges each side",
          "10 single-leg balances while controlling the ball",
        ],
        xp: 20,
        accent: "gold",
      },
      {
        id: "vision-bonus",
        category: "Bonus",
        title: "Creative Pass Trick",
        duration: "4 min",
        focus: "Invent one clever pass",
        description: "Create your own pass move and repeat it until it feels smooth.",
        steps: [
          "Choose a fake or body movement",
          "Pass after the move with good balance",
          "Show it off tomorrow with more speed",
        ],
        xp: 25,
        accent: "green",
      },
    ],
  },
];

export const DEFAULT_QUOTES = [
  "Champions improve when nobody is watching.",
  "Every clean touch today builds your confidence for tomorrow.",
  "Small spaces can create huge football skills.",
  "Effort is your superpower when practice feels hard.",
  "Train with focus and your game will shine on match day.",
  "Your weaker foot becomes stronger every brave attempt.",
];

const STREAK_BADGE: Badge = {
  id: "streak-keeper",
  label: "Streak Keeper",
  description: "Earned for hitting a 7-day training streak.",
  rarity: "Epic",
  accent: "gold",
};

const DRILL_BADGE: Badge = {
  id: "drill-machine",
  label: "Drill Machine",
  description: "Earned for completing 20 training drills.",
  rarity: "Rare",
  accent: "blue",
};

const CHALLENGE_BADGE: Badge = {
  id: "challenge-hunter",
  label: "Challenge Hunter",
  description: "Earned for completing 3 football challenges.",
  rarity: "Rare",
  accent: "orange",
};

export const BASE_CHALLENGES: Challenge[] = [
  {
    id: "touch-100",
    title: "100 Touches Challenge",
    description: "Reach 100 controlled touches without letting the ball roll away too far.",
    target: "100 close touches in one focused round",
    xp: 80,
    levelRequired: 1,
    difficulty: "Starter",
    coachNote: "Keep your knees bent and use light contacts.",
    rewardText: "Earn the Touch Collector badge.",
    badge: {
      id: "touch-collector",
      label: "Touch Collector",
      description: "Completed the 100 touches challenge.",
      rarity: "Rare",
      accent: "green",
    },
  },
  {
    id: "weak-foot",
    title: "Weak Foot Builder",
    description: "Use your weaker foot for passing, turning, and finishing for one full round.",
    target: "20 passes and 10 dribbles with your weaker foot",
    xp: 95,
    levelRequired: 2,
    difficulty: "Skilled",
    coachNote: "Slow is okay. Clean contact matters more than speed.",
    rewardText: "Unlocks new confidence on both sides.",
    badge: {
      id: "brave-boot",
      label: "Brave Boot",
      description: "Completed a full weaker-foot challenge.",
      rarity: "Rare",
      accent: "orange",
    },
  },
  {
    id: "juggling-club",
    title: "Juggling Club",
    description: "Build rhythm and patience by keeping the ball in the air with calm control.",
    target: "Hit a best streak of 12 juggles",
    xp: 110,
    levelRequired: 2,
    difficulty: "Skilled",
    coachNote: "Use the laces and keep your eyes soft, not stiff.",
    rewardText: "Earn the Air Master badge.",
    badge: {
      id: "air-master",
      label: "Air Master",
      description: "Showed strong juggling control.",
      rarity: "Epic",
      accent: "blue",
    },
  },
  {
    id: "speed-dribble",
    title: "Speed Dribble Dash",
    description: "Dribble through a short lane at speed while keeping every turn clean.",
    target: "6 fast dribble runs with full control",
    xp: 120,
    levelRequired: 3,
    difficulty: "Advanced",
    coachNote: "Push the ball into space only when you can still catch it.",
    rewardText: "Unlocks the Turbo Dribbler badge.",
    badge: {
      id: "turbo-dribbler",
      label: "Turbo Dribbler",
      description: "Completed a fast control challenge.",
      rarity: "Epic",
      accent: "gold",
    },
  },
  {
    id: "wall-passing",
    title: "Wall Passing Pro",
    description: "Work against the wall until your passing tempo feels smooth and repeatable.",
    target: "50 accurate wall passes with both feet",
    xp: 125,
    levelRequired: 3,
    difficulty: "Advanced",
    coachNote: "Receive early, then prepare the next pass right away.",
    rewardText: "Earn the Rhythm Passer badge.",
    badge: {
      id: "rhythm-passer",
      label: "Rhythm Passer",
      description: "Built passing rhythm and clean first touch.",
      rarity: "Epic",
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
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
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
    avatarId: "rocket",
    totalXp: 150,
    completedChallengeIds: ["touch-100"],
    trainingLog: [
      { dateKey: createdAt, taskId: "starter-demo", taskTitle: "Demo Warm-Up", xp: 25 },
      { dateKey: createdAt, taskId: "session-bonus", taskTitle: "Full Session Bonus", xp: 60 },
    ],
    challengeLog: [
      { completedOn: createdAt, challengeId: "touch-100", title: "100 Touches Challenge", xp: 80 },
    ],
    unlockedBadges: [
      {
        id: "touch-collector",
        label: "Touch Collector",
        description: "Completed the 100 touches challenge.",
        rarity: "Rare",
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
