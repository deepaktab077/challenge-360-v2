import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Users, Flame, Gift, Loader2, AlertTriangle, Footprints, Brain, Heart, Sparkles, Pencil, Check, Target, RefreshCw } from 'lucide-react';
import {
  fetchIndividualLeaderboard,
  fetchTeamLeaderboard,
  updateUserGoal,
  LeaderboardPeriod,
} from '../services/dataService';
import { IndividualLeaderboardEntry, TeamLeaderboardEntry } from '../types';
import { TEAMS_ENABLED } from '../constants/features';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileModal } from '../components/UserProfileModal';

type Category = 'overall' | 'body' | 'mind' | 'heart' | 'soul' | 'team';

const CATEGORIES: { id: Category; label: string; Icon: React.ElementType }[] = [
  { id: 'overall', label: 'Overall', Icon: Trophy },
  { id: 'body', label: 'Body Prime', Icon: Footprints },
  { id: 'mind', label: 'Mind Spark', Icon: Brain },
  { id: 'heart', label: 'Heart Pulse', Icon: Heart },
  { id: 'soul', label: 'Soul Glow', Icon: Sparkles },
  ...(TEAMS_ENABLED ? [{ id: 'team' as Category, label: 'Teams', Icon: Users }] : []),
];

const PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'Overall' },
];

function scoreFor(entry: IndividualLeaderboardEntry, category: Category): number {
  switch (category) {
    case 'body':
      return entry.bodyScore;
    case 'mind':
      return entry.mindScore;
    case 'heart':
      return entry.heartScore;
    case 'soul':
      return entry.soulScore;
    default:
      return entry.totalScore;
  }
}

interface LeaderboardProps {
  onEditAsAdmin?: (userId: string) => void;
}

export function Leaderboard({ onEditAsAdmin }: LeaderboardProps) {
  const { profile } = useAuth();
  const [category, setCategory] = useState<Category>('overall');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [individuals, setIndividuals] = useState<IndividualLeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<TeamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<IndividualLeaderboardEntry | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const reload = (p: LeaderboardPeriod) => {
    setLoading(true);
    return Promise.all([fetchIndividualLeaderboard(p), fetchTeamLeaderboard(p)]).then(([ind, tm]) => {
      setIndividuals(ind);
      setTeams(tm);
      setLoading(false);
      setLastUpdated(new Date());
    });
  };

  useEffect(() => {
    let cancelled = false;
    reload(period).then(() => {
      if (cancelled) return;
    });
    // Keep standings live for a community challenge — refresh automatically
    // every 45s, plus whenever the tab regains focus (e.g. coming back after
    // logging a day), on top of the manual refresh button.
    const interval = setInterval(() => reload(period), 45000);
    const onFocus = () => reload(period);
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [period]);

  const handleSaveGoal = async () => {
    if (!profile) return;
    const value = parseInt(goalInput, 10);
    if (Number.isFinite(value) && value >= 0) {
      await updateUserGoal(profile.id, value);
      await reload(period);
    }
    setEditingGoal(false);
  };

  const sortedByCategory = useMemo(() => {
    if (category === 'overall') return individuals;
    return [...individuals].sort((a, b) => scoreFor(b, category) - scoreFor(a, category));
  }, [individuals, category]);

  const myEntry = useMemo(() => individuals.find((e) => e.userId === profile?.id), [individuals, profile]);

  const collective = useMemo(() => {
    const totalScore = individuals.reduce((sum, e) => sum + e.totalScore, 0);
    const totalGoal = individuals.reduce((sum, e) => sum + e.goalPoints, 0);
    const pct = totalGoal > 0 ? Math.min(100, Math.round((totalScore / totalGoal) * 100)) : 0;
    return { totalScore, totalGoal, pct };
  }, [individuals]);

  const podiumEntries = [sortedByCategory[1], sortedByCategory[0], sortedByCategory[2]].filter(
    Boolean
  ) as IndividualLeaderboardEntry[];
  const podiumHeights = ['h-20', 'h-28', 'h-16'];
  const podiumMedalColors = ['bg-slate-300', 'bg-amber-400', 'bg-orange-400'];
  const podiumRankOrder = [2, 1, 3];

  return (
    <div className="animate-fadeIn space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          Leaderboard
        </h1>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p className="text-sm text-slate-400">Live standings — everyone can see everyone's progress.</p>
          <button
            onClick={() => reload(period)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-400 transition-colors flex-shrink-0"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Collective goal */}
      <div className="bg-gradient-to-r from-indigo-600/15 to-purple-600/15 border border-indigo-500/20 rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-400" /> Collective Challenge Goal
          </span>
          <span className="text-indigo-300">{collective.pct}% Reached</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full"
            style={{ width: `${collective.pct}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-1.5">
          {collective.totalScore.toLocaleString()} of {collective.totalGoal.toLocaleString()} total points across everyone
        </p>
      </div>

      {/* Period selector */}
      <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              period === p.id ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setCategory(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors ${
              category === id
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {myEntry && category !== 'team' && (
        <div className="bg-gradient-to-r from-emerald-600/20 to-indigo-600/20 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-sm text-slate-100">
              You: #{sortedByCategory.findIndex((e) => e.userId === myEntry.userId) + 1} · {myEntry.totalScore} pts
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {editingGoal ? (
                <>
                  <span>Goal</span>
                  <input
                    autoFocus
                    type="number"
                    min={0}
                    step={10}
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                    className="w-16 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                  />
                  <button onClick={handleSaveGoal} className="text-emerald-400 hover:text-emerald-300">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span>
                    Goal {myEntry.goalPoints} pts · {myEntry.goalProgress}% there
                  </span>
                  <button
                    onClick={() => {
                      setGoalInput(String(myEntry.goalPoints));
                      setEditingGoal(true);
                    }}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
            <div className="w-40 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${myEntry.goalProgress}%` }} />
            </div>
          </div>
          {myEntry.disqualifiedWeeks > 0 && (
            <span className="text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {myEntry.disqualifiedWeeks} week
              {myEntry.disqualifiedWeeks > 1 ? 's' : ''} didn't qualify
            </span>
          )}
          {myEntry.charityQualified && (
            <span className="text-xs font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2.5 py-1.5 rounded-full flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" /> Charity Qualified
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading leaderboard…
        </div>
      ) : category === 'team' ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          {teams.map((t) => (
            <div
              key={t.teamId}
              className={`flex items-center justify-between px-4 py-3.5 border-b border-slate-800 last:border-b-0 ${
                t.teamId === profile?.teamId ? 'bg-emerald-500/5' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-black">
                  {t.rank}
                </span>
                <div>
                  <p className="font-bold text-sm text-slate-100">{t.teamName}</p>
                  <p className="text-xs text-slate-500">
                    {t.memberCount} members · avg {t.averageScorePerMember} pts
                  </p>
                </div>
              </div>
              <span className="font-black text-amber-400">{t.totalScore} pts</span>
            </div>
          ))}
          {teams.length === 0 && (
            <div className="text-center py-10 text-sm text-slate-500">No teams with active members yet.</div>
          )}
        </div>
      ) : (
        <>
          {podiumEntries.length > 0 && (
            <div className="flex items-end justify-center gap-3 px-2 pt-4 pb-2">
              {podiumEntries.map((entry, i) => (
                <button
                  key={entry.userId}
                  onClick={() => setSelectedEntry(entry)}
                  className="flex flex-col items-center flex-1 max-w-[110px]"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm mb-1.5 relative">
                    {entry.fullName[0]?.toUpperCase()}
                    <span
                      className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full ${podiumMedalColors[i]} text-slate-900 text-[10px] font-black flex items-center justify-center border-2 border-slate-950`}
                    >
                      {podiumRankOrder[i]}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-200 text-center truncate w-full">{entry.fullName}</p>
                  <p className="text-[11px] font-black text-amber-400">{scoreFor(entry, category)} pts</p>
                  <div
                    className={`w-full ${podiumHeights[i]} rounded-t-xl mt-2 bg-gradient-to-t flex items-start justify-center pt-2 ${
                      podiumRankOrder[i] === 1
                        ? 'from-amber-600 to-amber-400'
                        : podiumRankOrder[i] === 2
                        ? 'from-slate-600 to-slate-400'
                        : 'from-orange-700 to-orange-500'
                    }`}
                  >
                    <span className="text-white font-black text-lg drop-shadow">#{podiumRankOrder[i]}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            {sortedByCategory.map((e, i) => (
              <button
                key={e.userId}
                onClick={() => setSelectedEntry(e)}
                className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-slate-800 last:border-b-0 text-left hover:bg-slate-800/40 transition-colors ${
                  e.userId === profile?.id ? 'bg-emerald-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-black flex-shrink-0">
                    #{i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-100 truncate">{e.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {TEAMS_ENABLED ? `${e.teamName || 'No team'} · ` : ''}Goal {e.goalProgress}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {e.disqualifiedWeeks > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  {e.perfectDays > 0 && (
                    <span className="hidden sm:flex items-center gap-0.5 text-xs text-amber-400">
                      <Flame className="w-3.5 h-3.5" /> {e.perfectDays}
                    </span>
                  )}
                  <span className="font-black text-amber-400 text-sm">{scoreFor(e, category)} pts</span>
                </div>
              </button>
            ))}
            {sortedByCategory.length === 0 && (
              <div className="text-center py-10 text-sm text-slate-500">No scores logged yet.</div>
            )}
          </div>
        </>
      )}

      {selectedEntry && (
        <UserProfileModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEditAsAdmin={
            onEditAsAdmin
              ? (userId) => {
                  onEditAsAdmin(userId);
                  setSelectedEntry(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
