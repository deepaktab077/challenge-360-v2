import React from 'react';

interface QualifiersProps {
  strengthSessionsThisWeek: number;
  charityCompleted: boolean;
  onToggleCharity: () => void;
  disqualifiedWeeksTotal: number;
  readOnly?: boolean;
}

export function Qualifiers({
  strengthSessionsThisWeek,
  charityCompleted,
  onToggleCharity,
  disqualifiedWeeksTotal,
  readOnly,
}: QualifiersProps) {
  const qualified = strengthSessionsThisWeek >= 2;

  return (
    <div className="animate-fadeIn grid g2">
      <div className="card">
        <div className="ey">WEEKLY</div>
        <h2>Strength / Cardio Qualifier</h2>
        <p className="sub">Minimum 45 minutes at least twice each week. Log sessions on your daily check-in.</p>
        <div className="list-row" style={{ borderTop: 0, marginTop: 8 }}>
          <div className="avatar">{strengthSessionsThisWeek}/2</div>
          <div className="grow">
            <b>{qualified ? 'Qualified' : 'At risk'}</b>
            <div className="sub">
              {qualified
                ? 'Weekly points secured.'
                : `${2 - strengthSessionsThisWeek} more session${2 - strengthSessionsThisWeek > 1 ? 's' : ''} required — check today's check-in.`}
            </div>
          </div>
        </div>
        {!qualified && (
          <div className="notice warn" style={{ marginTop: 10 }}>
            ⚠️ If this week ends below 2 sessions, this week's points (including any morning workout bonus) won't
            count on the leaderboard.
          </div>
        )}
        {disqualifiedWeeksTotal > 0 && (
          <div className="notice" style={{ marginTop: 10 }}>
            {disqualifiedWeeksTotal} completed week{disqualifiedWeeksTotal > 1 ? 's' : ''} so far didn't meet this
            qualifier and {disqualifiedWeeksTotal > 1 ? "aren't" : "isn't"} counted in your leaderboard total.
          </div>
        )}
      </div>

      <div className="card">
        <div className="ey">MONTHLY</div>
        <h2>Community Giving</h2>
        <p className="sub">At least one giving act in September — required to appear on the final leaderboard.</p>
        <div className="toggleline">
          <b>{charityCompleted ? 'Completed' : 'Not completed yet'}</b>
          {!readOnly && <div className={`toggle ${charityCompleted ? 'on' : ''}`} onClick={onToggleCharity} />}
        </div>
      </div>
    </div>
  );
}
