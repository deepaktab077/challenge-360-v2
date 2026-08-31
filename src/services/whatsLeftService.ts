import { DailyLog } from '../types';
import {
  scoreMovement,
  scoreNutrition,
  scoreHydration,
  scoreSleepDuration,
  scoreSleepDiscipline,
  scoreLearning,
  scoreScreenDiscipline,
  scoreFamilyConnection,
  scoreMeditation,
  getScoringThresholds,
} from '../constants/rules';
import {
  bedtimeGoalMet,
  hydrationGoalMet,
  screenGoalMet,
  isoWeekKey,
  currentStreak,
} from './achievementService';

export interface RemainingItem {
  label: string;
  detail: string;
}

/** Exactly what's still incomplete TODAY, in plain language, based on the
 * participant's actual current entries — not a generic checklist. Reuses
 * the same score* functions the scoring engine itself uses, so the maxima
 * and thresholds can never drift out of sync with real scoring. */
export function getTodayRemaining(log: DailyLog): RemainingItem[] {
  const t = getScoringThresholds();
  const items: RemainingItem[] = [];

  const steps = log.body?.stepsCount || 0;
  if (scoreMovement(steps) < t.movementFullPts) {
    const need = t.movementFullSteps - steps;
    items.push({
      label: 'Steps',
      detail: need > 0 ? `${need.toLocaleString()} more steps for full points` : 'Log your steps',
    });
  }

  const nutritionPts = scoreNutrition(!!log.body?.nutritionCompleted, !!log.body?.noCheatDay);
  if (nutritionPts < t.nutritionDietPts + t.nutritionNoCheatPts) {
    const missing: string[] = [];
    if (!log.body?.nutritionCompleted) missing.push('mark diet followed');
    if (!log.body?.noCheatDay) missing.push('confirm no-cheat day');
    items.push({ label: 'Nutrition', detail: missing.join(' and ') });
  }

  const liters = log.body?.hydrationLiters || 0;
  if (scoreHydration(liters) < t.hydrationFullPts) {
    const need = Math.max(0, t.hydrationFullLiters - liters);
    items.push({ label: 'Hydration', detail: need > 0 ? `${need.toFixed(1)}L more for full points` : 'Log your water intake' });
  }

  const sleepHours = log.body?.sleepHours || 0;
  if (scoreSleepDuration(sleepHours) < t.sleepDurationFullPts) {
    items.push({ label: 'Sleep Duration', detail: `Aim for ${t.sleepDurationFullHours}+ hours for full points` });
  }

  if (scoreSleepDiscipline(log.body?.bedTime) < t.sleepDisciplineFullPts) {
    items.push({ label: 'Sleep Discipline', detail: "Log tonight's bedtime by 10:00 PM for full points" });
  }

  const learningMin = log.mind?.learningMinutes || 0;
  if (scoreLearning(learningMin) < t.learningPts) {
    const need = Math.max(0, t.learningMinMinutes - learningMin);
    items.push({ label: 'Learning', detail: need > 0 ? `${need} more minutes needed` : 'Log your reading/podcast time' });
  }

  const screenHours = log.mind?.screenHours ?? 24;
  if (scoreScreenDiscipline(screenHours) < t.screenFullPts) {
    items.push({ label: 'Screen Discipline', detail: `Keep screen time under ${t.screenFullMaxHours}h for full points` });
  }

  const familyMin = log.heart?.familyMinutes || 0;
  if (scoreFamilyConnection(familyMin) < t.familyPts) {
    const need = Math.max(0, t.familyMinMinutes - familyMin);
    items.push({ label: 'Connection', detail: need > 0 ? `${need} more phone-free minutes with family` : "Log today's connection activity" });
  }

  const meditationMin = log.soul?.meditationMinutes || 0;
  if (scoreMeditation(meditationMin) < t.meditationFullPts) {
    const need = Math.max(0, t.meditationFullMinutes - meditationMin);
    items.push({ label: 'Meditation', detail: need > 0 ? `${need} more minutes for full points` : 'Log your meditation' });
  }

  return items;
}

/** Exactly what's still needed THIS WEEK to unlock each weekly badge or
 * milestone, based on real progress counted so far — reuses the same
 * predicate functions the achievement engine itself uses. */
export function getWeekRemaining(logs: Record<string, DailyLog>, currentLog: DailyLog): RemainingItem[] {
  const allLogs = { ...logs, [currentLog.date]: currentLog };
  const weekKey = isoWeekKey(currentLog.date);
  const weekLogs = Object.values(allLogs).filter((log) => isoWeekKey(log.date) === weekKey);
  const count = (predicate: (log: DailyLog) => boolean) => weekLogs.filter(predicate).length;

  const items: RemainingItem[] = [];

  const bedtimeCount = count(bedtimeGoalMet);
  if (bedtimeCount < 5) {
    items.push({ label: 'Early Bird', detail: `${5 - bedtimeCount} more qualifying day${5 - bedtimeCount > 1 ? 's' : ''} this week` });
  }

  const hydrationCount = count(hydrationGoalMet);
  if (hydrationCount < 7) {
    items.push({ label: 'Hydration Hero', detail: `${7 - hydrationCount} more qualifying day${7 - hydrationCount > 1 ? 's' : ''} this week` });
  }

  const screenCount = count(screenGoalMet);
  if (screenCount < 7) {
    items.push({ label: 'Mind Unplugged', detail: `${7 - screenCount} more qualifying day${7 - screenCount > 1 ? 's' : ''} this week` });
  }

  const familyCount = count((log) => (log.heart?.familyMinutes || 0) >= 30);
  if (familyCount < 7) {
    items.push({ label: 'Family First', detail: `${7 - familyCount} more qualifying day${7 - familyCount > 1 ? 's' : ''} this week` });
  }

  const meditationCount = count((log) => (log.soul?.meditationMinutes || 0) >= 45);
  if (meditationCount < 7) {
    items.push({ label: 'Inner Calm', detail: `${7 - meditationCount} more qualifying day${7 - meditationCount > 1 ? 's' : ''} this week` });
  }

  const streak = currentStreak(allLogs, currentLog.date);
  if (streak < 10) {
    items.push({ label: 'Consistency King/Queen', detail: `${10 - streak} more consecutive day${10 - streak > 1 ? 's' : ''} needed` });
  }

  const strengthSessions = weekLogs.filter(
    (log) => !!log.body?.strengthCardioCompleted && (log.body?.strengthCardioMinutes || 0) >= 45
  ).length;
  if (strengthSessions < 2) {
    items.push({
      label: 'Weekly Strength Qualifier',
      detail: `${2 - strengthSessions} more session${2 - strengthSessions > 1 ? 's' : ''} — needed to keep this week's points`,
    });
  }

  return items;
}
