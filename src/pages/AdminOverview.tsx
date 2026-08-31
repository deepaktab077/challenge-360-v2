import React, { useEffect, useState } from 'react';
import { fetchIndividualLeaderboard } from '../services/dataService';
import { IndividualLeaderboardEntry } from '../types';

export function AdminOverview() {
  const [entries, setEntries] = useState<IndividualLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  const lowest = [
    ['Body', avgBody],
    ['Mind', avgMind],
    ['Heart', avgHeart],
    ['Soul', avgSoul],
  ].sort((a, b) => (a[1] as number) - (b[1] as number))[0][0];

  return (
    <div className="animate-fadeIn">
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
        <div className="card">
          <div className="ey">COMMUNITY HEALTH</div>
          <h2>360° participation mix</h2>
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
        </div>

        <div className="card">
          <div className="ey">NEEDS ATTENTION</div>
          <h2>Admin actions</h2>
          <div className="list-row" style={{ borderTop: 0 }}>
            <div className="avatar">{entries.filter((e) => e.disqualifiedWeeks > 0).length}</div>
            <div className="grow">
              <b>Qualifier risk</b>
            </div>
          </div>
          <div className="list-row">
            <div className="avatar">{entries.filter((e) => e.daysLogged === 0).length}</div>
            <div className="grow">
              <b>Never checked in</b>
            </div>
          </div>
          <div className="list-row">
            <div className="avatar">{entries.filter((e) => !e.charityQualified).length}</div>
            <div className="grow">
              <b>Charity not yet logged</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
