import React, { useEffect, useState } from 'react';
import { Users, CheckCircle2, X } from 'lucide-react';
import { fetchAllTeams, assignUserToTeam, updateUserName } from '../services/dataService';
import { Team } from '../types';

interface CompleteProfileModalProps {
  userId: string;
  currentName: string;
  onDone: () => void;
  onDismiss: () => void;
}

export function CompleteProfileModal({ userId, currentName, onDone, onDismiss }: CompleteProfileModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [fullName, setFullName] = useState(currentName || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllTeams().then(setTeams);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (fullName.trim()) await updateUserName(userId, fullName.trim());
    if (teamId) await assignUserToTeam(userId, teamId);
    setSubmitting(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/30 mb-4">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Welcome to Challenge 360!</h2>
        <p className="text-sm text-slate-500 mt-1 mb-5">
          One last step — confirm your name and pick your team so your scores count toward the right leaderboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800 text-slate-100 placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Team</label>
            <select
              required
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900 text-slate-100"
            >
              <option value="" disabled>
                Select your team…
              </option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? 'Saving…' : "Let's go"}
          </button>
          <button type="button" onClick={onDismiss} className="w-full text-center text-xs text-slate-500 hover:text-slate-300">
            I'll do this later
          </button>
        </form>
      </div>
    </div>
  );
}
