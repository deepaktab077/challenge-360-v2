import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { formatDisplayDate, formatDayName, isToday, addDays, getTodayDateStr } from '../utils/dateUtils';
import { DailyLog } from '../types';
import { calculateDailyScore } from '../constants/rules';

interface DateNavigatorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dailyLogs: Record<string, DailyLog>;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  onSelectDate,
  dailyLogs,
}) => {
  const isCurrentToday = isToday(selectedDate);
  const todayStr = getTodayDateStr();

  // Generate 7-day strip centered or leading up to selected date
  const stripDates: string[] = [];
  for (let i = -4; i <= 2; i++) {
    stripDates.push(addDays(selectedDate, i));
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* Main Date Display & Navigation Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-start">
          
          <button
            id="prev-day-btn"
            onClick={() => onSelectDate(addDays(selectedDate, -1))}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <h2 className="text-lg sm:text-xl font-black text-indigo-300 tracking-tight">
                {formatDisplayDate(selectedDate)}
              </h2>
              {isCurrentToday && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {formatDayName(selectedDate)} Alignment
            </p>
          </div>

          <button
            id="next-day-btn"
            onClick={() => onSelectDate(addDays(selectedDate, 1))}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {!isCurrentToday && (
            <button
              id="jump-today-btn"
              onClick={() => onSelectDate(todayStr)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
              title="Jump back to today"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>
          )}
        </div>

        {/* Mini 7-Day Day Selector Strip */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1 max-w-full">
          {stripDates.map((dateStr) => {
            const isSelected = dateStr === selectedDate;
            const isTargetToday = dateStr === todayStr;
            const log = dailyLogs[dateStr];
            const score = calculateDailyScore(log);
            const d = new Date(dateStr + 'T00:00:00');
            const dayLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
            const dayNum = d.getDate();

            return (
              <button
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                id={`date-pill-${dateStr}`}
                className={`flex flex-col items-center justify-center w-10 sm:w-11 py-1.5 rounded-xl text-xs transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-300 shadow-md shadow-indigo-100 scale-105'
                    : isTargetToday
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-300 hover:bg-emerald-500/15'
                    : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-100' : isTargetToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {dayLetter}
                </span>
                <span className="font-extrabold text-xs sm:text-sm my-0.5">
                  {dayNum}
                </span>
                
                {/* Score or indicator badge */}
                <div className="h-4 flex items-center justify-center">
                  {score.totalDailyScore > 0 ? (
                    <span 
                      className={`text-[9px] font-black px-1 rounded ${
                        score.completeDayBonus > 0
                          ? isSelected
                            ? 'bg-amber-300 text-slate-950'
                            : 'bg-amber-400 text-slate-950'
                          : isSelected
                          ? 'bg-indigo-800 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {score.totalDailyScore}
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  )}
                </div>
              </button>
            );
          })}

          {/* Quick Date Picker */}
          <div className="relative pl-1">
            <label 
              htmlFor="date-picker-input" 
              className="p-2 rounded-xl bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 cursor-pointer flex items-center justify-center transition-colors"
              title="Pick a custom date"
            >
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                id="date-picker-input"
                value={selectedDate}
                onChange={(e) => e.target.value && onSelectDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>

      </div>
    </div>
  );
};
