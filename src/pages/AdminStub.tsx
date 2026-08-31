import React from 'react';
import { SCORING_RULES, MORNING_WORKOUT_BONUS_POINTS, COMPLETE_DAY_BONUS_POINTS, STRENGTH_CARDIO_WEEKLY_MIN_SESSIONS } from '../constants/rules';

const STUB_COPY: Record<string, [string, string]> = {
  events: ['EVENTS & BONUSES', 'Power workouts, QR attendance, RSVPs and bonus verification.'],
  moderation: ['PROOF & MODERATION', 'Review bonus evidence, manual corrections, approve/reject and record the decision.'],
  analytics: ['ANALYTICS', 'Participation, retention, balance, completion, drop-off and habit performance across the whole community.'],
  announcements: ['ANNOUNCEMENTS', 'Publish messages to everyone or targeted groups such as qualifier-risk participants.'],
  audit: ['AUDIT LOG', 'Every manual score correction, proof decision and rules publication is recorded here.'],
  integrations: ['INTEGRATIONS', 'Wearables • push/WhatsApp • AI coach • AI proof review • exports • SSO / roles'],
};

export function AdminStub({ kind }: { kind: keyof typeof STUB_COPY }) {
  const [title, desc] = STUB_COPY[kind];
  return (
    <div className="animate-fadeIn grid g2">
      <div className="card">
        <div className="ey">{title}</div>
        <h2>{desc}</h2>
        <p className="sub">
          This module is part of the production data model but isn't wired up yet — it needs its own server-side
          functions and, for some features, third-party API credentials.
        </p>
        <button className="btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          Coming soon
        </button>
      </div>
      <div className="card">
        <div className="ey">PRODUCTION NOTE</div>
        <h2>Server-side control for privileged actions</h2>
        <p className="sub">
          Secrets, AI calls, WhatsApp messaging and final score overrides should never run with keys stored in
          browser code — these all need a dedicated backend function, not just a UI.
        </p>
      </div>
    </div>
  );
}

export function AdminRules() {
  return (
    <div className="animate-fadeIn grid g2">
      <div className="card">
        <div className="ey">SCORING ENGINE</div>
        <h2>Daily rules (reference)</h2>
        <p className="sub">
          Live editing of point values isn't wired up yet — this is the current scoring engine for reference. Changing
          numbers here requires a code change in <code>src/constants/rules.ts</code>.
        </p>
        {SCORING_RULES.body.items.map((item) => (
          <div key={item.id} className="list-row">
            <div className="grow">{item.label}</div>
            <b>{item.points} pts</b>
          </div>
        ))}
        {SCORING_RULES.mind.items.map((item) => (
          <div key={item.id} className="list-row">
            <div className="grow">{item.label}</div>
            <b>{item.points} pts</b>
          </div>
        ))}
        {SCORING_RULES.heart.items.map((item) => (
          <div key={item.id} className="list-row">
            <div className="grow">{item.label}</div>
            <b>{item.points} pts</b>
          </div>
        ))}
        {SCORING_RULES.soul.items.map((item) => (
          <div key={item.id} className="list-row">
            <div className="grow">{item.label}</div>
            <b>{item.points} pts</b>
          </div>
        ))}
      </div>
      <div className="grid">
        <div className="card">
          <div className="ey">BONUSES</div>
          <h2>Power rules</h2>
          <div className="list-row" style={{ borderTop: 0 }}>
            <div className="grow">Morning group workout</div>
            <b>+{MORNING_WORKOUT_BONUS_POINTS}</b>
          </div>
          <div className="list-row">
            <div className="grow">360° Complete</div>
            <b>+{COMPLETE_DAY_BONUS_POINTS}</b>
          </div>
        </div>
        <div className="card">
          <div className="ey">QUALIFIERS</div>
          <h2>Eligibility</h2>
          <div className="list-row" style={{ borderTop: 0 }}>
            <div className="grow">Weekly strength sessions</div>
            <b>{STRENGTH_CARDIO_WEEKLY_MIN_SESSIONS}</b>
          </div>
          <div className="list-row">
            <div className="grow">Monthly charity acts</div>
            <b>1</b>
          </div>
        </div>
      </div>
    </div>
  );
}
