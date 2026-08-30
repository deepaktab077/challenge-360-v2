import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  Shield,
  ShieldOff,
  Trash2,
  KeyRound,
  Eye,
  CheckCircle2,
  XCircle,
  Copy,
  Users,
  Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminCreateUser, adminDeleteUser, adminResetPassword } from '../services/adminApi';
import { updateUserRole, updateUserActive, updateUserGoal, fetchAllTeams, createTeam, deleteTeam, assignUserToTeam } from '../services/dataService';
import { UserProfile, Team } from '../types';

function randomPassword(): string {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6).toUpperCase() + '!1';
}

interface AdminPanelProps {
  onViewUserData: (userId: string) => void;
}

export function AdminPanel({ onViewUserData }: AdminPanelProps) {
  const { allProfiles, refreshProfiles, profile: myProfile } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(randomPassword());
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [newUserTeamId, setNewUserTeamId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamBusy, setTeamBusy] = useState(false);

  const refreshTeams = () => fetchAllTeams().then(setTeams);
  useEffect(() => {
    refreshTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setTeamBusy(true);
    const result = await createTeam(newTeamName.trim());
    setTeamBusy(false);
    if (result.success) {
      setNewTeamName('');
      setShowTeamForm(false);
      await refreshTeams();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!window.confirm(`Delete "${team.name}"? Members keep their scores but lose their team assignment.`)) return;
    setTeamBusy(true);
    const result = await deleteTeam(team.id);
    setTeamBusy(false);
    if (result.success) {
      await refreshTeams();
      await refreshProfiles();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleAssignTeam = async (userId: string, teamId: string) => {
    setBusyUserId(userId);
    await assignUserToTeam(userId, teamId || null);
    await refreshProfiles();
    setBusyUserId(null);
  };

  const handleGoalChange = async (userId: string, goal: number) => {
    if (!Number.isFinite(goal) || goal < 0) return;
    setBusyUserId(userId);
    await updateUserGoal(userId, goal);
    await refreshProfiles();
    setBusyUserId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const result = await adminCreateUser({ email: email.trim(), password, fullName: fullName.trim(), role });
    if (result.success && result.userId && newUserTeamId) {
      await assignUserToTeam(result.userId, newUserTeamId);
    }
    setSubmitting(false);
    if (result.success) {
      setMessage({
        type: 'success',
        text: `Created ${email}. Share this password with them: ${password}`,
      });
      setFullName('');
      setEmail('');
      setPassword(randomPassword());
      setRole('user');
      setNewUserTeamId('');
      setShowCreateForm(false);
      await refreshProfiles();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleToggleRole = async (u: UserProfile) => {
    setBusyUserId(u.id);
    await updateUserRole(u.id, u.role === 'admin' ? 'user' : 'admin');
    await refreshProfiles();
    setBusyUserId(null);
  };

  const handleToggleActive = async (u: UserProfile) => {
    setBusyUserId(u.id);
    await updateUserActive(u.id, !u.isActive);
    await refreshProfiles();
    setBusyUserId(null);
  };

  const handleDelete = async (u: UserProfile) => {
    if (!window.confirm(`Permanently delete ${u.email}? This removes their account and all their data.`)) return;
    setBusyUserId(u.id);
    const result = await adminDeleteUser(u.id);
    setBusyUserId(null);
    if (result.success) {
      await refreshProfiles();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleResetPassword = async (u: UserProfile) => {
    const newPassword = randomPassword();
    if (!window.confirm(`Reset password for ${u.email} to a new temporary password?`)) return;
    setBusyUserId(u.id);
    const result = await adminResetPassword(u.id, newPassword);
    setBusyUserId(null);
    if (result.success) {
      setMessage({ type: 'success', text: `New password for ${u.email}: ${newPassword}` });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Admin — Manage Participants
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create accounts for challenge participants and manage their access. Signed in as{' '}
            <span className="font-semibold">{myProfile?.email}</span>.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          New Participant
        </button>
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{message.text}</span>
          {message.type === 'success' && message.text.includes(':') && (
            <button
              onClick={() => navigator.clipboard.writeText(message.text.split(': ').pop() || '')}
              className="text-emerald-400 hover:text-emerald-200"
              title="Copy password"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* TEAMS MANAGEMENT */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Teams
          </h2>
          <button
            onClick={() => setShowTeamForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            <Plus className="w-3.5 h-3.5" />
            New Team
          </button>
        </div>

        {showTeamForm && (
          <form onSubmit={handleCreateTeam} className="flex items-center gap-2 mb-4">
            <input
              autoFocus
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name (e.g. Team Delta)"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800 text-slate-100 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={teamBusy}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Add
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {teams.map((t) => {
            const memberCount = allProfiles.filter((p) => p.teamId === t.id).length;
            return (
              <span
                key={t.id}
                className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-800"
              >
                {t.name}
                <span className="text-slate-400 font-normal">({memberCount})</span>
                <button
                  onClick={() => handleDeleteTeam(t)}
                  disabled={teamBusy}
                  className="w-4 h-4 rounded-full bg-slate-700 hover:bg-rose-200 text-slate-500 hover:text-rose-400 flex items-center justify-center"
                  title="Delete team"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
          {teams.length === 0 && <p className="text-xs text-slate-400">No teams yet — create one above.</p>}
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800 text-slate-100 placeholder-slate-500"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800 text-slate-100 placeholder-slate-500"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Temporary Password</label>
              <div className="flex gap-2">
                <input
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800 text-slate-100 placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setPassword(randomPassword())}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-400 hover:bg-slate-900/50"
                >
                  Regenerate
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800 text-slate-100 placeholder-slate-500"
              >
                <option value="user">Participant</option>
                <option value="admin">Admin (Super User)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Team</label>
              <select
                value={newUserTeamId}
                onChange={(e) => setNewUserTeamId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800 text-slate-100 placeholder-slate-500"
              >
                <option value="">Unassigned</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Team</th>
              <th className="text-left px-4 py-3">Goal</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {allProfiles.map((u) => (
              <tr key={u.id} className="hover:bg-slate-900/50">
                <td className="px-4 py-3 font-medium text-slate-200">{u.fullName || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.teamId || ''}
                    disabled={busyUserId === u.id}
                    onChange={(e) => handleAssignTeam(u.id, e.target.value)}
                    className="text-xs font-semibold border border-slate-800 rounded-lg px-2 py-1 bg-slate-900 text-slate-300 max-w-[130px]"
                  >
                    <option value="">Unassigned</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    step={10}
                    defaultValue={u.goalPoints}
                    disabled={busyUserId === u.id}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (v !== u.goalPoints) handleGoalChange(u.id, v);
                    }}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-xs font-semibold"
                  />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === 'admin' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {u.role === 'admin' ? 'Admin' : 'Participant'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    <button
                      onClick={() => onViewUserData(u.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800"
                      title="View scorecard"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      disabled={busyUserId === u.id}
                      onClick={() => handleToggleRole(u)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 disabled:opacity-50"
                      title={u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                    >
                      {u.role === 'admin' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </button>
                    <button
                      disabled={busyUserId === u.id}
                      onClick={() => handleToggleActive(u)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 disabled:opacity-50"
                      title={u.isActive ? 'Disable account' : 'Enable account'}
                    >
                      {u.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <button
                      disabled={busyUserId === u.id}
                      onClick={() => handleResetPassword(u)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 disabled:opacity-50"
                      title="Reset password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    {u.id !== myProfile?.id && (
                      <button
                        disabled={busyUserId === u.id}
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 disabled:opacity-50"
                        title="Delete account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {allProfiles.length === 0 && (
          <div className="text-center py-10 text-sm text-slate-400">No participants yet. Create the first one above.</div>
        )}
      </div>
    </div>
  );
}
