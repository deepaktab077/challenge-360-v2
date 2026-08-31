import React, { useEffect, useState } from 'react';
import { Lock, Mail, User, UserPlus, AlertCircle, Users, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllTeams } from '../services/dataService';
import { Team } from '../types';
import { TEAMS_ENABLED } from '../constants/features';

interface SignupProps {
  onSwitchToLogin: () => void;
}

export function Signup({ onSwitchToLogin }: SignupProps) {
  const { signUp } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (TEAMS_ENABLED) fetchAllTeams().then(setTeams);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (submitting) return; // prevent duplicate submissions while the request is in progress

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const result = await signUp(normalizedEmail, password, fullName.trim(), teamId || null);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Email confirmation is disabled, so Supabase has created an active
    // session. AuthContext will load the profile and the app will open normally.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg mb-4">
            <span className="text-white font-black text-xl">360°</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Join Challenge 360</h1>
          <p className="text-slate-500 text-sm mt-1">Body · Mind · Heart · Soul</p>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-800 text-slate-100 placeholder-slate-500"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-800 text-slate-100 placeholder-slate-500"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">Use a valid email address. No verification email is sent during signup.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-800 text-slate-100 placeholder-slate-500"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {TEAMS_ENABLED && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Team</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-slate-900 text-slate-100"
                  >
                    <option value="">Not sure yet — I'll pick later</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-rose-600 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="font-semibold text-indigo-600 hover:underline">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
