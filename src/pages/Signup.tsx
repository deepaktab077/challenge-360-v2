import React, { useEffect, useState } from 'react';
import { Lock, Mail, User, UserPlus, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllTeams } from '../services/dataService';
import { Team } from '../types';
import { GoogleIcon } from '../components/GoogleIcon';

interface SignupProps {
  onSwitchToLogin: () => void;
}

export function Signup({ onSwitchToLogin }: SignupProps) {
  const { signUp, signInWithGoogle } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    fetchAllTeams().then(setTeams);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const result = await signUp(email.trim(), password, fullName.trim(), teamId || null);
    setSubmitting(false);

    if (result.error) {
      if (/rate limit/i.test(result.error)) {
        setError(
          'Too many signups too quickly — Supabase\'s free email service limits how many confirmation emails can go out per hour. Wait a few minutes and try again, or ask your admin to set up custom SMTP for higher limits (see INSTALLATION_GUIDE.md).'
        );
      } else {
        setError(result.error);
      }
      return;
    }
    if (result.needsEmailConfirmation) {
      setConfirmationSent(true);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) setError(googleError);
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/30 mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 mb-2">Check your inbox</h1>
          <p className="text-sm text-slate-500 mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come
            back and log in.
          </p>
          <button onClick={onSwitchToLogin} className="text-sm font-semibold text-indigo-600 hover:underline">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

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
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-900/50 text-slate-300 font-semibold text-sm py-2.5 rounded-xl transition-colors"
          >
            <GoogleIcon className="w-4 h-4" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px bg-slate-700 flex-1" />
            or sign up with email
            <div className="h-px bg-slate-700 flex-1" />
          </div>

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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-800 text-slate-100 placeholder-slate-500"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
            </div>

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
