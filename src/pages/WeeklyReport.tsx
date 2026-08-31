import React, { useMemo } from 'react';
import { DailyLog } from '../types';
import { calculateBalanceScore, calculateDailyScore } from '../constants/rules';
import { WheelChart } from '../components/WheelChart';
import { ProgressRow } from '../components/ChoiceInputs';
import { getWeekRange } from '../utils/dateUtils';

interface WeeklyReportProps {
  dailyLogs: Record<string, DailyLog>;
  selectedDate: string;
  rankChange?: { from: number; to: number } | null;
}

const PILLAR_MAX = { body: 40, mind: 20, heart: 10, soul: 10 };

export function WeeklyReport({ dailyLogs, selectedDate, rankChange }: WeeklyReportProps) {
  const week = useMemo(() => getWeekRange(selectedDate), [selectedDate]);

  const totals = useMemo(() => {
    let body = 0,
      mind = 0,
      heart = 0,
      soul = 0,
      streakDays = 0,
      completeDays = 0;
    for (const d of week.days) {
      const log = dailyLogs[d];
      if (!log) continue;
      const s = calculateDailyScore(log);
      body += s.bodyScore;
      mind += s.mindScore;
      heart += s.heartScore;
      soul += s.soulScore;
      if (s.totalDailyScore > 0) streakDays++;
      if (s.completeDayBonus > 0) completeDays++;
    }
    return { body, mind, heart, soul, streakDays, completeDays };
  }, [dailyLogs, week]);

  const balance = calculateBalanceScore(totals.body, totals.mind, totals.heart, totals.soul);
  const weakest = [
    ['Soul', totals.soul / (PILLAR_MAX.soul * 7)] as const,
    ['Heart', totals.heart / (PILLAR_MAX.heart * 7)] as const,
    ['Mind', totals.mind / (PILLAR_MAX.mind * 7)] as const,
    ['Body', totals.body / (PILLAR_MAX.body * 7)] as const,
  ]
    .slice()
    .sort((a, b) => a[1] - b[1])[0][0];

  const missions: Record<string, string> = {
    Soul: 'Protect 30 minutes for meditation or quiet reflection.',
    Heart: 'Block out 30 phone-free minutes with family this week.',
    Mind: 'Pick one book or podcast series and commit 45 minutes daily.',
    Body: 'Add one more strength session — consistency beats intensity.',
  };

  return (
    <div className="animate-fadeIn grid g2">
      <div className="card">
        <div className="ey">WEEKLY 360°</div>
        <h2>Your report card</h2>
        <p className="sub">
          {new Date(week.start + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} –{' '}
          {new Date(week.end + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </p>
        <div className="hero">
          <WheelChart
            bodyScore={Math.min(totals.body, PILLAR_MAX.body * 7)}
            mindScore={Math.min(totals.mind, PILLAR_MAX.mind * 7)}
            heartScore={Math.min(totals.heart, PILLAR_MAX.heart * 7)}
            soulScore={Math.min(totals.soul, PILLAR_MAX.soul * 7)}
            centerValue={`${balance}%`}
            centerLabel="Balance"
          />
          <div>
            <ProgressRow label="BODY" value={totals.body} max={PILLAR_MAX.body * 7} color="var(--body)" />
            <ProgressRow label="MIND" value={totals.mind} max={PILLAR_MAX.mind * 7} color="var(--mind)" />
            <ProgressRow label="HEART" value={totals.heart} max={PILLAR_MAX.heart * 7} color="var(--heart)" />
            <ProgressRow label="SOUL" value={totals.soul} max={PILLAR_MAX.soul * 7} color="var(--soul)" />
            <div className="tags">
              <span className="tag">🔥 {totals.streakDays}-day active streak</span>
              <span className="tag">⭐ {totals.completeDays} complete days</span>
              {rankChange && (
                <span className="tag">
                  🏆 #{rankChange.from} → #{rankChange.to}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="action">
        <small>WEEKLY MISSION</small>
        <b>{missions[weakest]}</b>
        <span style={{ fontSize: 12 }}>
          Your {weakest === 'Body' ? 'other pillars are' : 'Body is'} consistent — your biggest opportunity is{' '}
          {weakest.toLowerCase()}.
        </span>
      </div>
    </div>
  );
}
