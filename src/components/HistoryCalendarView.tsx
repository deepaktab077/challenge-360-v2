import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Flame,
  Activity,
  Brain,
  Heart
} from 'lucide-react';
import { DailyLog } from '../types';
import { calculateDailyScore } from '../constants/rules';
import { formatIsoDate, formatMonthName, formatDisplayDate, getTodayDateStr } from '../utils/dateUtils';

interface HistoryCalendarViewProps {
  dailyLogs: Record<string, DailyLog>;
  onSelectDateAndSwitch: (date: string) => void;
}

export const HistoryCalendarView: React.FC<HistoryCalendarViewProps> = ({
  dailyLogs,
  onSelectDateAndSwitch,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [inspectedDate, setInspectedDate] = useState<string>(getTodayDateStr());

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const todayStr = getTodayDateStr();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build grid days for current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun, 1 is Mon...
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarCells: Array<{ dateStr: string; dayNumber: number; isCurrentMonth: boolean }> = [];

  // Previous month padding
  const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDaysCount - i;
    const dateObj = new Date(currentYear, currentMonth - 1, d);
    calendarCells.push({
      dateStr: formatIsoDate(dateObj),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    calendarCells.push({
      dateStr: formatIsoDate(dateObj),
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill out 35 or 42 grid cells
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const dateObj = new Date(currentYear, currentMonth + 1, d);
    calendarCells.push({
      dateStr: formatIsoDate(dateObj),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  const inspectedLog = dailyLogs[inspectedDate];
  const inspectedScore = calculateDailyScore(inspectedLog);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Calendar Top Header */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30 flex-shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white tracking-tight truncate">
                {formatMonthName(monthKey)}
              </h3>
              <p className="text-xs text-slate-400 truncate">Pillar Score Calendar & Day Completion History</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setCurrentYear(today.getFullYear());
                setCurrentMonth(today.getMonth());
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors whitespace-nowrap"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-6 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 mt-3">
          {calendarCells.map((cell) => {
            const log = dailyLogs[cell.dateStr];
            const score = calculateDailyScore(log);
            const isSelected = cell.dateStr === inspectedDate;
            const isTargetToday = cell.dateStr === todayStr;
            const isPerfect = score.completeDayBonus > 0;

            return (
              <div
                key={cell.dateStr}
                onClick={() => setInspectedDate(cell.dateStr)}
                className={`min-h-[70px] sm:min-h-[85px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-amber-400 border-amber-400/80 bg-slate-850 shadow-lg'
                    : isTargetToday
                    ? 'border-emerald-500/60 bg-slate-800/80'
                    : cell.isCurrentMonth
                    ? 'border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/60'
                    : 'border-slate-900 bg-slate-950/20 opacity-40 hover:opacity-70'
                }`}
              >
                {/* Cell Header: Day Number + Today tag */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isSelected ? 'text-amber-300 font-extrabold' : isTargetToday ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {cell.dayNumber}
                  </span>
                  {isTargetToday && (
                    <span className="text-[9px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-300">
                      Today
                    </span>
                  )}
                </div>

                {/* Score Pill or empty dot */}
                <div className="mt-1">
                  {score.totalDailyScore > 0 ? (
                    <div className={`px-1.5 py-0.5 rounded-lg text-center font-extrabold text-xs shadow-sm flex items-center justify-center gap-1 ${
                      isPerfect
                        ? 'bg-amber-400 text-slate-950 shadow-amber-400/20'
                        : score.totalDailyScore >= 60
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}>
                      {isPerfect && <Trophy className="w-3 h-3 shrink-0" />}
                      <span>{score.totalDailyScore}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 text-center py-1 font-medium">
                      —
                    </div>
                  )}
                </div>

                {/* Micro indicators for pillars */}
                <div className="flex items-center justify-center space-x-1 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${score.bodyScore > 0 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${score.mindScore > 0 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${score.heartScore > 0 ? 'bg-rose-500' : 'bg-slate-800'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${score.soulScore > 0 ? 'bg-amber-500' : 'bg-slate-800'}`} />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Inspected Day Details Drawer */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400">Day Details Inspector</span>
            <h4 className="text-xl font-extrabold text-white mt-0.5">
              {formatDisplayDate(inspectedDate)}
            </h4>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-2xl font-extrabold text-white">
                {inspectedScore.totalDailyScore}
              </span>
              <span className="text-xs text-slate-400 font-semibold block">
                {inspectedScore.completeDayBonus > 0 ? '85 Max (Bonus Included)' : '/ 80 Base Pts'}
              </span>
            </div>

            <button
              onClick={() => onSelectDateAndSwitch(inspectedDate)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <span>Edit Scorecard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pillar Sub-scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <span className="text-emerald-400 font-bold block">Body Prime</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">{inspectedScore.bodyScore} / 40</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <span className="text-indigo-400 font-bold block">Mind Spark</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">{inspectedScore.mindScore} / 20</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <span className="text-rose-400 font-bold block">Heart Pulse</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">{inspectedScore.heartScore} / 10</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <span className="text-amber-400 font-bold block">Soul Glow</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">{inspectedScore.soulScore} / 10</span>
          </div>
        </div>

        {inspectedLog?.notes && (
          <div className="mt-4 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300">
            <strong className="text-slate-400 block mb-0.5">Day Notes:</strong>
            {inspectedLog.notes}
          </div>
        )}
      </div>

    </div>
  );
};
