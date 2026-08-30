import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  Gift, 
  CheckCircle2, 
  Calendar, 
  Award, 
  Sparkles,
  HelpingHand,
  Clock,
  DollarSign
} from 'lucide-react';
import { MonthlyCharityRecord } from '../types';
import { formatMonthName, getTodayDateStr } from '../utils/dateUtils';

interface MonthlyCharityModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string; // "YYYY-MM"
  charityRecords: MonthlyCharityRecord[];
  onSaveCharityRecord: (record: MonthlyCharityRecord) => void;
}

export const MonthlyCharityModal: React.FC<MonthlyCharityModalProps> = ({
  isOpen,
  onClose,
  monthKey,
  charityRecords,
  onSaveCharityRecord,
}) => {
  const currentRecord = charityRecords.find((r) => r.monthKey === monthKey);

  const [completed, setCompleted] = useState(currentRecord?.completed ?? false);
  const [title, setTitle] = useState(currentRecord?.title || '');
  const [category, setCategory] = useState<MonthlyCharityRecord['category']>(
    currentRecord?.category || 'volunteering'
  );
  const [amountOrHours, setAmountOrHours] = useState(currentRecord?.amountOrHours || '');
  const [notes, setNotes] = useState(currentRecord?.notes || '');
  const [completedDate, setCompletedDate] = useState(
    currentRecord?.completedDate || getTodayDateStr()
  );

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCharityRecord({
      id: currentRecord?.id || 'charity_' + monthKey,
      monthKey,
      completed: true,
      title: title.trim() || 'Monthly Charity Act',
      category,
      amountOrHours: amountOrHours.trim(),
      notes: notes.trim(),
      completedDate,
    });
    onClose();
  };

  const handleToggleStatus = () => {
    if (completed) {
      // Mark pending
      setCompleted(false);
      onSaveCharityRecord({
        id: currentRecord?.id || 'charity_' + monthKey,
        monthKey,
        completed: false,
        title: title || '',
        category,
        amountOrHours: amountOrHours || '',
        notes: notes || '',
        completedDate,
      });
    } else {
      setCompleted(true);
    }
  };

  // Generate last 12 months for year at a glance
  const [currentYearStr, currentMonthStr] = monthKey.split('-');
  const year = parseInt(currentYearStr);
  const monthKeysInYear: string[] = [];
  for (let m = 1; m <= 12; m++) {
    monthKeysInYear.push(`${year}-${String(m).padStart(2, '0')}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800/60 bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-600 flex items-center justify-center border border-pink-500/30">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-100">Charity: Monthly Qualifier</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-pink-500/15 text-pink-400 border border-pink-500/30">
                  Heart Pillar
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Rule: "Heart: 10 points (Family Connection: 10, Charity: Monthly qualifier)"
              </p>
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
          
          {/* Active Month Qualifier Card */}
          <div className={`p-5 rounded-2xl border transition-all ${
            completed
              ? 'bg-pink-500/10 border-pink-500/30 shadow-sm'
              : 'bg-slate-800/40 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/70">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-pink-600">
                  Active Month Qualifier
                </span>
                <h4 className="text-xl font-black text-slate-100 mt-0.5">
                  {formatMonthName(monthKey)}
                </h4>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="toggle-charity-qualified-btn"
                  onClick={handleToggleStatus}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                    completed
                      ? 'bg-pink-600 text-white shadow-pink-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{completed ? 'Monthly Qualifier: Completed ✓' : 'Mark as Qualified'}</span>
                </button>
              </div>
            </div>

            {/* Log / Edit Form */}
            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Charitable Act / Giving Project Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Volunteer at local soup kitchen & education aid donation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="volunteering">Volunteering / Service</option>
                    <option value="donation">Financial Donation</option>
                    <option value="food_aid">Food & Essential Supplies Aid</option>
                    <option value="community">Community / Mentorship</option>
                    <option value="other">Other Act of Kindness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Hours / Contribution</label>
                  <input
                    type="text"
                    placeholder="e.g. 4 hours / $100"
                    value={amountOrHours}
                    onChange={(e) => setAmountOrHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Date Completed</label>
                  <input
                    type="date"
                    value={completedDate}
                    onChange={(e) => setCompletedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Impact Notes</label>
                <textarea
                  rows={2}
                  placeholder="Details of the initiative, who was helped, reflection..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 transition-colors"
                >
                  Save Monthly Qualifier Details
                </button>
              </div>
            </form>
          </div>

          {/* Year-At-A-Glance Monthly Qualifiers Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{year} Year Qualifier Tracker</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {monthKeysInYear.map((mKey) => {
                const rec = charityRecords.find((r) => r.monthKey === mKey);
                const isCurMonth = mKey === monthKey;
                const isQual = rec?.completed;

                return (
                  <div
                    key={mKey}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isQual
                        ? 'bg-pink-500/10 border-pink-500/30 text-pink-200 font-bold'
                        : isCurMonth
                        ? 'bg-amber-500/10 border-amber-300 text-amber-200 font-bold'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold block">
                      {new Date(mKey + '-01T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-[11px] mt-1 font-semibold flex items-center justify-center gap-1">
                      {isQual ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-pink-600" />
                          <span className="text-pink-400">Qualified</span>
                        </>
                      ) : isCurMonth ? (
                        <span className="text-amber-400 font-bold">In Progress</span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
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
