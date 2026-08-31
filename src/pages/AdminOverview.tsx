import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { fetchIndividualLeaderboard, buildAdminDashboardCsv } from '../services/dataService';
import { IndividualLeaderboardEntry } from '../types';
import { CommunityHealthDrilldown } from '../components/CommunityHealthDrilldown';

export function AdminOverview() {
  const [entries, setEntries] = useState<IndividualLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrilldown, setShowDrilldown] = useState(false);

  useEffect(() => {
    fetchIndividualLeaderboard('all').then((e) => {
      setEntries(e);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="sub">Loading…</div>;

  const participants = entries.length;
  const activeToday = entries.filter((e) => e.daysLogged > 0).length;
  const qualified = entries.filter((e) => e.disqualifiedWeeks === 0).length;
  const checkinRate = participants > 0 ? Math.round((activeToday / participants) * 100) : 0;

  const avgBody = participants > 0 ? Math.round((entries.reduce((s, e) => s + e.bodyScore, 0) / participants / 40) * 100) : 0;
  const avgMind = participants > 0 ? Math.round((entries.reduce((s, e) => s + e.mindScore, 0) / participants / 20) * 100) : 0;
  const avgHeart = participants > 0 ? Math.round((entries.reduce((s, e) => s + e.heartScore, 0) / participants / 10) * 100) : 0;
  const avgSoul = participants > 0 ? Math.round((entries.reduce((s, e) => s + e.soulScore, 0) / participants / 10) * 100) : 0;
  const communityHealthPct = participants > 0 ? Math.round(entries.reduce((s, e) => s + e.balanceScore, 0) / participants) : 0;

  const lowest = [
    ['Body', avgBody],
    ['Mind', avgMind],
    ['Heart', avgHeart],
    ['Soul', avgSoul],
  ].sort((a, b) => (a[1] as number) - (b[1] as number))[0][0];

  const atRisk = entries.filter((e) => e.disqualifiedWeeks > 0);
  const neverCheckedIn = entries.filter((e) => e.daysLogged === 0);
  const noCharity = entries.filter((e) => !e.charityQualified);

  const handleExport = () => {
    const csv = buildAdminDashboardCsv(entries, 'Overall');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `challenge-360-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn-secondary" onClick={handleExport}>
          <Download className="w-4 h-4 inline mr-1.5" /> Download Dashboard (CSV)
        </button>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="ey">PARTICIPANTS</div>
          <strong>{participants}</strong>
          <span className="sub">Registered</span>
        </div>
        <div className="kpi">
          <div className="ey">ACTIVE</div>
          <strong>{activeToday}</strong>
          <span className="sub">{checkinRate}% participation</span>
        </div>
        <div className="kpi">
          <div className="ey">CHECK-IN RATE</div>
          <strong>{checkinRate}%</strong>
          <span className="sub">Overall</span>
        </div>
        <div className="kpi">
          <div className="ey">QUALIFIED</div>
          <strong>{qualified}</strong>
          <span className="sub">No disqualified weeks</span>
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <button
          className="card"
          onClick={() => setShowDrilldown(true)}
          style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <div className="ey">COMMUNITY HEALTH</div>
            <span className="sub" style={{ textDecoration: 'underline' }}>Click to see how this is calculated →</span>
          </div>
          <h2>{communityHealthPct}%</h2>
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
          {participants > 0 && (
            <div className="notice warn" style={{ marginTop: 10 }}>
              {lowest} has the biggest drop-off across the community.
            </div>
          )}
        </button>

        <div className="card">
          <div className="ey">NEEDS ATTENTION</div>
          <h2>Who needs a nudge</h2>
          <div className="ey" style={{ marginTop: 8 }}>
            QUALIFIER RISK ({atRisk.length})
          </div>
          <p className="sub">{atRisk.length ? atRisk.map((e) => e.fullName).join(', ') : 'Everyone is on track.'}</p>

          <div className="ey" style={{ marginTop: 10 }}>
            NEVER CHECKED IN ({neverCheckedIn.length})
          </div>
          <p className="sub">{neverCheckedIn.length ? neverCheckedIn.map((e) => e.fullName).join(', ') : 'Everyone has logged at least once.'}</p>

          <div className="ey" style={{ marginTop: 10 }}>
            CHARITY NOT LOGGED ({noCharity.length})
          </div>
          <p className="sub">{noCharity.length ? noCharity.map((e) => e.fullName).join(', ') : 'Everyone has logged a giving act.'}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="ey">PARTICIPANT SCORECARDS</div>
        <h2>Everyone, by name</h2>
        <div className="tablewrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Rank</th>
                <th>Score</th>
                <th>Body</th>
                <th>Mind</th>
                <th>Heart</th>
                <th>Soul</th>
                <th>Balance</th>
                <th>Qualifier</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.userId}>
                  <td>{e.fullName}</td>
                  <td>#{e.rank}</td>
                  <td>
                    <b>{e.totalScore}</b>
                  </td>
                  <td>{e.bodyScore}</td>
                  <td>{e.mindScore}</td>
                  <td>{e.heartScore}</td>
                  <td>{e.soulScore}</td>
                  <td>{e.balanceScore}%</td>
                  <td style={{ color: e.disqualifiedWeeks > 0 ? 'var(--danger)' : 'var(--ink)' }}>
                    {e.disqualifiedWeeks > 0 ? `${e.disqualifiedWeeks} week(s) at risk` : 'OK'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <p className="sub" style={{ padding: 12 }}>No participants yet.</p>}
        </div>
      </div>

      {showDrilldown && (
        <CommunityHealthDrilldown
          entries={entries}
          communityHealthPct={communityHealthPct}
          avgBody={avgBody}
          avgMind={avgMind}
          avgHeart={avgHeart}
          avgSoul={avgSoul}
          onClose={() => setShowDrilldown(false)}
        />
      )}
    </div>
  );
}
