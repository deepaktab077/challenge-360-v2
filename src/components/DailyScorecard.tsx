import React from 'react';
import { Gift } from 'lucide-react';
import { DailyLog, MonthlyCharityRecord } from '../types';
import {
  scoreMovement,
  scoreNutrition,
  scoreHydration,
  scoreSleepDuration,
  scoreSleepDiscipline,
  scoreLearning,
  scoreScreenDiscipline,
  scoreFamilyConnection,
  scoreMeditation,
  calculateDailyScore,
} from '../constants/rules';
import { ChoiceGroup, ToggleLine, ProgressRow } from './ChoiceInputs';
import { WheelChart } from './WheelChart';

interface DailyScorecardProps {
  currentLog: DailyLog;
  onUpdateLog: (updatedLog: DailyLog) => void;
  openCharityModal: () => void;
  currentCharityRecord: MonthlyCharityRecord | undefined;
  monthKey: string;
  onDone: () => void;
  onSaveAndShare: () => void;
  saving?: boolean;
  readOnly?: boolean;
}

export const DailyScorecard: React.FC<DailyScorecardProps> = ({
  currentLog,
  onUpdateLog,
  openCharityModal,
  currentCharityRecord,
  onDone,
  onSaveAndShare,
  saving,
  readOnly,
}) => {
  const updateBody = (patch: Partial<DailyLog['body']>) =>
    !readOnly && onUpdateLog({ ...currentLog, body: { ...currentLog.body, ...patch } });
  const updateMind = (patch: Partial<DailyLog['mind']>) =>
    !readOnly && onUpdateLog({ ...currentLog, mind: { ...currentLog.mind, ...patch } });
  const updateHeart = (patch: Partial<DailyLog['heart']>) =>
    !readOnly && onUpdateLog({ ...currentLog, heart: { ...currentLog.heart, ...patch } });
  const updateSoul = (patch: Partial<DailyLog['soul']>) =>
    !readOnly && onUpdateLog({ ...currentLog, soul: { ...currentLog.soul, ...patch } });

  const { body, mind, heart, soul } = currentLog;
  const score = calculateDailyScore(currentLog);

  const movementPts = scoreMovement(body.stepsCount || 0);
  const nutritionPts = scoreNutrition(body.nutritionCompleted, body.noCheatDay);
  const hydrationPts = scoreHydration(body.hydrationLiters || 0);
  const sleepDurationPts = scoreSleepDuration(body.sleepHours || 0);
  const sleepDisciplinePts = scoreSleepDiscipline(body.bedTime);
  const learningPts = scoreLearning(mind.learningMinutes || 0);
  const screenPts = scoreScreenDiscipline(mind.screenHours ?? 24);
  const familyPts = scoreFamilyConnection(heart.familyMinutes || 0);
  const meditationPts = scoreMeditation(soul.meditationMinutes || 0);

  return (
    <div className="grid g2">
      <div className="card">
        {readOnly && (
          <div className="notice warn" style={{ marginBottom: 14 }}>
            Read-only — you're viewing someone else's check-in.
          </div>
        )}

        {/* BODY */}
        <div className="section">
          <div className="ey">BODY • MAX 40</div>
          <h2>Move • Nourish • Hydrate • Recover</h2>

          <div className="field-label">Weekly strength/cardio session today (45+ min)</div>
          <ToggleLine
            label="Did a 45+ min strength/cardio session today"
            checked={!!body.strengthCardioCompleted}
            onChange={(v) => updateBody({ strengthCardioCompleted: v, strengthCardioMinutes: v ? 45 : 0 })}
          />
          <p className="sub" style={{ marginTop: -4 }}>Weekly qualifier — no daily points, but 2x/week is required to keep the week's points.</p>

          <label className="field-label">Steps ({movementPts}/10 pts)</label>
          <ChoiceGroup
            options={[
              { label: '<8k', value: 0 },
              { label: '8k–9.9k', value: 8500 },
              { label: '10k+', value: 10000 },
            ]}
            value={body.stepsCount >= 10000 ? 10000 : body.stepsCount >= 8000 ? 8500 : 0}
            onChange={(v) => updateBody({ stepsCount: v })}
          />

          <label className="field-label">Nutrition ({nutritionPts}/10 pts)</label>
          <ToggleLine label="Healthy diet followed (+5)" checked={!!body.nutritionCompleted} onChange={(v) => updateBody({ nutritionCompleted: v })} />
          <ToggleLine label="Clean / no-cheat day (+5)" checked={!!body.noCheatDay} onChange={(v) => updateBody({ noCheatDay: v })} />

          <label className="field-label">Hydration ({hydrationPts}/7 pts)</label>
          <ChoiceGroup
            options={[
              { label: '<3L', value: 0 },
              { label: '3–3.99L', value: 3.5 },
              { label: '4L+', value: 4 },
            ]}
            value={body.hydrationLiters >= 4 ? 4 : body.hydrationLiters >= 3 ? 3.5 : 0}
            onChange={(v) => updateBody({ hydrationLiters: v })}
          />

          <label className="field-label">Sleep duration ({sleepDurationPts}/7 pts)</label>
          <ChoiceGroup
            options={[
              { label: '<6.5h', value: 0 },
              { label: '6.5–6.9h', value: 6.7 },
              { label: '7–7.49h', value: 7.2 },
              { label: '7.5h+', value: 7.5 },
            ]}
            value={
              body.sleepHours >= 7.5 ? 7.5 : body.sleepHours >= 7 ? 7.2 : body.sleepHours >= 6.5 ? 6.7 : 0
            }
            onChange={(v) => updateBody({ sleepHours: v })}
          />

          <label className="field-label">Bedtime ({sleepDisciplinePts}/6 pts)</label>
          <ChoiceGroup
            options={[
              { label: 'After 10:30', value: 0 },
              { label: '10:16–10:30', value: 1 },
              { label: '10:01–10:15', value: 2 },
              { label: 'By 10:00', value: 3 },
            ]}
            value={
              !body.bedTime
                ? -1
                : sleepDisciplinePts === 6
                ? 3
                : sleepDisciplinePts === 4
                ? 2
                : sleepDisciplinePts === 2
                ? 1
                : 0
            }
            onChange={(v) => {
              const times = ['22:45', '22:20', '22:10', '21:55'];
              updateBody({ bedTime: times[v] });
            }}
          />
        </div>

        {/* MIND */}
        <div className="section">
          <div className="ey">MIND • MAX 20</div>
          <h2>Learn • Grow • Disconnect</h2>

          <label className="field-label">Learning — 45m+ reading/podcasts, no news ({learningPts}/10 pts)</label>
          <ChoiceGroup
            options={[
              { label: '<45m', value: 0 },
              { label: '45m+', value: 45 },
            ]}
            value={mind.learningMinutes >= 45 ? 45 : 0}
            onChange={(v) => updateMind({ learningMinutes: v })}
          />

          <label className="field-label">Screen discipline ({screenPts}/10 pts)</label>
          <ChoiceGroup
            options={[
              { label: '>3h', value: 4 },
              { label: '2–3h', value: 2.5 },
              { label: '<2h', value: 1 },
            ]}
            value={(mind.screenHours ?? 24) < 2 ? 1 : (mind.screenHours ?? 24) <= 3 ? 2.5 : 4}
            onChange={(v) => updateMind({ screenHours: v })}
          />
          <ToggleLine
            label="No phone 30 min before sleep / after waking"
            checked={!!mind.phoneFreeWindows}
            onChange={(v) => updateMind({ phoneFreeWindows: v })}
          />
        </div>

        {/* HEART */}
        <div className="section">
          <div className="ey">HEART • MAX 10</div>
          <h2>Connect • Care • Give</h2>
          <ToggleLine
            label="30m+ phone-free family connection (10 pts)"
            checked={familyPts > 0}
            onChange={(v) => updateHeart({ familyMinutes: v ? 30 : 0 })}
          />

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <div className="toggleline" style={{ borderTop: 0 }}>
              <div className="grow">
                <b style={{ fontSize: 13 }}>
                  <Gift className="w-3.5 h-3.5 inline mr-1" /> Giving Back — Monthly Qualifier
                </b>
                <div className="sub">One community giving act during September, required for the final leaderboard.</div>
              </div>
              <button className="btn-secondary" onClick={openCharityModal}>
                {currentCharityRecord?.completed ? 'Qualified ✓' : 'Log it'}
              </button>
            </div>
          </div>
        </div>

        {/* SOUL */}
        <div className="section">
          <div className="ey">SOUL • MAX 10</div>
          <h2>Pause • Breathe • Reconnect</h2>
          <label className="field-label">Meditation / Pranayama ({meditationPts}/10 pts)</label>
          <ChoiceGroup
            options={[
              { label: '<30m', value: 0 },
              { label: '30–44m', value: 30 },
              { label: '45m+', value: 45 },
            ]}
            value={soul.meditationMinutes >= 45 ? 45 : soul.meditationMinutes >= 30 ? 30 : 0}
            onChange={(v) => updateSoul({ meditationMinutes: v })}
          />
        </div>

        <div className="section">
          <label className="field-label">Journal & wins (optional)</label>
          <textarea
            className="field-textarea"
            rows={3}
            value={currentLog.notes || ''}
            onChange={(e) => !readOnly && onUpdateLog({ ...currentLog, notes: e.target.value })}
            placeholder="Reflections on energy, mindset, workout performance…"
          />
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="ey">LIVE SCORE</div>
          <h2>{score.totalDailyScore} points</h2>
          <WheelChart
            bodyScore={score.bodyScore}
            mindScore={score.mindScore}
            heartScore={score.heartScore}
            soulScore={score.soulScore}
            centerValue={score.totalDailyScore}
            centerLabel="/ 85 pts"
          />
          <ProgressRow label="BODY" value={score.bodyScore} max={40} color="var(--body)" />
          <ProgressRow label="MIND" value={score.mindScore} max={20} color="var(--mind)" />
          <ProgressRow label="HEART" value={score.heartScore} max={10} color="var(--heart)" />
          <ProgressRow label="SOUL" value={score.soulScore} max={10} color="var(--soul)" />
          <div className={`notice ${score.completeDayBonus > 0 ? 'good' : ''}`} style={{ marginTop: 10 }}>
            {score.completeDayBonus > 0
              ? '🌟 360° Complete unlocked — +5 bonus added.'
              : 'Complete every pillar to earn +5.'}
          </div>
          {!readOnly && (
            <>
              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: 12 }}
                onClick={onSaveAndShare}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save & Share to Community'}
              </button>
              <button className="btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={onDone}>
                Back to Today
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
