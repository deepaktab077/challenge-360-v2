import { DailyLog } from '../types';
import { calculateDailyScore } from '../constants/rules';

export type AchievementCategory = 'daily' | 'weekly' | 'overall';

export interface AchievementTag {
  id: string;
  label: string;
  icon: string;
  description: string;
  category?: AchievementCategory;
}

/**
 * Achievement definitions are intentionally kept in the application layer so
 * this feature works with the existing Supabase schema. The earned IDs are
 * encoded in the existing feed_posts.message field.
 */
export const ACHIEVEMENT_DEFINITIONS: AchievementTag[] = [
  // Daily achievements
  { id: 'daily_body', label: 'Body Complete', icon: '🏃', description: 'Earned points in the Body pillar today', category: 'daily' },
  { id: 'daily_mind', label: 'Mind Complete', icon: '🧠', description: 'Earned points in the Mind pillar today', category: 'daily' },
  { id: 'daily_heart', label: 'Heart Complete', icon: '❤️', description: 'Earned points in the Heart pillar today', category: 'daily' },
  { id: 'daily_soul', label: 'Soul Complete', icon: '🧘', description: 'Earned points in the Soul pillar today', category: 'daily' },
  { id: 'complete_360', label: '360° Complete', icon: '🎯', description: 'Complete every pillar on the same day', category: 'daily' },

  // Weekly / streak achievements
  { id: 'early_bird', label: 'Early Bird', icon: '🐦', description: 'Bedtime goal achieved for 5 days this week', category: 'weekly' },
  { id: 'hydration_hero', label: 'Hydration Hero', icon: '💧', description: 'Hydration goal achieved for 7 days this week', category: 'weekly' },
  { id: 'mind_unplugged', label: 'Mind Unplugged', icon: '🧠', description: 'Screen-time goal achieved for 7 days this week', category: 'weekly' },
  { id: 'family_first', label: 'Family First', icon: '❤️', description: 'Connection goal achieved for 7 days this week', category: 'weekly' },
  { id: 'inner_calm', label: 'Inner Calm', icon: '🧘', description: 'Meditation goal achieved for 7 days this week', category: 'weekly' },
  { id: 'consistency', label: 'Consistency King/Queen', icon: '👑', description: '10-day streak', category: 'weekly' },
  { id: 'perfect_week', label: 'Perfect Week', icon: '⭐', description: 'All weekly qualifiers achieved', category: 'weekly' },

  // Overall achievement
  { id: 'legend_360', label: '360° Legend', icon: '🏆', description: 'Exceptional overall performance', category: 'overall' },
];

export function addDays(dateStr: string, amount: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + amount);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function bedtimeGoalMet(log: DailyLog): boolean {
  const value = log.body?.bedTime;
  if (!value) return false;
  const [hour, minute] = value.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
  return hour < 22 || (hour === 22 && minute === 0);
}

export function hydrationGoalMet(log: DailyLog): boolean {
  return (log.body?.hydrationLiters || 0) >= 4;
}

export function screenGoalMet(log: DailyLog): boolean {
  return (log.mind?.screenHours ?? 24) < 2;
}

export function isoWeekKey(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(
    ((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7
  );
  return `${target.getFullYear()}-W${weekNumber}`;
}

export function currentStreak(logs: Record<string, DailyLog>, endDate: string): number {
  let streak = 0;
  let date = endDate;
  while (true) {
    const log = logs[date];
    if (!log || calculateDailyScore(log).totalDailyScore <= 0) break;
    streak += 1;
    date = addDays(date, -1);
  }
  return streak;
}

function getDefinition(id: string): AchievementTag | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((item) => item.id === id);
}

function addDefinition(tags: AchievementTag[], id: string): void {
  const definition = getDefinition(id);
  if (definition) tags.push(definition);
}

export interface AchievementResult {
  daily: AchievementTag[];
  weekly: AchievementTag[];
  overall: AchievementTag[];
  all: AchievementTag[];
}

/**
 * Calculates achievements at the moment the participant submits/saves the
 * check-in. Daily achievements are based on today's four pillars. Weekly
 * badges are based on the current ISO week (except the 10-day streak), and
 * overall achievements are based on the participant's complete history.
 */
export function calculateAchievements(logs: Record<string, DailyLog>, currentLog: DailyLog): AchievementResult {
  const allLogs = { ...logs, [currentLog.date]: currentLog };
  const daily: AchievementTag[] = [];
  const weekly: AchievementTag[] = [];
  const overall: AchievementTag[] = [];
  const score = calculateDailyScore(currentLog);

  if (score.bodyScore > 0) addDefinition(daily, 'daily_body');
  if (score.mindScore > 0) addDefinition(daily, 'daily_mind');
  if (score.heartScore > 0) addDefinition(daily, 'daily_heart');
  if (score.soulScore > 0) addDefinition(daily, 'daily_soul');
  if (score.allDimensionsCompleted) addDefinition(daily, 'complete_360');

  const weekKey = isoWeekKey(currentLog.date);
  const weekLogs = Object.values(allLogs).filter((log) => isoWeekKey(log.date) === weekKey);
  const count = (predicate: (log: DailyLog) => boolean) => weekLogs.filter(predicate).length;

  if (count(bedtimeGoalMet) >= 5) addDefinition(weekly, 'early_bird');
  if (count(hydrationGoalMet) >= 7) addDefinition(weekly, 'hydration_hero');
  if (count(screenGoalMet) >= 7) addDefinition(weekly, 'mind_unplugged');
  if (count((log) => (log.heart?.familyMinutes || 0) >= 30) >= 7) addDefinition(weekly, 'family_first');
  if (count((log) => (log.soul?.meditationMinutes || 0) >= 45) >= 7) addDefinition(weekly, 'inner_calm');

  if (currentStreak(allLogs, currentLog.date) >= 10) addDefinition(weekly, 'consistency');

  const strengthSessions = weekLogs.filter(
    (log) => !!log.body?.strengthCardioCompleted && (log.body?.strengthCardioMinutes || 0) >= 45
  ).length;
  const completeDays = weekLogs.filter((log) => calculateDailyScore(log).allDimensionsCompleted).length;
  if (strengthSessions >= 2 && completeDays >= 7) addDefinition(weekly, 'perfect_week');

  const complete360Days = Object.values(allLogs).filter((log) => calculateDailyScore(log).allDimensionsCompleted).length;
  if (complete360Days >= 20) addDefinition(overall, 'legend_360');

  return { daily, weekly, overall, all: [...daily, ...weekly, ...overall] };
}

/** Backward-compatible helper used by the Community feed. */
export function calculateAchievementTags(logs: Record<string, DailyLog>, currentLog: DailyLog): AchievementTag[] {
  return calculateAchievements(logs, currentLog).all;
}

export function achievementLabels(tags: AchievementTag[]): string[] {
  return tags.map((tag) => `${tag.icon} ${tag.label}`);
}
