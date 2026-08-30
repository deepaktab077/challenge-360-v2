import { DailyLog, PillarScoreBreakdown } from '../types';

// ============================================================================
// 360° SEPTEMBER CHALLENGE — POINT SYSTEM
// ============================================================================

export const SCORING_RULES = {
  body: {
    title: 'Body',
    subtitle: 'Move | Nourish | Hydrate | Recover',
    maxPoints: 40,
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-800',
    accentColor: '#10b981',
    items: [
      {
        id: 'movement',
        label: 'Movement (Steps)',
        points: 10,
        description: '10,000+ = 10 pts · 8,000–9,999 = 5 pts · below 8,000 = 0 pts',
        unit: 'steps',
        iconName: 'Footprints',
      },
      {
        id: 'nutrition',
        label: 'Nutrition',
        points: 10,
        description: 'Follow your pre-decided healthy diet = 5 pts · No-Cheat Day = +5 bonus',
        unit: 'compliance',
        iconName: 'Salad',
      },
      {
        id: 'hydration',
        label: 'Hydration',
        points: 7,
        description: '4L+ = 7 pts · 3–3.99L = 4 pts · below 3L = 0 pts',
        unit: 'liters',
        iconName: 'Droplets',
      },
      {
        id: 'sleepDuration',
        label: 'Sleep Duration',
        points: 7,
        description: '7.5+ hrs = 7 · 7.0–7.29 hrs = 5 · 6.5–7.0 hrs = 2 · below 6.5 = 0',
        unit: 'hours',
        iconName: 'Moon',
      },
      {
        id: 'sleepDiscipline',
        label: 'Sleep Discipline',
        points: 6,
        description: 'By 10:00 PM = 6 · 10:01–10:15 = 4 · 10:16–10:30 = 2 · after 10:30 = 0',
        unit: 'schedule',
        iconName: 'Clock',
      },
    ],
    weeklyQualifier: {
      id: 'strengthCardio',
      label: 'Strength / Cardio',
      rule: 'Weekly qualifier — no points',
      description: 'Minimum 45-minute strength/cardio session at least 2x/week',
      iconName: 'Dumbbell',
    },
  },
  mind: {
    title: 'Mind',
    subtitle: 'Learn | Grow | Disconnect',
    maxPoints: 20,
    color: 'indigo',
    badgeBg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-800',
    accentColor: '#6366f1',
    items: [
      {
        id: 'learning',
        label: 'Meaningful Learning',
        points: 10,
        description: 'Minimum 45 minutes of reading, audiobook or educational podcast/video (news/current affairs does not qualify)',
        unit: 'minutes',
        iconName: 'BookOpen',
      },
      {
        id: 'screenDiscipline',
        label: 'Screen Discipline',
        points: 10,
        description: '<2 hrs/day = 10 · 2–3 hrs = 5 · >3 hrs = 0 · plus no phone 30 min before sleep & after waking',
        unit: 'hours',
        iconName: 'SmartphoneOff',
      },
    ],
  },
  heart: {
    title: 'Heart',
    subtitle: 'Connect | Care | Give',
    maxPoints: 10,
    color: 'rose',
    badgeBg: 'bg-rose-500/10 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-800',
    accentColor: '#f43f5e',
    items: [
      {
        id: 'familyConnection',
        label: 'Family Connection',
        points: 10,
        description: 'Minimum 30 minutes quality time with spouse/kids, ideally without phones/distractions',
        unit: 'minutes',
        iconName: 'HeartHandshake',
      },
    ],
    monthlyQualifier: {
      id: 'charity',
      label: 'Giving Back',
      rule: 'Monthly qualifier — required to appear on final leaderboard',
      description: 'Minimum one meaningful charity/community activity during September. No points tied to amount spent.',
      iconName: 'Gift',
    },
  },
  soul: {
    title: 'Soul',
    subtitle: 'Pause | Breathe | Reconnect',
    maxPoints: 10,
    color: 'amber',
    badgeBg: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-800',
    accentColor: '#f59e0b',
    items: [
      {
        id: 'meditationPranayam',
        label: 'Meditation / Pranayama',
        points: 10,
        description: '45+ min = 10 pts · 30–45 min = 5 pts · below 30 min = 0 pts',
        unit: 'minutes',
        iconName: 'Sparkles',
      },
    ],
  },
  bonuses: {
    completeDayBonus: {
      label: '360° Complete Day Bonus',
      points: 5,
      rule: 'Granted when the core requirement in all 4 dimensions (Body, Mind, Heart, Soul) is met on the same day.',
      description: 'Body ✓ Mind ✓ Heart ✓ Soul ✓ on the same day',
    },
    morningGroupWorkoutBonus: {
      label: 'Morning Group Workout Bonus',
      points: 50,
      unit: 'per week',
      rule: '+50 bonus points for a morning group workout on any one of 3 days. Applicable once a week only.',
      description: 'Weekly bonus, capped at one award per week',
    },
  },
} as const;

export const TOTAL_DAILY_ITEMS = 9; // scorable items (excludes weekly/monthly qualifiers)
export const MAX_DAILY_BASE_SCORE = 80;
export const COMPLETE_DAY_BONUS_POINTS = 5;
export const MAX_DAILY_TOTAL_SCORE = MAX_DAILY_BASE_SCORE + COMPLETE_DAY_BONUS_POINTS; // 85
export const MORNING_WORKOUT_BONUS_POINTS = 50;
export const STRENGTH_CARDIO_WEEKLY_MIN_SESSIONS = 2;
export const STRENGTH_CARDIO_MIN_MINUTES = 45;

// ----------------------------------------------------------------------------
// Per-item scoring functions
// ----------------------------------------------------------------------------

export function scoreMovement(steps: number): number {
  if (steps >= 10000) return 10;
  if (steps >= 8000) return 5;
  return 0;
}

export function scoreNutrition(dietFollowed: boolean, noCheatDay: boolean): number {
  let pts = 0;
  if (dietFollowed) pts += 5;
  if (noCheatDay) pts += 5;
  return Math.min(pts, 10);
}

export function scoreHydration(liters: number): number {
  if (liters >= 4) return 7;
  if (liters >= 3) return 4;
  return 0;
}

export function scoreSleepDuration(hours: number): number {
  if (hours >= 7.5) return 7;
  if (hours >= 7.0) return 5;
  if (hours >= 6.5) return 2;
  return 0;
}

/** bedTime is 24h "HH:MM". Anything from noon onward through midnight counts as
 * "PM"; after-midnight times (00:00–04:59) are treated as very late (0 pts). */
export function scoreSleepDiscipline(bedTime?: string): number {
  if (!bedTime) return 0;
  const [hRaw, mRaw] = bedTime.split(':').map(Number);
  if (Number.isNaN(hRaw) || Number.isNaN(mRaw)) return 0;

  // Normalize to minutes-after-10:00-PM for easy comparison. 22:00 = 0.
  // Treat 00:00-04:59 (past midnight) as very late bedtimes.
  let minutesFrom10pm: number;
  if (hRaw >= 22) {
    minutesFrom10pm = (hRaw - 22) * 60 + mRaw;
  } else if (hRaw < 5) {
    minutesFrom10pm = (24 - 22 + hRaw) * 60 + mRaw;
  } else {
    // Before 10 PM (e.g. 21:30) — still counts as "by 10:00 PM"
    minutesFrom10pm = -1;
  }

  if (minutesFrom10pm <= 0) return 6;
  if (minutesFrom10pm <= 15) return 4;
  if (minutesFrom10pm <= 30) return 2;
  return 0;
}

export function scoreLearning(minutes: number): number {
  return minutes >= 45 ? 10 : 0;
}

export function scoreScreenDiscipline(hours: number): number {
  if (hours < 2) return 10;
  if (hours <= 3) return 5;
  return 0;
}

export function scoreFamilyConnection(minutes: number): number {
  return minutes >= 30 ? 10 : 0;
}

export function scoreMeditation(minutes: number): number {
  if (minutes >= 45) return 10;
  if (minutes >= 30) return 5;
  return 0;
}

// ----------------------------------------------------------------------------
// Full daily breakdown
// ----------------------------------------------------------------------------

export function calculateDailyScore(log: DailyLog | null | undefined): PillarScoreBreakdown {
  if (!log) {
    return {
      bodyScore: 0,
      mindScore: 0,
      heartScore: 0,
      soulScore: 0,
      baseTotal: 0,
      completeDayBonus: 0,
      totalDailyScore: 0,
      allDimensionsCompleted: false,
      bodyDimensionMet: false,
      mindDimensionMet: false,
      heartDimensionMet: false,
      soulDimensionMet: false,
      completedItemsCount: 0,
      totalItemsCount: TOTAL_DAILY_ITEMS,
    };
  }

  const movementPts = scoreMovement(log.body?.stepsCount || 0);
  const nutritionPts = scoreNutrition(!!log.body?.nutritionCompleted, !!log.body?.noCheatDay);
  const hydrationPts = scoreHydration(log.body?.hydrationLiters || 0);
  const sleepDurationPts = scoreSleepDuration(log.body?.sleepHours || 0);
  const sleepDisciplinePts = scoreSleepDiscipline(log.body?.bedTime);
  const bodyScore = movementPts + nutritionPts + hydrationPts + sleepDurationPts + sleepDisciplinePts;

  const learningPts = scoreLearning(log.mind?.learningMinutes || 0);
  const screenPts = scoreScreenDiscipline(log.mind?.screenHours ?? 24);
  const mindScore = learningPts + screenPts;

  const familyPts = scoreFamilyConnection(log.heart?.familyMinutes || 0);
  const heartScore = familyPts;

  const meditationPts = scoreMeditation(log.soul?.meditationMinutes || 0);
  const soulScore = meditationPts;

  const baseTotal = bodyScore + mindScore + heartScore + soulScore;

  const bodyDimensionMet = bodyScore > 0;
  const mindDimensionMet = mindScore > 0;
  const heartDimensionMet = heartScore > 0;
  const soulDimensionMet = soulScore > 0;
  const allDimensionsCompleted = bodyDimensionMet && mindDimensionMet && heartDimensionMet && soulDimensionMet;
  const completeDayBonus = allDimensionsCompleted ? COMPLETE_DAY_BONUS_POINTS : 0;

  const totalDailyScore = baseTotal + completeDayBonus;

  const completedItems = [
    movementPts > 0,
    nutritionPts > 0,
    hydrationPts > 0,
    sleepDurationPts > 0,
    sleepDisciplinePts > 0,
    learningPts > 0,
    screenPts > 0,
    familyPts > 0,
    meditationPts > 0,
  ];
  const completedItemsCount = completedItems.filter(Boolean).length;

  return {
    bodyScore,
    mindScore,
    heartScore,
    soulScore,
    baseTotal,
    completeDayBonus,
    totalDailyScore,
    allDimensionsCompleted,
    bodyDimensionMet,
    mindDimensionMet,
    heartDimensionMet,
    soulDimensionMet,
    completedItemsCount,
    totalItemsCount: TOTAL_DAILY_ITEMS,
  };
}

export function createEmptyDailyLog(dateStr: string): DailyLog {
  return {
    date: dateStr,
    body: {
      strengthCardioCompleted: false,
      strengthCardioMinutes: 0,
      stepsCount: 0,
      nutritionCompleted: false,
      noCheatDay: false,
      nutritionNotes: '',
      hydrationLiters: 0,
      sleepHours: 0,
      bedTime: '22:30',
      wakeTime: '06:30',
    },
    mind: {
      learningMinutes: 0,
      learningTopic: '',
      screenHours: 4,
      phoneFreeWindows: false,
      screenNotes: '',
    },
    heart: {
      familyMinutes: 0,
      familyNotes: '',
    },
    soul: {
      meditationMinutes: 0,
      meditationType: '',
    },
    notes: '',
    updatedAt: new Date().toISOString(),
  };
}
