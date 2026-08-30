import React from 'react';
import { 
  Trophy, 
  Sparkles, 
  Activity, 
  Brain, 
  Heart, 
  Flame, 
  CheckCheck, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PillarScoreBreakdown } from '../types';

interface ScoreOverviewBannerProps {
  scoreBreakdown: PillarScoreBreakdown;
  onMarkAllComplete: () => void;
  onResetDay: () => void;
  onTriggerConfetti: () => void;
}

export const ScoreOverviewBanner: React.FC<ScoreOverviewBannerProps> = ({
  scoreBreakdown,
  onResetDay,
  onTriggerConfetti,
}) => {
  const {
    bodyScore,
    mindScore,
    heartScore,
    soulScore,
    baseTotal,
    completeDayBonus,
    totalDailyScore,
    allDimensionsCompleted: allTasksCompleted,
    completedItemsCount: completedTasksCount,
    totalItemsCount: totalTasksCount,
  } = scoreBreakdown;

  // Percentage of base points (max 80)
  const basePercentage = Math.round((baseTotal / 80) * 100);
  const totalPercentage = Math.round((totalDailyScore / 85) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-5 sm:p-6 mb-8">
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
        
        <div className="flex items-center space-x-4">
          {/* Score Ring / Badge */}
          <div className="relative flex items-center justify-center">
            <div 
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center shadow-sm transition-all duration-300 border ${
                allTasksCompleted
                  ? 'bg-amber-500/10 border-amber-300 text-amber-200 ring-2 ring-amber-300/40'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}
            >
              <span className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-indigo-600">
                {totalDailyScore}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1">
                / {allTasksCompleted ? '85 max' : '80 base'}
              </span>
            </div>

            {allTasksCompleted && (
              <button
                onClick={onTriggerConfetti}
                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-400 text-slate-950 shadow-md hover:scale-110 transition-transform"
                title="Celebrate Perfect Score!"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-indigo-300">
                Daily Performance
              </h3>
              {allTasksCompleted && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-600" />
                  360° Day +5
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {completedTasksCount} of {totalTasksCount} scorable items fulfilled ({basePercentage}% base score completed)
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            id="reset-day-btn"
            onClick={onResetDay}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-800"
            title="Reset all checkboxes for this day"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

      </div>

      {/* 4 Pillars Progress Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
        
        {/* Body Card */}
        <div className="bg-slate-800/40 border border-slate-800/80 rounded-2xl p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-5 bg-indigo-500 rounded-full inline-block"></span>
              <span className="text-xs sm:text-sm font-bold text-slate-200">Body</span>
            </div>
            <span className="text-xs font-bold text-indigo-600">
              {bodyScore} <span className="text-slate-400 font-normal">/ 40</span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-700/80 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(bodyScore / 40) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">Steps, Nutrition, Hydration, Sleep</p>
        </div>

        {/* Mind Card */}
        <div className="bg-slate-800/40 border border-slate-800/80 rounded-2xl p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-5 bg-orange-400 rounded-full inline-block"></span>
              <span className="text-xs sm:text-sm font-bold text-slate-200">Mind</span>
            </div>
            <span className="text-xs font-bold text-orange-600">
              {mindScore} <span className="text-slate-400 font-normal">/ 20</span>
            </span>
          </div>
          <div className="w-full bg-slate-700/80 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-orange-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(mindScore / 20) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">Reading/Podcast, Screen Discipline</p>
        </div>

        {/* Heart Card */}
        <div className="bg-slate-800/40 border border-slate-800/80 rounded-2xl p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-5 bg-pink-500 rounded-full inline-block"></span>
              <span className="text-xs sm:text-sm font-bold text-slate-200">Heart</span>
            </div>
            <span className="text-xs font-bold text-pink-600">
              {heartScore} <span className="text-slate-400 font-normal">/ 10</span>
            </span>
          </div>
          <div className="w-full bg-slate-700/80 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(heartScore / 10) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">Family Connection (+ Monthly Charity qualifier)</p>
        </div>

        {/* Soul Card */}
        <div className="bg-slate-800/40 border border-slate-800/80 rounded-2xl p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-5 bg-purple-500 rounded-full inline-block"></span>
              <span className="text-xs sm:text-sm font-bold text-slate-200">Soul</span>
            </div>
            <span className="text-xs font-bold text-purple-600">
              {soulScore} <span className="text-slate-400 font-normal">/ 10</span>
            </span>
          </div>
          <div className="w-full bg-slate-700/80 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(soulScore / 10) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">Meditation & Conscious Pranayam</p>
        </div>

      </div>

      {/* Day Bonus Card - Signature Sleek Interface element */}
      <div className={`mt-5 p-5 rounded-2xl shadow-md transition-all ${
        allTasksCompleted
          ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 text-white'
          : 'bg-indigo-900 text-white'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-slate-900/20 p-3 flex items-center justify-center shrink-0">
              <Trophy className={`w-6 h-6 ${allTasksCompleted ? 'text-amber-300' : 'text-indigo-200'}`} />
            </div>
            <div>
              <p className="text-base font-bold text-white">
                {allTasksCompleted ? (
                  <span className="text-amber-300">360° Complete Day Bonus Achieved! (Total: {totalDailyScore}/85)</span>
                ) : (
                  <span>360° Complete Day Bonus: +5 Points</span>
                )}
              </p>
              <p className="text-xs text-indigo-200 mt-0.5">
                {allTasksCompleted
                  ? 'Outstanding! You met the core requirement in Body, Mind, Heart, and Soul today.'
                  : 'Earn at least one point in every pillar (Body, Mind, Heart, Soul) today to unlock this bonus.'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className={`text-xl sm:text-2xl font-black block ${allTasksCompleted ? 'text-amber-300' : 'text-indigo-300'}`}>
              {allTasksCompleted ? '+5 PTS' : '+0 / 5'}
            </span>
            <span className="text-[11px] text-indigo-200 uppercase font-bold tracking-wider">
              {allTasksCompleted ? 'UNLOCKED' : 'QUALIFIER'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
