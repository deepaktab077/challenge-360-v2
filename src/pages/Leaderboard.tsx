import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Users, Flame, Gift, Loader2, AlertTriangle, Footprints, Brain, Heart, Sparkles, Pencil, Check } from 'lucide-react';
import { fetchIndividualLeaderboard, fetchTeamLeaderboard, updateUserGoal } from '../services/dataService';
import { IndividualLeaderboardEntry, TeamLeaderboardEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';

type Category = 'overall' | 'body' | 'mind' | 'heart' | 'soul' | 'team';

const CATEGORIES: { id: Category; label: string; Icon: React.ElementType }[] = [
  { id: 'overall', label: 'Overall', Icon: Trophy },
  { id: 'body', label: 'Body Masters', Icon: Footprints },
  { id: 'mind', label: 'Mind Sages', Icon: Brain },
  { id: 'heart', label: 'Heart Healers', Icon: Heart },
  { id: 'soul', label: 'Soul Seekers', Icon: Sparkles },
  { id: 'team', label: 'Teams', Icon: Users },
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

function Podium({ top3, category }: { top3: IndividualLeaderboardEntry[]; category: Category }) {
  if (top3.length === 0) return null;
  const [first, second, third] = top3;
  const order = [second, first, third].filter(Boolean);
  const heights = ['h-20', 'h-28', 'h-16'];
  const medalColors = ['bg-slate-300', 'bg-amber-400', 'bg-orange-400'];
  const rankOrder = [2, 1, 3];

  return (
    <div className="flex items-end justify-center gap-3 px-2 pt-4 pb-2">
      {order.map((entry, i) => (
        <div key={entry.userId} className="flex flex-col items-center flex-1 max-w-[110px]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm mb-1.5 relative">
            {entry.fullName[0]?.toUpperCase()}
            <span
              className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full ${medalColors[i]} text-slate-900 text-[10px] font-black flex items-center justify-center border-2 border-slate-950`}
            >
              {rankOrder[i]}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-200 text-center truncate w-full">{entry.fullName}</p>
          <p className="text-[11px] font-black text-amber-400">{scoreFor(entry, category)} pts</p>
          <div
            className={`w-full ${heights[i]} rounded-t-xl mt-2 bg-gradient-to-t ${
              rankOrder[i] === 1
                ? 'from-amber-600 to-amber-400'
                : rankOrder[i] === 2
                ? 'from-slate-600 to-slate-400'
                : 'from-orange-700 to-orange-500'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export function Leaderboard() {
  const { profile } = useAuth();
  const [category, setCategory] = useState<Category>('overall');
  const [individuals, setIndividuals] = useState<IndividualLeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<TeamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const reload = () => {
    setLoading(true);
    return Promise.all([fetchIndividualLeaderboard(), fetchTeamLeaderboard()]).then(([ind, tm]) => {
      setIndividuals(ind);
      setTeams(tm);
      setLoading(false);
    });
  };

  useEffect(() => {
    let cancelled = false;
    reload().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveGoal = async () => {
    if (!profile) return;
    const value = parseInt(goalInput, 10);
    if (Number.isFinite(value) && value >= 0) {
      await updateUserGoal(profile.id, value);
      await reload();
    }
    setEditingGoal(false);
  };

  const sortedByCategory = useMemo(() => {
    if (category === 'overall') return individuals;
    return [...individuals].sort((a, b) => scoreFor(b, category) - scoreFor(a, category));
  }, [individuals, category]);

  const myEntry = useMemo(() => individuals.find((e) => e.userId === profile?.id), [individuals, profile]);

  return (
    <div className="animate-fadeIn space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          Leaderboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">Live standings — everyone can see everyone's progress.</p>
      </div>

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
          <Podium top3={sortedByCategory.slice(0, 3)} category={category} />
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            {sortedByCategory.map((e, i) => (
              <div
                key={e.userId}
                className={`flex items-center justify-between px-4 py-3.5 border-b border-slate-800 last:border-b-0 ${
                  e.userId === profile?.id ? 'bg-emerald-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-black flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-100 truncate">{e.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {e.teamName || 'No team'} · Goal {e.goalProgress}%
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
              </div>
            ))}
            {sortedByCategory.length === 0 && (
              <div className="text-center py-10 text-sm text-slate-500">No scores logged yet.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
