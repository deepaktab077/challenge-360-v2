import React, { useState } from 'react';
import { Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function ResetPassword() {
  const { clearPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) return setError(updateError.message);
    clearPasswordRecovery();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg mb-4"><span className="text-white font-black text-xl">360°</span></div>
          <h1 className="text-2xl font-bold text-slate-100">Set a new password</h1>
          <p className="text-slate-500 text-sm mt-1">Choose a new password for your Challenge 360 account.</p>
        </div>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-xs font-semibold text-slate-400 mb-1.5">New Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-700 text-sm bg-slate-800 text-slate-100" autoComplete="new-password" placeholder="At least 6 characters" /><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label="Toggle password visibility">{showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button></div></div>
            <div><label className="block text-xs font-semibold text-slate-400 mb-1.5">Confirm Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type={showConfirm ? 'text' : 'password'} required minLength={6} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-700 text-sm bg-slate-800 text-slate-100" autoComplete="new-password" placeholder="Repeat your password" /><button type="button" onClick={()=>setShowConfirm(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label="Toggle confirmation visibility">{showConfirm ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button></div></div>
            {error && <div className="flex items-start gap-2 text-rose-500 text-xs bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/><span>{error}</span></div>}
            <button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl">{saving ? 'Updating…' : 'Update Password'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
