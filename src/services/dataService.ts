import { supabase } from '../lib/supabaseClient';
import { deleteHealthReportFile } from '../lib/supabaseStorage';
import {
  DailyLog,
  GroupWorkout,
  MonthlyCharityRecord,
  UserProfile,
  Team,
  HealthReport,
  IndividualLeaderboardEntry,
  TeamLeaderboardEntry,
  FeedPost,
  FeedReaction,
  FeedComment,
  Reflection,
} from '../types';
import {
  calculateDailyScore,
  scoreMovement,
  scoreNutrition,
  scoreHydration,
  scoreSleepDuration,
  scoreSleepDiscipline,
  scoreLearning,
  scoreScreenDiscipline,
  scoreFamilyConnection,
  scoreMeditation,
  MORNING_WORKOUT_BONUS_POINTS,
  STRENGTH_CARDIO_WEEKLY_MIN_SESSIONS,
  calculateBalanceScore,
  ScoringThresholds,
} from '../constants/rules';
import { AchievementTag, ACHIEVEMENT_DEFINITIONS } from './achievementService';

// ============================================================================
// PROFILES
// ============================================================================

export async function fetchMyProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map(mapProfile);
}

export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  await supabase.from('profiles').update({ role }).eq('id', userId);
}

export async function updateUserActive(userId: string, isActive: boolean): Promise<void> {
  await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId);
}

export async function updateUserName(userId: string, fullName: string): Promise<void> {
  await supabase.from('profiles').update({ full_name: fullName }).eq('id', userId);
}

function mapProfile(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    teamId: row.team_id,
    goalPoints: row.goal_points || 500,
    leaderboardVisible: row.leaderboard_visible ?? true,
    createdAt: row.created_at,
  };
}

// ============================================================================
// TEAMS
// ============================================================================

export async function fetchAllTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from('teams').select('*').order('name', { ascending: true });
  if (error || !data) return [];
  return data.map(mapTeam);
}

export async function createTeam(name: string, description?: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.from('teams').insert({ name: name.trim(), description: description || '' });
  if (error) return { success: false, message: error.message };
  return { success: true, message: 'Team created' };
}

export async function deleteTeam(teamId: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.from('teams').delete().eq('id', teamId);
  if (error) return { success: false, message: error.message };
  return { success: true, message: 'Team deleted' };
}

export async function assignUserToTeam(userId: string, teamId: string | null): Promise<void> {
  await supabase.from('profiles').update({ team_id: teamId }).eq('id', userId);
}

function mapTeam(row: any): Team {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}

// ============================================================================
// DAILY LOGS
// ============================================================================

export async function loadAllDailyLogs(userId: string): Promise<Record<string, DailyLog>> {
  const { data, error } = await supabase.from('daily_logs').select('*').eq('user_id', userId);
  if (error || !data) return {};
  const logs: Record<string, DailyLog> = {};
  for (const row of data) {
    logs[row.date] = rowToDailyLog(row);
  }
  return logs;
}

export async function saveDailyLog(userId: string, log: DailyLog): Promise<void> {
  const score = calculateDailyScore(log);
  const payload = {
    user_id: userId,
    date: log.date,
    body: log.body,
    mind: log.mind,
    heart: log.heart,
    soul: log.soul,
    notes: log.notes || '',
    total_score: score.totalDailyScore,
    body_score: score.bodyScore,
    mind_score: score.mindScore,
    heart_score: score.heartScore,
    soul_score: score.soulScore,
    strength_cardio_completed: !!log.body.strengthCardioCompleted,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('daily_logs').upsert(payload, { onConflict: 'user_id,date' });
  if (error) {
    throw new Error(`Couldn't save today's log: ${error.message}`);
  }
}

/** Explicitly shares today's progress to the Community feed. Only score
 * totals and achievement labels are shared — never raw habit detail. Called
 * only when the user hits the explicit save/post action. */
export async function shareLogToCommunity(
  userId: string,
  fullName: string,
  log: DailyLog,
  achievements: AchievementTag[] = []
): Promise<void> {
  await upsertFeedPostForLog(userId, fullName, log, achievements);
}

function rowToDailyLog(row: any): DailyLog {
  return {
    date: row.date,
    userId: row.user_id,
    body: row.body,
    mind: row.mind,
    heart: row.heart,
    soul: row.soul,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// GROUP WORKOUTS
// ============================================================================

export async function loadAllGroupWorkouts(userId: string): Promise<GroupWorkout[]> {
  const { data, error } = await supabase
    .from('group_workouts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToWorkout);
}

export async function addGroupWorkout(
  userId: string,
  workout: Omit<GroupWorkout, 'id' | 'createdAt'>
): Promise<GroupWorkout> {
  const id = 'gw_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const payload = {
    id,
    user_id: userId,
    date: workout.date,
    title: workout.title,
    group_name: workout.groupName,
    duration_minutes: workout.durationMinutes,
    workout_type: workout.workoutType,
    is_morning: workout.isMorning,
    notes: workout.notes || '',
    created_at: new Date().toISOString(),
  };
  await supabase.from('group_workouts').insert(payload);
  return rowToWorkout(payload);
}

export async function deleteGroupWorkout(userId: string, id: string): Promise<void> {
  await supabase.from('group_workouts').delete().eq('id', id).eq('user_id', userId);
}

function rowToWorkout(row: any): GroupWorkout {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    title: row.title,
    groupName: row.group_name,
    durationMinutes: row.duration_minutes,
    workoutType: row.workout_type,
    isMorning: row.is_morning,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// ============================================================================
// CHARITY RECORDS
// ============================================================================

export async function loadAllCharityRecords(userId: string): Promise<MonthlyCharityRecord[]> {
  const { data, error } = await supabase
    .from('charity_records')
    .select('*')
    .eq('user_id', userId)
    .order('month_key', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToCharity);
}

export async function saveCharityRecord(userId: string, record: MonthlyCharityRecord): Promise<void> {
  const payload = {
    id: record.id || 'ch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    user_id: userId,
    month_key: record.monthKey,
    completed: record.completed,
    title: record.title,
    category: record.category,
    amount_or_hours: record.amountOrHours || '',
    notes: record.notes || '',
    completed_date: record.completedDate || null,
  };
  await supabase.from('charity_records').upsert(payload, { onConflict: 'user_id,month_key' });
}

function rowToCharity(row: any): MonthlyCharityRecord {
  return {
    id: row.id,
    userId: row.user_id,
    monthKey: row.month_key,
    completed: row.completed,
    title: row.title,
    category: row.category,
    amountOrHours: row.amount_or_hours,
    notes: row.notes,
    completedDate: row.completed_date,
  };
}

// ============================================================================
// EXPORT / IMPORT
// ============================================================================

export async function exportAppDataJson(userId: string): Promise<string> {
  const [logs, groupWorkouts, charityRecords] = await Promise.all([
    loadAllDailyLogs(userId),
    loadAllGroupWorkouts(userId),
    loadAllCharityRecords(userId),
  ]);
  const data = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    logs,
    groupWorkouts,
    charityRecords,
  };
  return JSON.stringify(data, null, 2);
}

export async function exportDailyLogsCsv(userId: string): Promise<string> {
  const logs = await loadAllDailyLogs(userId);
  const headers = [
    'Date',
    'Movement_Pts(10)',
    'Steps_Count',
    'Nutrition_Pts(10)',
    'No_Cheat_Day',
    'Hydration_Pts(7)',
    'Hydration_Liters',
    'SleepDuration_Pts(7)',
    'Sleep_Hours',
    'SleepDiscipline_Pts(6)',
    'Bed_Time',
    'Body_Subtotal(40)',
    'Learning_Pts(10)',
    'Learning_Minutes',
    'ScreenDiscipline_Pts(10)',
    'Screen_Hours',
    'Mind_Subtotal(20)',
    'Family_Pts(10)',
    'Family_Minutes',
    'Heart_Subtotal(10)',
    'Meditation_Pts(10)',
    'Meditation_Minutes',
    'Soul_Subtotal(10)',
    'Base_Total(80)',
    'Complete_Day_Bonus(5)',
    'Total_Daily_Score(85)',
    'All_4_Dimensions_Met',
    'Strength_Cardio_Done',
    'General_Notes',
  ];

  const sortedDates = Object.keys(logs).sort().reverse();
  const rows = sortedDates.map((date) => {
    const l = logs[date];
    const score = calculateDailyScore(l);

    const escapeCsv = (str: string | undefined | number | boolean) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    return [
      date,
      scoreMovement(l.body.stepsCount || 0),
      escapeCsv(l.body.stepsCount),
      scoreNutrition(l.body.nutritionCompleted, l.body.noCheatDay),
      l.body.noCheatDay ? 'YES' : 'NO',
      scoreHydration(l.body.hydrationLiters || 0),
      escapeCsv(l.body.hydrationLiters),
      scoreSleepDuration(l.body.sleepHours || 0),
      escapeCsv(l.body.sleepHours),
      scoreSleepDiscipline(l.body.bedTime),
      escapeCsv(l.body.bedTime),
      score.bodyScore,
      scoreLearning(l.mind.learningMinutes || 0),
      escapeCsv(l.mind.learningMinutes),
      scoreScreenDiscipline(l.mind.screenHours ?? 24),
      escapeCsv(l.mind.screenHours),
      score.mindScore,
      scoreFamilyConnection(l.heart.familyMinutes || 0),
      escapeCsv(l.heart.familyMinutes),
      score.heartScore,
      scoreMeditation(l.soul.meditationMinutes || 0),
      escapeCsv(l.soul.meditationMinutes),
      score.soulScore,
      score.baseTotal,
      score.completeDayBonus,
      score.totalDailyScore,
      score.allDimensionsCompleted ? 'YES' : 'NO',
      l.body.strengthCardioCompleted ? 'YES' : 'NO',
      escapeCsv(l.notes),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export async function importAppDataJson(
  userId: string,
  jsonString: string
): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'Invalid JSON format' };
    }

    if (parsed.logs && typeof parsed.logs === 'object') {
      for (const log of Object.values(parsed.logs) as DailyLog[]) {
        await saveDailyLog(userId, log);
      }
    }

    if (Array.isArray(parsed.groupWorkouts)) {
      for (const w of parsed.groupWorkouts as GroupWorkout[]) {
        await addGroupWorkout(userId, {
          date: w.date,
          title: w.title,
          groupName: w.groupName,
          durationMinutes: w.durationMinutes,
          workoutType: w.workoutType,
          isMorning: (w as any).isMorning ?? false,
          notes: w.notes,
        });
      }
    }

    if (Array.isArray(parsed.charityRecords)) {
      for (const c of parsed.charityRecords as MonthlyCharityRecord[]) {
        await saveCharityRecord(userId, c);
      }
    }

    return { success: true, message: 'Data imported and merged successfully!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error parsing imported JSON' };
  }
}

// ============================================================================
// HEALTH REPORT UPLOADS (files live in our private Supabase Storage bucket)
// ============================================================================

export async function loadHealthReports(userId: string): Promise<HealthReport[]> {
  const { data, error } = await supabase
    .from('health_reports')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToHealthReport);
}

export async function addHealthReport(
  userId: string,
  report: Omit<HealthReport, 'id' | 'uploadedAt'>
): Promise<HealthReport> {
  const id = 'hr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const payload = {
    id,
    user_id: userId,
    date: report.date,
    source: report.source,
    storage_path: report.storagePath,
    file_name: report.fileName,
    notes: report.notes || '',
    uploaded_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('health_reports').insert(payload);
  if (error) throw new Error(`Couldn't save the upload record: ${error.message}`);
  return rowToHealthReport(payload);
}

export async function deleteHealthReport(userId: string, id: string, storagePath: string): Promise<void> {
  await supabase.from('health_reports').delete().eq('id', id).eq('user_id', userId);
  await deleteHealthReportFile(storagePath);
}

function rowToHealthReport(row: any): HealthReport {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    source: row.source,
    storagePath: row.storage_path,
    fileName: row.file_name,
    notes: row.notes,
    uploadedAt: row.uploaded_at,
  };
}

// ============================================================================
// LEADERBOARD (individual + team) — built from security-definer RPC calls
// that expose only score/qualifier fields, never raw private habit data.
// ============================================================================

export type LeaderboardPeriod = 'week' | 'month' | 'all';

function isDateInPeriod(dateStr: string, period: LeaderboardPeriod): boolean {
  if (period === 'all') return true;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  if (period === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  // 'week': same ISO week as today
  return isoWeekKey(dateStr) === isoWeekKey(now.toISOString().slice(0, 10));
}

export async function fetchIndividualLeaderboard(
  period: LeaderboardPeriod = 'all'
): Promise<IndividualLeaderboardEntry[]> {
  const [{ data: profiles }, { data: teams }, { data: scores }, { data: workouts }, { data: charity }] =
    await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('teams').select('*'),
      supabase.rpc('get_leaderboard_daily_scores'),
      supabase.from('group_workouts').select('user_id,date,is_morning'),
      supabase.rpc('get_leaderboard_charity_status'),
    ]);

  const teamNameById = new Map<string, string>((teams || []).map((t: any) => [t.id, t.name]));

  // --- Step 1: group each user's daily scores by ISO week -------------------
  type WeekAgg = {
    total: number;
    body: number;
    mind: number;
    heart: number;
    soul: number;
    strengthCardioDays: number;
    daysLogged: number;
    perfectDays: number;
    hasMorningWorkout: boolean;
  };
  const perUserWeeks = new Map<string, Map<string, WeekAgg>>();

  const getWeekAgg = (userId: string, weekKey: string): WeekAgg => {
    let userWeeks = perUserWeeks.get(userId);
    if (!userWeeks) {
      userWeeks = new Map();
      perUserWeeks.set(userId, userWeeks);
    }
    let week = userWeeks.get(weekKey);
    if (!week) {
      week = {
        total: 0,
        body: 0,
        mind: 0,
        heart: 0,
        soul: 0,
        strengthCardioDays: 0,
        daysLogged: 0,
        perfectDays: 0,
        hasMorningWorkout: false,
      };
      userWeeks.set(weekKey, week);
    }
    return week;
  };

  for (const row of scores || []) {
    if (!isDateInPeriod(row.date, period)) continue;
    const weekKey = isoWeekKey(row.date);
    const week = getWeekAgg(row.user_id, weekKey);
    week.total += row.total_score || 0;
    week.body += row.body_score || 0;
    week.mind += row.mind_score || 0;
    week.heart += row.heart_score || 0;
    week.soul += row.soul_score || 0;
    if ((row.total_score || 0) > 0) week.daysLogged += 1;
    if (row.strength_cardio_completed) week.strengthCardioDays += 1;
    if (row.body_score > 0 && row.mind_score > 0 && row.heart_score > 0 && row.soul_score > 0) {
      week.perfectDays += 1;
    }
  }

  for (const w of workouts || []) {
    if (!w.is_morning) continue;
    if (!isDateInPeriod(w.date, period)) continue;
    const weekKey = isoWeekKey(w.date);
    const week = getWeekAgg(w.user_id, weekKey);
    week.hasMorningWorkout = true;
  }

  const charityQualifiedUsers = new Set(
    (charity || []).filter((c: any) => c.completed).map((c: any) => c.user_id)
  );

  // --- Step 2: apply the weekly strength/cardio qualifier --------------------
  // "If a week has <2 strength sessions, that week's points don't count."
  // Important: only enforce this for weeks that have already ENDED — the
  // current, still-in-progress week should never be zeroed out just because
  // there hasn't been time to log 2 sessions yet. That would make everyone's
  // score look like 0 for the first several days of every week.
  const currentWeekKey = isoWeekKey(new Date().toISOString().slice(0, 10));

  const entries: IndividualLeaderboardEntry[] = (profiles || [])
    .filter((p: any) => p.is_active)
    .map((p: any) => {
      const userWeeks = perUserWeeks.get(p.id);
      let totalScore = 0;
      let bodyScore = 0;
      let mindScore = 0;
      let heartScore = 0;
      let soulScore = 0;
      let daysLogged = 0;
      let perfectDays = 0;
      let morningWorkoutWeeks = 0;
      let disqualifiedWeeks = 0;

      if (userWeeks) {
        for (const [weekKey, week] of userWeeks.entries()) {
          daysLogged += week.daysLogged;
          const isCompletedWeek = weekKey !== currentWeekKey;
          const qualifies = !isCompletedWeek || week.strengthCardioDays >= STRENGTH_CARDIO_WEEKLY_MIN_SESSIONS;
          if (!qualifies) {
            disqualifiedWeeks += 1;
            continue; // this week's points (and its morning-workout bonus) don't count
          }
          totalScore += week.total;
          bodyScore += week.body;
          mindScore += week.mind;
          heartScore += week.heart;
          soulScore += week.soul;
          perfectDays += week.perfectDays;
          if (week.hasMorningWorkout) {
            totalScore += MORNING_WORKOUT_BONUS_POINTS;
            morningWorkoutWeeks += 1;
          }
        }
      }

      const goalPoints = p.goal_points || 500;

      return {
        userId: p.id,
        fullName: p.full_name || p.email,
        teamId: p.team_id,
        teamName: p.team_id ? teamNameById.get(p.team_id) || null : null,
        totalScore,
        bodyScore,
        mindScore,
        heartScore,
        soulScore,
        daysLogged,
        perfectDays,
        morningWorkoutWeeks,
        charityQualified: charityQualifiedUsers.has(p.id),
        goalPoints,
        goalProgress: goalPoints > 0 ? Math.min(100, Math.round((totalScore / goalPoints) * 100)) : 0,
        disqualifiedWeeks,
        balanceScore: calculateBalanceScore(bodyScore, mindScore, heartScore, soulScore),
        leaderboardVisible: p.leaderboard_visible ?? true,
        rank: 0,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}

export async function fetchTeamLeaderboard(period: LeaderboardPeriod = 'all'): Promise<TeamLeaderboardEntry[]> {
  const [individuals, { data: teams }] = await Promise.all([
    fetchIndividualLeaderboard(period),
    supabase.from('teams').select('*'),
  ]);

  const byTeam = new Map<string, { totalScore: number; memberCount: number; perfectDays: number }>();
  for (const entry of individuals) {
    if (!entry.teamId) continue;
    const t = byTeam.get(entry.teamId) || { totalScore: 0, memberCount: 0, perfectDays: 0 };
    t.totalScore += entry.totalScore;
    t.memberCount += 1;
    t.perfectDays += entry.perfectDays;
    byTeam.set(entry.teamId, t);
  }

  const result: TeamLeaderboardEntry[] = (teams || [])
    .map((t: any) => {
      const stats = byTeam.get(t.id) || { totalScore: 0, memberCount: 0, perfectDays: 0 };
      return {
        teamId: t.id,
        teamName: t.name,
        memberCount: stats.memberCount,
        totalScore: stats.totalScore,
        averageScorePerMember: stats.memberCount > 0 ? Math.round(stats.totalScore / stats.memberCount) : 0,
        perfectDays: stats.perfectDays,
        rank: 0,
      };
    })
    .filter((t) => t.memberCount > 0)
    .sort((a, b) => b.totalScore - a.totalScore);

  result.forEach((t, i) => (t.rank = i + 1));
  return result;
}

/** ISO-ish week key (year + week number) used to dedupe the weekly morning
 * workout bonus per user, matching the "once per week" rule. */
function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const weekNumber =
    1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${target.getFullYear()}-W${weekNumber}`;
}

// ============================================================================
// GOALS
// ============================================================================

export async function updateUserGoal(userId: string, goalPoints: number): Promise<void> {
  await supabase.from('profiles').update({ goal_points: Math.max(0, Math.round(goalPoints)) }).eq('id', userId);
}

// ============================================================================
// FEED (community activity feed + reactions)
// ============================================================================

const REACTION_EMOJIS = ['🔥', '💪', '👏', '❤️', '👑'] as const;
export { REACTION_EMOJIS };

function buildFeedMessage(fullName: string, score: number, allDimensionsCompleted: boolean, date: string, achievements: AchievementTag[] = []): string {
  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  const base = allDimensionsCompleted
    ? `Logged ${score} pts on ${dateLabel} across all 4 pillars!`
    : `Logged ${score} pts on ${dateLabel}!`;
  // Keep achievement data inside the existing message field so this feature
  // works with already-deployed Supabase schemas without requiring a SQL
  // migration or a new column. The UI extracts the marker before displaying it.
  const ids = achievements.map((tag) => tag.id).join(',');
  return ids ? `${base} [[ACHIEVEMENTS:${ids}]]` : base;
}

function parseFeedMessage(message: string): { message: string; achievements: AchievementTag[] } {
  const match = message.match(/\s*\[\[ACHIEVEMENTS:([^\]]*)\]\]\s*$/);
  if (!match) return { message, achievements: [] };
  const ids = match[1].split(',').map((id) => id.trim()).filter(Boolean);
  const achievements = ids
    .map((id) => ACHIEVEMENT_DEFINITIONS.find((item) => item.id === id))
    .filter(Boolean) as AchievementTag[];
  return { message: message.replace(match[0], ''), achievements };
}

/** Called right after a daily log is saved — posts (or updates) that day's
 * feed card. Only the score summary is shared, never raw habit detail. */
export async function upsertFeedPostForLog(
  userId: string,
  fullName: string,
  log: DailyLog,
  achievements: AchievementTag[] = []
): Promise<void> {
  const score = calculateDailyScore(log);
  // Keep one Community post per participant per day. The post is updated
  // when the participant saves again (including when they complete all four pillars).
  const kind = 'log';
  const id = `feed_${userId}_${log.date}_${kind}`;
  // Achievement labels are encoded in the existing message field; no new
  // Supabase column is required.
  const payload = {
    id,
    user_id: userId,
    date: log.date,
    total_score: score.totalDailyScore,
    all_dimensions_completed: score.allDimensionsCompleted,
    kind,
    message: buildFeedMessage(fullName, score.totalDailyScore, score.allDimensionsCompleted, log.date, achievements),
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('feed_posts').upsert(payload, { onConflict: 'user_id,date,kind' });
  if (error) {
    throw new Error(`Couldn't publish today's achievement to Community: ${error.message}`);
  }
}

export async function fetchFeed(limit = 50): Promise<FeedPost[]> {
  const [{ data: posts }, { data: profiles }, { data: teams }, { data: reactions }, { data: comments }] = await Promise.all([
    supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(limit),
    supabase.from('profiles').select('id,full_name,team_id'),
    supabase.from('teams').select('id,name'),
    supabase.from('feed_reactions').select('*'),
    supabase.from('feed_comments').select('*').order('created_at', { ascending: true }),
  ]);

  const nameById = new Map<string, string>((profiles || []).map((p: any) => [p.id, p.full_name]));
  const teamIdById = new Map<string, string | null>((profiles || []).map((p: any) => [p.id, p.team_id]));
  const teamNameById = new Map<string, string>((teams || []).map((t: any) => [t.id, t.name]));
  const reactionsByPost = new Map<string, FeedReaction[]>();
  for (const r of reactions || []) {
    const list = reactionsByPost.get(r.post_id) || [];
    list.push({ id: r.id, postId: r.post_id, userId: r.user_id, emoji: r.emoji, createdAt: r.created_at });
    reactionsByPost.set(r.post_id, list);
  }
  const commentsByPost = new Map<string, FeedComment[]>();
  for (const c of comments || []) {
    const list = commentsByPost.get(c.post_id) || [];
    list.push({
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      fullName: nameById.get(c.user_id) || 'Someone',
      content: c.content,
      createdAt: c.created_at,
    });
    commentsByPost.set(c.post_id, list);
  }

  return (posts || []).map((row: any) => {
    const teamId = teamIdById.get(row.user_id);
    const parsed = parseFeedMessage(row.message || '');
    return {
      id: row.id,
      userId: row.user_id,
      fullName: nameById.get(row.user_id) || 'Someone',
      teamName: teamId ? teamNameById.get(teamId) || null : null,
      date: row.date,
      totalScore: row.total_score,
      allDimensionsCompleted: row.all_dimensions_completed,
      kind: row.kind,
      message: parsed.message,
      createdAt: row.created_at,
      achievementTags: parsed.achievements.map((a) => ({ id: a.id, icon: a.icon, label: a.label })),
      reactions: reactionsByPost.get(row.id) || [],
      comments: commentsByPost.get(row.id) || [],
    };
  });
}

export async function addFeedComment(postId: string, userId: string, content: string): Promise<void> {
  const id = 'fc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const { error } = await supabase.from('feed_comments').insert({ id, post_id: postId, user_id: userId, content: content.trim() });
  if (error) throw new Error(`Couldn't add comment: ${error.message}`);
}

export async function deleteFeedComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('feed_comments').delete().eq('id', commentId).eq('user_id', userId);
  if (error) throw new Error(`Couldn't delete comment: ${error.message}`);
}

export async function toggleFeedReaction(postId: string, userId: string, emoji: string, isActive: boolean): Promise<void> {
  if (isActive) {
    const { error } = await supabase.from('feed_reactions').delete().eq('post_id', postId).eq('user_id', userId).eq('emoji', emoji);
    if (error) throw new Error(`Couldn't remove reaction: ${error.message}`);
  } else {
    const id = `rx_${postId}_${userId}_${emoji}`.replace(/[^a-zA-Z0-9_]/g, '');
    const { error } = await supabase.from('feed_reactions').upsert(
      { id, post_id: postId, user_id: userId, emoji, created_at: new Date().toISOString() },
      { onConflict: 'post_id,user_id,emoji' }
    );
    if (error) throw new Error(`Couldn't add reaction: ${error.message}`);
  }
}

/** Latest feed post for a specific user — used by the leaderboard's "quick
 * react" button so people can cheer someone on right from the rankings. */
export async function fetchLatestFeedPostForUser(userId: string): Promise<FeedPost | null> {
  const [{ data: posts }, { data: reactions }] = await Promise.all([
    supabase.from('feed_posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    supabase.from('feed_reactions').select('*'),
  ]);
  const row = posts?.[0];
  if (!row) return null;
  const latestParsed = parseFeedMessage(row.message || '');

  const postReactions: FeedReaction[] = (reactions || [])
    .filter((r: any) => r.post_id === row.id)
    .map((r: any) => ({ id: r.id, postId: r.post_id, userId: r.user_id, emoji: r.emoji, createdAt: r.created_at }));

  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    totalScore: row.total_score,
    allDimensionsCompleted: row.all_dimensions_completed,
    kind: row.kind,
    message: latestParsed.message,
    createdAt: row.created_at,
    achievementTags: latestParsed.achievements.map((a) => ({ id: a.id, icon: a.icon, label: a.label })),
    reactions: postReactions,
    comments: [],
  };
}

/** Collective progress across every participant — sum of everyone's total
 * score vs the sum of everyone's personal goal. */
export async function fetchCollectiveGoalProgress(): Promise<{ totalScore: number; totalGoal: number }> {
  const entries = await fetchIndividualLeaderboard('all');
  const totalScore = entries.reduce((sum, e) => sum + e.totalScore, 0);
  const totalGoal = entries.reduce((sum, e) => sum + e.goalPoints, 0);
  return { totalScore, totalGoal };
}

// ============================================================================
// PROFILE PRIVACY
// ============================================================================

export async function updateLeaderboardVisibility(userId: string, visible: boolean): Promise<void> {
  await supabase.from('profiles').update({ leaderboard_visible: visible }).eq('id', userId);
}

// ============================================================================
// "BEYOND" — private weekly reflection journal
// ============================================================================

export async function loadReflection(userId: string, weekKey: string): Promise<Reflection | null> {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', userId)
    .eq('week_key', weekKey)
    .maybeSingle();
  if (error || !data) return null;
  return { weekKey: data.week_key, content: data.content, updatedAt: data.updated_at };
}

export async function saveReflection(userId: string, weekKey: string, content: string): Promise<void> {
  await supabase.from('reflections').upsert(
    { user_id: userId, week_key: weekKey, content, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,week_key' }
  );
}

// ============================================================================
// SCORING CONFIGURATION (Admin Score Cards)
// ============================================================================

/** Loads the admin's saved thresholds, if any. Returns null if the config
 * table is empty (not yet configured) — callers should keep using the
 * built-in defaults in that case. */
export async function fetchScoringConfig(): Promise<Partial<ScoringThresholds> | null> {
  const { data, error } = await supabase.from('scoring_config').select('*').eq('id', 'default').maybeSingle();
  if (error || !data) return null;
  return data.config as Partial<ScoringThresholds>;
}

export async function saveScoringConfig(thresholds: ScoringThresholds, adminUserId: string): Promise<void> {
  const { error } = await supabase.from('scoring_config').upsert(
    { id: 'default', config: thresholds, updated_at: new Date().toISOString(), updated_by: adminUserId },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`Couldn't save scoring config: ${error.message}`);
}

// ============================================================================
// ADMIN DASHBOARD EXPORT
// ============================================================================

/** Builds a CSV of the current leaderboard/dashboard data for admin export.
 * Reuses the same IndividualLeaderboardEntry data already shown on screen —
 * no separate calculation path. */
export function buildAdminDashboardCsv(entries: IndividualLeaderboardEntry[], periodLabel: string): string {
  const headers = [
    'Participant Name',
    'Period',
    'Rank',
    'Overall Score',
    'Body Score (/40)',
    'Mind Score (/20)',
    'Heart Score (/10)',
    'Soul Score (/10)',
    'Balance Score (%)',
    'Goal Points',
    'Goal Progress (%)',
    'Days Logged',
    'Complete Days',
    'Morning Workout Weeks',
    'Charity Qualified',
    'Disqualified Weeks',
  ];

  const escapeCsv = (v: string | number | boolean) => {
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = entries.map((e) =>
    [
      e.fullName,
      periodLabel,
      e.rank,
      e.totalScore,
      e.bodyScore,
      e.mindScore,
      e.heartScore,
      e.soulScore,
      e.balanceScore,
      e.goalPoints,
      e.goalProgress,
      e.daysLogged,
      e.perfectDays,
      e.morningWorkoutWeeks,
      e.charityQualified ? 'YES' : 'NO',
      e.disqualifiedWeeks,
    ]
      .map(escapeCsv)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}


// ============================================================================
// ACHIEVEMENTS (persisted, one-time badge unlocks)
// ============================================================================

/** Every achievement id this participant has ever unlocked (permanent record,
 * used both to render their badge collection and to make sure the "new
 * badge" celebration only fires once per badge). */
export async function fetchEarnedAchievementIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', userId);
  if (error || !data) return new Set();
  return new Set(data.map((row: any) => row.achievement_id as string));
}

export interface EarnedAchievementRecord {
  achievementId: string;
  earnedAt: string;
}

export async function fetchAllEarnedAchievements(userId: string): Promise<EarnedAchievementRecord[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => ({ achievementId: row.achievement_id, earnedAt: row.earned_at }));
}

/** Records newly-unlocked achievements. Safe to call with achievements the
 * user already has — the unique constraint on (user_id, achievement_id)
 * means duplicates are silently ignored, never double-recorded. */
export async function recordEarnedAchievements(userId: string, achievementIds: string[]): Promise<void> {
  if (achievementIds.length === 0) return;
  const rows = achievementIds.map((id) => ({ user_id: userId, achievement_id: id }));
  await supabase.from('user_achievements').upsert(rows, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true });
}

// ============================================================================
// LEADERBOARD RANK MOVEMENT (snapshots + delta since last auto-save)
// ============================================================================

/** Records today's rank for every participant in one pass (called whenever
 * the leaderboard loads). Upserts on (user_id, today) so repeated loads the
 * same day just refresh today's snapshot rather than creating noise. */
export async function recordLeaderboardSnapshots(
  entries: { userId: string; rank: number; totalScore: number }[]
): Promise<void> {
  if (entries.length === 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const rows = entries.map((e) => ({
    user_id: e.userId,
    snapshot_date: today,
    rank: e.rank,
    total_score: e.totalScore,
  }));
  await supabase.from('leaderboard_snapshots').upsert(rows, { onConflict: 'user_id,snapshot_date' });
}

/** Each participant's rank as of their most recent snapshot BEFORE today —
 * i.e. the "last auto-save" to compare movement against. */
export async function fetchPreviousRankSnapshots(): Promise<Map<string, number>> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('leaderboard_snapshots')
    .select('user_id,snapshot_date,rank')
    .lt('snapshot_date', today)
    .order('snapshot_date', { ascending: false });
  if (error || !data) return new Map();

  const previousByUser = new Map<string, number>();
  for (const row of data) {
    // Rows are ordered most-recent-first, so the first one seen per user is
    // their latest snapshot before today.
    if (!previousByUser.has(row.user_id)) {
      previousByUser.set(row.user_id, row.rank);
    }
  }
  return previousByUser;
}
