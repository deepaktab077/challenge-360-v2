import React from 'react';
import { Users } from 'lucide-react';
import { DailyLog, PillarScoreBreakdown } from '../types';
import { calculateBalanceScore, MORNING_WORKOUT_BONUS_POINTS } from '../constants/rules';
import { WheelChart } from '../components/WheelChart';
import { ProgressRow } from '../components/ChoiceInputs';

interface TodayProps {
  currentLog: DailyLog;
  score: PillarScoreBreakdown;
  currentStreak: number;
  myRank: number | null;
  monthTotal: number;
  thisWeekWorkoutDone: boolean;
  onToggleWorkout: () => void;
  perfectDaysThisWeek: number;
  strengthSessionsThisWeek: number;
  onGoToCheckin: () => void;
  readOnly?: boolean;
}

const PILLAR_MAX = { body: 40, mind: 20, heart: 10, soul: 10 };

export function Today({
  currentLog,
  score,
  currentStreak,
  myRank,
  monthTotal,
  thisWeekWorkoutDone,
  onToggleWorkout,
  perfectDaysThisWeek,
  strengthSessionsThisWeek,
  onGoToCheckin,
  readOnly,
}: TodayProps) {
  const balance = calculateBalanceScore(score.bodyScore, score.mindScore, score.heartScore, score.soulScore);
  const weakest = [
    ['Body', score.bodyScore / PILLAR_MAX.body] as const,
    ['Mind', score.mindScore / PILLAR_MAX.mind] as const,
    ['Heart', score.heartScore / PILLAR_MAX.heart] as const,
    ['Soul', score.soulScore / PILLAR_MAX.soul] as const,
  ]
    .slice()
    .sort((a, b) => a[1] - b[1])[0][0];

  const dayMax = thisWeekWorkoutDone ? 135 : 85;

  return (
    <div className="animate-fadeIn">
      <div className="grid g2">
        <div className="card">
          <div className="ey">TODAY'S BALANCE</div>
          <h2>Your 360°</h2>
          <div className="hero">
            <WheelChart
              bodyScore={score.bodyScore}
              mindScore={score.mindScore}
              heartScore={score.heartScore}
              soulScore={score.soulScore}
              centerValue={score.totalDailyScore}
              centerLabel={`/ ${dayMax} pts`}
            />
            <div>
              <ProgressRow label="BODY" value={score.bodyScore} max={40} color="var(--body)" />
              <ProgressRow label="MIND" value={score.mindScore} max={20} color="var(--mind)" />
              <ProgressRow label="HEART" value={score.heartScore} max={10} color="var(--heart)" />
              <ProgressRow label="SOUL" value={score.soulScore} max={10} color="var(--soul)" />
              <div className="tags">
                <span className="tag">🔥 {currentStreak}-day streak</span>
                {myRank && <span className="tag">🏆 Rank #{myRank}</span>}
                <span className="tag">⭕ {balance}% balance</span>
              </div>
              {!readOnly && (
                <button className="btn-primary" style={{ marginTop: 14 }} onClick={onGoToCheckin}>
                  {score.totalDailyScore > 0 ? "Continue today's check-in" : "Complete today's check-in"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid">
          <div className="action">
            <small>NEXT BEST ACTION</small>
            <b>{score.allDimensionsCompleted ? 'Your circle is complete. Protect the streak.' : `Strengthen your ${weakest} pillar today.`}</b>
            <span style={{ fontSize: 12 }}>Balance matters more than simply chasing points.</span>
          </div>

          <div className="card">
            <div className="ey">POWER BONUS</div>
            <h2 className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Morning Group Workout
            </h2>
            <p className="sub">Once/week • +{MORNING_WORKOUT_BONUS_POINTS} points</p>
            <div className="toggleline">
              <b>Completed this week</b>
              {!readOnly && <div className={`toggle ${thisWeekWorkoutDone ? 'on' : ''}`} onClick={onToggleWorkout} />}
            </div>
          </div>

          <div className="card">
            <div className="ey">360° COMPLETE</div>
            <h2>{score.allDimensionsCompleted ? 'Unlocked 🌟' : 'Close the circle'}</h2>
            <p className="sub">
              {score.allDimensionsCompleted
                ? '+5 bonus automatically added.'
                : 'Touch all four pillars today to unlock +5.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid g4" style={{ marginTop: 16 }}>
        <div className="metric">
          <div className="ey">MONTH</div>
          <strong>{monthTotal}</strong>
          <span className="sub">Total points</span>
        </div>
        <div className="metric">
          <div className="ey">BALANCE</div>
          <strong>{balance}%</strong>
          <span className="sub">360° score</span>
        </div>
        <div className="metric">
          <div className="ey">COMPLETE DAYS</div>
          <strong>{perfectDaysThisWeek}</strong>
          <span className="sub">This week</span>
        </div>
        <div className="metric">
          <div className="ey">QUALIFIER</div>
          <strong>{strengthSessionsThisWeek >= 2 ? 'Secure' : 'At risk'}</strong>
          <span className="sub">{strengthSessionsThisWeek}/2 sessions</span>
        </div>
      </div>
    </div>
  );
}
