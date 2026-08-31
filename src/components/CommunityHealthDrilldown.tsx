import React from 'react';
import { X } from 'lucide-react';
import { IndividualLeaderboardEntry } from '../types';

interface CommunityHealthDrilldownProps {
  entries: IndividualLeaderboardEntry[];
  communityHealthPct: number;
  avgBody: number;
  avgMind: number;
  avgHeart: number;
  avgSoul: number;
  onClose: () => void;
}

export function CommunityHealthDrilldown({
  entries,
  communityHealthPct,
  avgBody,
  avgMind,
  avgHeart,
  avgSoul,
  onClose,
}: CommunityHealthDrilldownProps) {
  const sorted = [...entries].sort((a, b) => b.balanceScore - a.balanceScore);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.6)' }} className="animate-fadeIn">
      <div className="card" style={{ width: '100%', maxWidth: 620, maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: 'var(--chip)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--muted)' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="ey">COMMUNITY HEALTH — HOW IT'S CALCULATED</div>
        <h2>{communityHealthPct}% explained</h2>
        <p className="sub">
          Community Health is the average of every active participant's individual <strong>Balance Score</strong> — the
          same Balance Score shown on their own profile and the leaderboard (average of each pillar's % of its max,
          not raw points). This is the same calculation used everywhere else in the app, just averaged across
          everyone.
        </p>

        <div className="notice" style={{ marginTop: 10, marginBottom: 16 }}>
          {communityHealthPct}% = average of {entries.length} participants' Balance Scores, as of{' '}
          {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        <div className="prow">
          <b>BODY</b>
          <div className="bar">
            <i style={{ width: `${avgBody}%`, background: 'var(--body)' }} />
          </div>
          <span>{avgBody}%</span>
        </div>
        <div className="prow">
          <b>MIND</b>
          <div className="bar">
            <i style={{ width: `${avgMind}%`, background: 'var(--mind)' }} />
          </div>
          <span>{avgMind}%</span>
        </div>
        <div className="prow">
          <b>HEART</b>
          <div className="bar">
            <i style={{ width: `${avgHeart}%`, background: 'var(--heart)' }} />
          </div>
          <span>{avgHeart}%</span>
        </div>
        <div className="prow">
          <b>SOUL</b>
          <div className="bar">
            <i style={{ width: `${avgSoul}%`, background: 'var(--soul)' }} />
          </div>
          <span>{avgSoul}%</span>
        </div>

        <div className="ey" style={{ marginTop: 18, marginBottom: 6 }}>
          PER-PARTICIPANT CONTRIBUTION
        </div>
        <div className="tablewrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Balance Score</th>
                <th>Body</th>
                <th>Mind</th>
                <th>Heart</th>
                <th>Soul</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.userId}>
                  <td>{e.fullName}</td>
                  <td>
                    <b>{e.balanceScore}%</b>
                  </td>
                  <td>{e.bodyScore}/40</td>
                  <td>{e.mindScore}/20</td>
                  <td>{e.heartScore}/10</td>
                  <td>{e.soulScore}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <p className="sub" style={{ padding: 12 }}>No participant data yet.</p>}
        </div>
      </div>
    </div>
  );
}
