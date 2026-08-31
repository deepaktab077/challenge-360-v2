import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Users, Flame, Gift, Loader2, AlertTriangle, Footprints, Brain, Heart, Sparkles, Pencil, Check, Target, RefreshCw } from 'lucide-react';
import {
  fetchIndividualLeaderboard,
  fetchTeamLeaderboard,
  updateUserGoal,
  recordLeaderboardSnapshots,
  fetchPreviousRankSnapshots,
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

/** #8 ↑3 / #4 ↓2 / #5 — since the last recorded snapshot (see reload()). */
function RankMovementBadge({ currentRank, previousRank }: { currentRank: number; previousRank: number | undefined }) {
  if (previousRank === undefined) return null; // no prior snapshot yet (e.g. brand new participant)
  const delta = previousRank - currentRank; // positive = moved up
  if (delta === 0) {
    return (
      <span className="sub" style={{ fontWeight: 700 }} title="No change since last snapshot">
        —
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      style={{ fontWeight: 800, fontSize: 11, color: up ? 'var(--body)' : 'var(--danger)' }}
      title={`${up ? 'Up' : 'Down'} ${Math.abs(delta)} since last snapshot`}
    >
      {up ? '↑' : '↓'}
      {Math.abs(delta)}
    </span>
  );
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
  const [previousRanks, setPreviousRanks] = useState<Map<string, number>>(new Map());

  const reload = (p: LeaderboardPeriod) => {
    setLoading(true);
    return Promise.all([fetchIndividualLeaderboard(p), fetchTeamLeaderboard(p)]).then(([ind, tm]) => {
      setIndividuals(ind);
      setTeams(tm);
      setLoading(false);
      setLastUpdated(new Date());

      // Rank movement is tracked against the "Overall" (all-time) standing
      // only — that's the stable identity "current rank" naturally refers
      // to. Week/Month views intentionally don't record or show movement,
      // since their ranking resets each period and would corrupt the trend.
      if (p === 'all' && ind.length > 0) {
        recordLeaderboardSnapshots(ind.map((e) => ({ userId: e.userId, rank: e.rank, totalScore: e.totalScore })));
        fetchPreviousRankSnapshots().then(setPreviousRanks);
      }
    });
  };

  useEffect(() => {
    let cancelled = false;
    reload(period).then(() => {
      if (cancelled) return;
    });
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
  const podiumHeights = [72, 100, 58];
  const podiumRankOrder = [2, 1, 3];
  const podiumColors = ['linear-gradient(var(--muted),var(--ink))', 'linear-gradient(var(--gold),#c99a5f)', 'linear-gradient(#b5734a,#8a5636)'];

  return (
    <div className="animate-fadeIn" style={{ display: 'grid', gap: 16 }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="sub" style={{ margin: 0 }}>Live standings — everyone can see everyone's progress.</p>
        <button
          onClick={() => reload(period)}
          disabled={loading}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '6px 10px' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Refresh'}
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <span className="ey" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target className="w-3.5 h-3.5" /> COLLECTIVE CHALLENGE GOAL
          </span>
          <b style={{ color: 'var(--ink)', fontSize: 13 }}>{collective.pct}% Reached</b>
        </div>
        <div className="bar">
          <i style={{ width: `${collective.pct}%`, background: 'var(--gold)' }} />
        </div>
        <p className="sub" style={{ marginTop: 8 }}>
          {collective.totalScore.toLocaleString()} of {collective.totalGoal.toLocaleString()} total points across everyone
        </p>
      </div>

      <div className="choices" style={{ margin: 0 }}>
        {PERIODS.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id)} className={`choice ${period === p.id ? 'on' : ''}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="choices" style={{ margin: 0 }}>
        {CATEGORIES.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setCategory(id)} className={`choice ${category === id ? 'on' : ''}`}>
            <Icon className="w-3.5 h-3.5 inline mr-1" style={{ verticalAlign: -2 }} />
            {label}
          </button>
        ))}
      </div>

      {myEntry && category !== 'team' && (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              You: #{sortedByCategory.findIndex((e) => e.userId === myEntry.userId) + 1} · {myEntry.totalScore} pts
              {category === 'overall' && period === 'all' && (
                <RankMovementBadge currentRank={myEntry.rank} previousRank={previousRanks.get(myEntry.userId)} />
              )}
            </p>
            <div className="flex items-center gap-1.5 sub" style={{ marginTop: 2 }}>
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
                    className="field-input"
                    style={{ width: 70, padding: '3px 6px', fontSize: 12 }}
                  />
                  <button onClick={handleSaveGoal} style={{ background: 'none', border: 'none', color: 'var(--body)', cursor: 'pointer' }}>
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
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
            <div className="bar" style={{ width: 160, marginTop: 6 }}>
              <i style={{ width: `${myEntry.goalProgress}%`, background: 'var(--body)' }} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {myEntry.disqualifiedWeeks > 0 && (
              <span className="tag" style={{ color: 'var(--danger)' }}>
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> {myEntry.disqualifiedWeeks} week
                {myEntry.disqualifiedWeeks > 1 ? 's' : ''} didn't qualify
              </span>
            )}
            {myEntry.charityQualified && (
              <span className="tag">
                <Gift className="w-3.5 h-3.5 inline mr-1" /> Charity Qualified
              </span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="sub" style={{ textAlign: 'center', padding: '48px 0' }}>
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading leaderboard…
        </div>
      ) : category === 'team' ? (
        <div className="card" style={{ padding: 0 }}>
          {teams.map((t) => (
            <div
              key={t.teamId}
              className="list-row"
              style={{ padding: '13px 16px', background: t.teamId === profile?.teamId ? 'var(--chip)' : 'transparent' }}
            >
              <div className="avatar">{t.rank}</div>
              <div className="grow">
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', margin: 0 }}>{t.teamName}</p>
                <p className="sub" style={{ margin: 0 }}>
                  {t.memberCount} members · avg {t.averageScorePerMember} pts
                </p>
              </div>
              <b style={{ color: 'var(--gold)' }}>{t.totalScore} pts</b>
            </div>
          ))}
          {teams.length === 0 && <div className="sub" style={{ textAlign: 'center', padding: 28 }}>No teams with active members yet.</div>}
        </div>
      ) : (
        <>
          {podiumEntries.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, padding: '8px 0' }}>
              {podiumEntries.map((entry, i) => (
                <button
                  key={entry.userId}
                  onClick={() => setSelectedEntry(entry)}
                  style={{ background: 'none', border: 0, cursor: 'pointer', flex: 1, maxWidth: 120, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <div className="avatar" style={{ width: 46, height: 46, fontSize: 14, position: 'relative' }}>
                    {entry.fullName[0]?.toUpperCase()}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', textAlign: 'center', margin: '6px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {entry.fullName}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)', margin: 0 }}>{scoreFor(entry, category)} pts</p>
                  <div
                    style={{
                      width: '100%',
                      height: podiumHeights[i],
                      borderRadius: '14px 14px 0 0',
                      marginTop: 8,
                      background: podiumColors[i],
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      paddingTop: 8,
                    }}
                  >
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>#{podiumRankOrder[i]}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="card" style={{ padding: 0 }}>
            {sortedByCategory.map((e, i) => (
              <button
                key={e.userId}
                onClick={() => setSelectedEntry(e)}
                className="list-row"
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  background: e.userId === profile?.id ? 'var(--chip)' : 'transparent',
                  border: 0,
                  borderTop: '1px solid var(--line)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span className="avatar" style={{ fontSize: 11 }}>#{i + 1}</span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.fullName}
                  </p>
                  <p className="sub" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {TEAMS_ENABLED ? `${e.teamName || 'No team'} · ` : ''}Goal {e.goalProgress}%
                  </p>
                </div>
                {category === 'overall' && period === 'all' && (
                  <RankMovementBadge currentRank={e.rank} previousRank={previousRanks.get(e.userId)} />
                )}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {e.disqualifiedWeeks > 0 && <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />}
                  {e.perfectDays > 0 && (
                    <span className="sub" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Flame className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} /> {e.perfectDays}
                    </span>
                  )}
                  <b style={{ color: 'var(--gold)', fontSize: 13 }}>{scoreFor(e, category)} pts</b>
                </div>
              </button>
            ))}
            {sortedByCategory.length === 0 && (
              <div className="sub" style={{ textAlign: 'center', padding: 28 }}>No scores logged yet.</div>
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
