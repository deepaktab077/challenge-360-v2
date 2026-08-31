import React from 'react';
import { X, Users, CheckCircle2 } from 'lucide-react';
import { GroupWorkout } from '../types';
import { getWeekRange, formatDisplayDate, getTodayDateStr } from '../utils/dateUtils';
import { MORNING_WORKOUT_BONUS_POINTS } from '../constants/rules';

interface GroupWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  workouts: GroupWorkout[];
  onAddWorkout: (workout: Omit<GroupWorkout, 'id' | 'createdAt'>) => void;
  onDeleteWorkout: (id: string) => void;
  weekAlreadyHasBonus?: boolean;
}

export const GroupWorkoutModal: React.FC<GroupWorkoutModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  workouts,
  onAddWorkout,
  onDeleteWorkout,
}) => {
  if (!isOpen) return null;

  const currentWeek = getWeekRange(selectedDate);
  const thisWeekWorkouts = workouts.filter((w) => currentWeek.days.includes(w.date));
  const thisWeekEntry = thisWeekWorkouts.find((w) => w.isMorning);
  const thisWeekBonus = thisWeekEntry ? MORNING_WORKOUT_BONUS_POINTS : 0;

  const handleToggleThisWeek = () => {
    if (thisWeekEntry) {
      onDeleteWorkout(thisWeekEntry.id);
      return;
    }
    onAddWorkout({
      title: 'Morning Group Workout',
      groupName: 'Group',
      workoutType: 'Group Session',
      durationMinutes: 45,
      date: getTodayDateStr(),
      isMorning: true,
      notes: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800/60 bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/30 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Morning Group Workout</h3>
              <p className="text-xs text-slate-500">Once per week, any day — +{MORNING_WORKOUT_BONUS_POINTS} pts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          <p className="text-xs text-slate-400">
            Did a morning group workout with your team this week? Just flip the switch — no details or screenshot
            needed. Only one session counts toward the bonus per week.
          </p>

          <button
            onClick={handleToggleThisWeek}
            className={`w-full flex items-center justify-between gap-3 p-5 rounded-2xl border-2 transition-all ${
              thisWeekEntry
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="text-left">
              <p className="text-sm font-bold text-slate-100">
                {thisWeekEntry ? "Done — you're getting the bonus!" : 'Mark this week as done'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDisplayDate(currentWeek.start)} – {formatDisplayDate(currentWeek.end)}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                thisWeekEntry ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </button>

          <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3">
            <span className="text-xs font-semibold text-slate-400">This week's bonus</span>
            <span className="text-lg font-black text-amber-400">+{thisWeekBonus} pts</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800/60 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
