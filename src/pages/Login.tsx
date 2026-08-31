import React, { useState, useEffect } from 'react';
import { Lock, Mail, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface LoginProps {
  onSwitchToSignup: () => void;
}

export function Login({ onSwitchToSignup }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const t = setInterval(() => setResetCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resetCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (signInError) setError(signInError);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email above first, then tap "Forgot password".');
      return;
    }
    if (resetSending || resetCooldown > 0) return; // avoid duplicate/rapid-fire requests

    setError(null);
    setResetSending(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setResetSending(false);

    if (resetError) {
      if (/rate limit/i.test(resetError.message)) {
        setError(
          "Too many email requests too quickly — Supabase's free email service limits how many can go out per hour. Please wait before trying again."
        );
        setResetCooldown(60);
      } else {
        setError(resetError.message);
      }
      return;
    }
    setResetSent(true);
    setResetCooldown(60);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg mb-4">
            <span className="text-white font-black text-xl">360°</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Challenge 360</h1>
          <p className="text-slate-500 text-sm mt-1">Body · Mind · Heart · Soul</p>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
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
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-800 text-slate-100 placeholder-slate-500"
                placeholder="••••••••"
                autoComplete="current-password"
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

          {error && (
            <div className="flex items-start gap-2 text-rose-600 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetSent && (
            <div className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5">
              Password reset email sent — check your inbox.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-300"
          >
            Forgot password?
          </button>
        </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          New here?{' '}
          <button onClick={onSwitchToSignup} className="font-semibold text-indigo-600 hover:underline">
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
