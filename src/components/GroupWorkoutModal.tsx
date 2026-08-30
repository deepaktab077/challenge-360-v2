import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  Trash2, 
  Dumbbell, 
  Calendar, 
  Clock, 
  Flame, 
  Sparkles,
  CheckCircle2,
  Award
} from 'lucide-react';
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
  weekAlreadyHasBonus,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [groupName, setGroupName] = useState('');
  const [workoutType, setWorkoutType] = useState('Functional Training');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [workoutDate, setWorkoutDate] = useState(selectedDate || getTodayDateStr());
  const [isMorning, setIsMorning] = useState(true);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentWeek = getWeekRange(selectedDate);
  const thisWeekWorkouts = workouts.filter((w) => currentWeek.days.includes(w.date));
  const thisWeekHasMorning = thisWeekWorkouts.some((w) => w.isMorning);
  const thisWeekBonus = thisWeekHasMorning ? MORNING_WORKOUT_BONUS_POINTS : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddWorkout({
      title: title.trim(),
      groupName: groupName.trim() || 'Fitness Tribe',
      workoutType,
      durationMinutes,
      date: workoutDate,
      isMorning,
      notes: notes.trim(),
    });

    setTitle('');
    setGroupName('');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800/60 bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-100">Morning Group Workout Bonus</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  +50 pts / week
                </span>
              </div>
              <p className="text-xs text-slate-500">Rule: +50 bonus for a morning group workout on any one of 3 days — once per week only</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Weekly Status Banner */}
          <div className="bg-indigo-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-indigo-300 flex items-center justify-center font-black text-lg shadow-sm">
                {thisWeekWorkouts.length}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Active Week Workouts</h4>
                <p className="text-xs text-indigo-200">
                  {formatDisplayDate(currentWeek.start)} – {formatDisplayDate(currentWeek.end)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black text-amber-300">
                +{thisWeekBonus}
              </span>
              <span className="text-xs text-indigo-200 font-semibold block">Bonus Points</span>
            </div>
          </div>

          {/* Add Workout Button / Form */}
          {!showAddForm ? (
            <button
              id="show-add-workout-form-btn"
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Group Workout</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-indigo-600" />
                  Log Group Workout Session
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Workout Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saturday 10k Run & Core"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Group / Partner Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Run Club / CrossFit Crew / Gym Buddies"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Workout Type</label>
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Functional Training">Functional Training / HIIT</option>
                    <option value="Running">Running / Trail Run</option>
                    <option value="Cycling">Cycling / Spin Class</option>
                    <option value="CrossFit">CrossFit / Calisthenics</option>
                    <option value="Sports">Team Sports (Basketball, Football, Tennis)</option>
                    <option value="Yoga / Mobility">Group Yoga / Mobility</option>
                    <option value="Other">Other Group Fitness</option>
                  </select>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Date</label>
                      <input
                        type="date"
                        value={workoutDate}
                        onChange={(e) => setWorkoutDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Duration (min)</label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={isMorning}
                      onChange={(e) => setIsMorning(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    This was a morning workout
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notes / Highlights (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pushed personal pace, great team synergy..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 transition-colors"
                >
                  Save Workout
                </button>
              </div>
            </form>
          )}

          {/* Workouts List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Logged Group Workouts ({workouts.length})
            </h4>

            {workouts.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-300">No group workouts logged yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Log a morning group workout to earn a +50 bonus for the week (once/week).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {workouts.map((w) => {
                  const isThisWeek = currentWeek.days.includes(w.date);
                  return (
                    <div
                      key={w.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                        isThisWeek
                          ? 'bg-indigo-500/10 border-indigo-500/30'
                          : 'bg-slate-800/40 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center border border-indigo-500/30 shrink-0 mt-0.5">
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h5 className="text-sm font-bold text-slate-100">{w.title}</h5>
                            {w.isMorning && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                                Morning
                              </span>
                            )}
                            {isThisWeek && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
                                This Week
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {w.workoutType} • {w.groupName} • {w.durationMinutes} min • {formatDisplayDate(w.date)}
                          </p>
                          {w.notes && (
                            <p className="text-xs text-slate-400 italic mt-1 bg-slate-900/80 border border-slate-800/60 px-2.5 py-1 rounded-lg">
                              "{w.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteWorkout(w.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
                        title="Delete workout entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
