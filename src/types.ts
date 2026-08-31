export type PillarId = 'body' | 'mind' | 'heart' | 'soul';

export type UserRole = 'admin' | 'user';

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  teamId: string | null;
  goalPoints: number;
  leaderboardVisible: boolean;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// BODY — Move | Nourish | Hydrate | Recover
// ----------------------------------------------------------------------------
export interface BodyHabits {
  // Weekly qualifier (no daily points, tracked for the "2x/week" gate)
  strengthCardioCompleted: boolean;
  strengthCardioMinutes?: number;

  // Movement — 10 pts (10k+ = 10, 8k-9.99k = 5, below 8k = 0)
  stepsCount: number;

  // Nutrition — up to 10 pts (5 for following diet + 5 bonus for no-cheat day)
  nutritionCompleted: boolean;
  noCheatDay: boolean;
  nutritionNotes?: string;

  // Hydration — 7 pts (4L+ = 7, 3-3.99L = 4, below 3L = 0)
  hydrationLiters: number;

  // Sleep Duration — 7 pts (7.5+ = 7, 7.0-7.49 = 5, 6.5-6.99 = 2, below 6.5 = 0)
  sleepHours: number;

  // Sleep Discipline — 6 pts, based on bedtime (24h "HH:MM")
  bedTime?: string;
  wakeTime?: string;
}

// ----------------------------------------------------------------------------
// MIND — Learn | Grow | Disconnect
// ----------------------------------------------------------------------------
export interface MindHabits {
  // Meaningful Learning — 10 pts (45+ min = 10, else 0)
  learningMinutes: number;
  learningTopic?: string;

  // Screen Discipline — 10 pts (<2h = 10, 2-3h = 5, >3h = 0)
  screenHours: number;
  phoneFreeWindows: boolean; // no phone 30 min before sleep & after waking
  screenNotes?: string;
}

// ----------------------------------------------------------------------------
// HEART — Connect | Care | Give
// ----------------------------------------------------------------------------
export interface HeartHabits {
  // Family Connection — 10 pts (30+ min quality time = 10, else 0)
  familyMinutes: number;
  familyNotes?: string;
}

// ----------------------------------------------------------------------------
// SOUL — Pause | Breathe | Reconnect
// ----------------------------------------------------------------------------
export interface SoulHabits {
  // Meditation / Pranayama — 10 pts (45+ = 10, 30-44 = 5, below 30 = 0)
  meditationMinutes: number;
  meditationType?: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  userId?: string;
  body: BodyHabits;
  mind: MindHabits;
  heart: HeartHabits;
  soul: SoulHabits;
  notes?: string;
  updatedAt: string;
}

export interface GroupWorkout {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  title: string;
  groupName: string;
  durationMinutes: number;
  workoutType: string;
  isMorning: boolean; // required for the weekly +50 bonus
  notes?: string;
  createdAt: string;
}

export interface MonthlyCharityRecord {
  id: string;
  userId?: string;
  monthKey: string; // YYYY-MM
  completed: boolean;
  title: string;
  category: 'donation' | 'volunteering' | 'food_aid' | 'community' | 'other';
  amountOrHours?: string;
  notes?: string;
  completedDate: string; // YYYY-MM-DD
}

export type HealthReportSource = 'fitbit' | 'apple_health' | 'google_fit' | 'garmin' | 'other';

export interface HealthReport {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  source: HealthReportSource;
  storagePath: string;
  fileName: string;
  notes?: string;
  uploadedAt: string;
}

export type FeedPostKind = 'log' | 'complete_day' | 'streak' | 'workout' | 'charity';

export interface FeedReaction {
  id: string;
  postId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface FeedComment {
  id: string;
  postId: string;
  userId: string;
  fullName?: string;
  content: string;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  userId: string;
  fullName?: string;
  teamName?: string | null;
  date: string;
  totalScore: number;
  allDimensionsCompleted: boolean;
  kind: FeedPostKind;
  message: string;
  createdAt: string;
  reactions: FeedReaction[];
  comments: FeedComment[];
}

export interface PillarScoreBreakdown {
  bodyScore: number; // Max 40 (Movement 10 + Nutrition 10 + Hydration 7 + Sleep Dur 7 + Sleep Disc 6)
  mindScore: number; // Max 20 (Learning 10 + Screen 10)
  heartScore: number; // Max 10 (Family 10)
  soulScore: number; // Max 10 (Meditation 10)
  baseTotal: number; // Max 80
  completeDayBonus: number; // +5 if core requirement met in all 4 dimensions
  totalDailyScore: number; // Max 85 (excludes the weekly +50 morning workout bonus)
  allDimensionsCompleted: boolean; // Body+Mind+Heart+Soul each have >0 points today
  bodyDimensionMet: boolean;
  mindDimensionMet: boolean;
  heartDimensionMet: boolean;
  soulDimensionMet: boolean;
  completedItemsCount: number; // out of 9 scorable items
  totalItemsCount: number;
}

export interface Reflection {
  weekKey: string;
  content: string;
  updatedAt: string;
}

export interface WeeklyScoreBreakdown {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  daysLoggedCount: number;
  dailyPointsSum: number;
  dayBonusesSum: number;
  strengthCardioSessionsCount: number;
  strengthCardioQualifierMet: boolean; // >= 2 sessions of 45+ min
  morningWorkoutBonusEarned: boolean; // +50, capped once/week
  morningWorkoutBonusPoints: number;
  totalWeeklyScore: number;
  perfectDaysCount: number;
}

export interface IndividualLeaderboardEntry {
  userId: string;
  fullName: string;
  teamId: string | null;
  teamName: string | null;
  totalScore: number;
  bodyScore: number;
  mindScore: number;
  heartScore: number;
  soulScore: number;
  daysLogged: number;
  perfectDays: number;
  morningWorkoutWeeks: number;
  charityQualified: boolean;
  goalPoints: number;
  goalProgress: number; // 0-100
  disqualifiedWeeks: number; // weeks that failed the 2x strength/cardio qualifier
  balanceScore: number; // 0-100, avg of each pillar's % of its own max
  leaderboardVisible: boolean;
  rank: number;
}

export interface TeamLeaderboardEntry {
  teamId: string;
  teamName: string;
  memberCount: number;
  totalScore: number;
  averageScorePerMember: number;
  perfectDays: number;
  rank: number;
}
