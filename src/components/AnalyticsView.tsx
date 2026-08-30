import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Trophy, 
  Flame, 
  Award, 
  Activity, 
  Brain, 
  Heart, 
  Sparkles, 
  Users,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { DailyLog, GroupWorkout, MonthlyCharityRecord } from '../types';
import { calculateDailyScore, SCORING_RULES } from '../constants/rules';
import { getPastNDays, formatDisplayDate, getMonthKey } from '../utils/dateUtils';

interface AnalyticsViewProps {
  dailyLogs: Record<string, DailyLog>;
  groupWorkouts: GroupWorkout[];
  charityRecords: MonthlyCharityRecord[];
  onSelectDate: (date: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  dailyLogs,
  groupWorkouts,
  charityRecords,
  onSelectDate,
}) => {
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(14);

  const pastDays = getPastNDays(timeRange);
  
  // Compute analytics
  let totalScoreSum = 0;
  let loggedDaysCount = 0;
  let perfectDaysCount = 0;
  let bodyScoreSum = 0;
  let mindScoreSum = 0;
  let heartScoreSum = 0;
  let soulScoreSum = 0;

  // Habit completion counters
  const habitCounts: Record<string, number> = {
    movement: 0,
    nutrition: 0,
    hydration: 0,
    sleepDuration: 0,
    sleepDiscipline: 0,
    learning: 0,
    screenDiscipline: 0,
    familyConnection: 0,
    meditation: 0,
  };

  const chartData = pastDays.map((dateStr) => {
    const log = dailyLogs[dateStr];
    const score = calculateDailyScore(log);
    
    if (score.totalDailyScore > 0) {
      totalScoreSum += score.totalDailyScore;
      loggedDaysCount++;
      if (score.completeDayBonus > 0) perfectDaysCount++;
      bodyScoreSum += score.bodyScore;
      mindScoreSum += score.mindScore;
      heartScoreSum += score.heartScore;
      soulScoreSum += score.soulScore;
    }

    if (score.bodyDimensionMet && (log?.body?.stepsCount || 0) >= 8000) habitCounts.movement++;
    if (log?.body?.nutritionCompleted) habitCounts.nutrition++;
    if ((log?.body?.hydrationLiters || 0) >= 3) habitCounts.hydration++;
    if ((log?.body?.sleepHours || 0) >= 6.5) habitCounts.sleepDuration++;
    if (log?.body?.bedTime) habitCounts.sleepDiscipline++;
    if ((log?.mind?.learningMinutes || 0) >= 45) habitCounts.learning++;
    if ((log?.mind?.screenHours ?? 24) <= 3) habitCounts.screenDiscipline++;
    if ((log?.heart?.familyMinutes || 0) >= 30) habitCounts.familyConnection++;
    if ((log?.soul?.meditationMinutes || 0) >= 30) habitCounts.meditation++;

    return {
      date: dateStr,
      score: score.totalDailyScore,
      base: score.baseTotal,
      bonus: score.completeDayBonus,
      allDone: score.allDimensionsCompleted,
    };
  });

  const averageDailyScore = loggedDaysCount > 0 ? Math.round(totalScoreSum / loggedDaysCount) : 0;
  const morningWorkouts = groupWorkouts.filter((w) => w.isMorning).length;
  const totalWorkoutBonus = morningWorkouts > 0 ? 50 : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Stat Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Points */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Points Logged</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalScoreSum}</span>
            <span className="text-xs text-slate-400">pts</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across past {timeRange} days</p>
        </div>

        {/* Average Score */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Average Daily Score</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-300">{averageDailyScore}</span>
            <span className="text-xs text-slate-400">/ 85 max</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {loggedDaysCount} active days recorded
          </p>
        </div>

        {/* Perfect Day Bonuses */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">360° Complete Days</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-300">{perfectDaysCount}</span>
            <span className="text-xs text-slate-400">days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Earned +5 Complete Day Bonus</p>
        </div>

        {/* Group Workout Points */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Morning Workout Bonus</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-300">+{totalWorkoutBonus}</span>
            <span className="text-xs text-slate-400">pts</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{groupWorkouts.length} total group workouts logged</p>
        </div>

      </div>

      {/* Daily Score Trend Chart */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Daily Score Trend</h3>
            <p className="text-xs text-slate-400">Historical performance & Day Bonus milestones</p>
          </div>

          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl">
            {([7, 14, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  timeRange === r
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r} Days
              </button>
            ))}
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className="mt-6">
          <div className="flex items-end space-x-1.5 sm:space-x-2.5 h-48 sm:h-56 pt-6 pb-2">
            {chartData.map((d) => {
              const heightPercent = Math.round((d.score / 90) * 100);
              const isPerfect = d.bonus > 0;
              const dateObj = new Date(d.date + 'T00:00:00');
              const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
              const dayNum = dateObj.getDate();

              return (
                <div
                  key={d.date}
                  onClick={() => onSelectDate(d.date)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  title={`${formatDisplayDate(d.date)}: ${d.score} pts ${isPerfect ? '(360° Day Bonus +5)' : ''}`}
                >
                  {/* Hover tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded shadow mb-1 pointer-events-none whitespace-nowrap">
                    {d.score} pts
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[28px] bg-slate-800/80 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-full">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isPerfect
                          ? 'bg-gradient-to-t from-amber-500 to-yellow-400 shadow-lg shadow-amber-500/20'
                          : d.score >= 55
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          : d.score > 0
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                          : 'bg-slate-750'
                      }`}
                      style={{ height: `${Math.max(4, heightPercent)}%` }}
                    />
                  </div>

                  {/* Date Label */}
                  <span className="text-[10px] text-slate-400 font-semibold mt-2 group-hover:text-white transition-colors">
                    {dayNum}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60 mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" />
              <span>Complete Day (85 pts)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
              <span>55-80 Pts</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" />
              <span>&lt; 55 Pts</span>
            </span>
          </div>
        </div>

      </div>

      {/* Pillar Balance & Habit Consistency Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pillar Aggregate Points Distribution */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <h3 className="text-base font-bold text-white mb-4">4 Pillars Distribution</h3>
          
          <div className="space-y-4">
            
            {/* Body */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Body Pillar (Max 40 pts/day)
                </span>
                <span className="text-white font-bold">{bodyScoreSum} pts earned</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${loggedDaysCount > 0 ? (bodyScoreSum / (loggedDaysCount * 40)) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Mind */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-indigo-300 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  Mind Pillar (Max 20 pts/day)
                </span>
                <span className="text-white font-bold">{mindScoreSum} pts earned</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${loggedDaysCount > 0 ? (mindScoreSum / (loggedDaysCount * 20)) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Heart */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-rose-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  Heart Pillar (Max 10 pts/day)
                </span>
                <span className="text-white font-bold">{heartScoreSum} pts earned</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${loggedDaysCount > 0 ? (heartScoreSum / (loggedDaysCount * 10)) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Soul */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Soul Pillar (Max 10 pts/day)
                </span>
                <span className="text-white font-bold">{soulScoreSum} pts earned</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${loggedDaysCount > 0 ? (soulScoreSum / (loggedDaysCount * 10)) * 100 : 0}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Habit Consistency Ranking */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <h3 className="text-base font-bold text-white mb-4">Habit Fulfillment Frequency</h3>
          
          <div className="space-y-3 text-xs">
            {[
              { id: 'movement', label: 'Movement (8k+ steps)', pts: '10 pts', count: habitCounts.movement },
              { id: 'nutrition', label: 'Nutrition', pts: '10 pts', count: habitCounts.nutrition },
              { id: 'hydration', label: 'Hydration (3L+)', pts: '7 pts', count: habitCounts.hydration },
              { id: 'sleepDuration', label: 'Sleep Duration (6.5h+)', pts: '7 pts', count: habitCounts.sleepDuration },
              { id: 'sleepDiscipline', label: 'Sleep Discipline', pts: '6 pts', count: habitCounts.sleepDiscipline },
              { id: 'learning', label: 'Meaningful Learning', pts: '10 pts', count: habitCounts.learning },
              { id: 'screenDiscipline', label: 'Screen Discipline', pts: '10 pts', count: habitCounts.screenDiscipline },
              { id: 'familyConnection', label: 'Family Connection', pts: '10 pts', count: habitCounts.familyConnection },
              { id: 'meditation', label: 'Meditation / Pranayama', pts: '10 pts', count: habitCounts.meditation },
            ]
              .sort((a, b) => b.count - a.count)
              .map((h) => {
                const pct = Math.round((h.count / timeRange) * 100);
                return (
                  <div key={h.id} className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium w-40 truncate">
                      {h.label} ({h.pts})
                    </span>
                    <div className="flex-1 mx-3 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-slate-400 h-full rounded-full" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                    <span className="text-slate-400 font-semibold w-12 text-right">
                      {h.count}/{timeRange}d
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

      </div>

    </div>
  );
};
