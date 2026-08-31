import React, { useEffect, useState } from 'react';
import { Save, RotateCcw, Info } from 'lucide-react';
import { fetchScoringConfig, saveScoringConfig } from '../services/dataService';
import { DEFAULT_SCORING_THRESHOLDS, setScoringThresholds, ScoringThresholds } from '../constants/rules';
import { useAuth } from '../contexts/AuthContext';

interface FieldSpec {
  key: keyof ScoringThresholds;
  label: string;
  suffix: string;
  step?: number;
}

const FIELD_GROUPS: { title: string; fields: FieldSpec[] }[] = [
  {
    title: 'Movement (Steps) — max 10 pts',
    fields: [
      { key: 'movementFullSteps', label: 'Full points threshold', suffix: 'steps', step: 500 },
      { key: 'movementFullPts', label: 'Full points', suffix: 'pts' },
      { key: 'movementPartialSteps', label: 'Partial threshold', suffix: 'steps', step: 500 },
      { key: 'movementPartialPts', label: 'Partial points', suffix: 'pts' },
    ],
  },
  {
    title: 'Nutrition — max 10 pts',
    fields: [
      { key: 'nutritionDietPts', label: 'Diet followed', suffix: 'pts' },
      { key: 'nutritionNoCheatPts', label: 'No-cheat day bonus', suffix: 'pts' },
    ],
  },
  {
    title: 'Hydration — max 7 pts',
    fields: [
      { key: 'hydrationFullLiters', label: 'Full points threshold', suffix: 'L', step: 0.5 },
      { key: 'hydrationFullPts', label: 'Full points', suffix: 'pts' },
      { key: 'hydrationPartialLiters', label: 'Partial threshold', suffix: 'L', step: 0.5 },
      { key: 'hydrationPartialPts', label: 'Partial points', suffix: 'pts' },
    ],
  },
  {
    title: 'Sleep Duration — max 7 pts',
    fields: [
      { key: 'sleepDurationFullHours', label: 'Full points threshold', suffix: 'hrs', step: 0.25 },
      { key: 'sleepDurationFullPts', label: 'Full points', suffix: 'pts' },
      { key: 'sleepDurationMidHours', label: 'Mid threshold', suffix: 'hrs', step: 0.25 },
      { key: 'sleepDurationMidPts', label: 'Mid points', suffix: 'pts' },
      { key: 'sleepDurationPartialHours', label: 'Partial threshold', suffix: 'hrs', step: 0.25 },
      { key: 'sleepDurationPartialPts', label: 'Partial points', suffix: 'pts' },
    ],
  },
  {
    title: 'Sleep Discipline (Bedtime) — max 6 pts',
    fields: [
      { key: 'sleepDisciplineFullPts', label: 'By 10:00 PM', suffix: 'pts' },
      { key: 'sleepDisciplineTier2MaxMin', label: 'Tier 2 window', suffix: 'min after 10PM' },
      { key: 'sleepDisciplineTier2Pts', label: 'Tier 2 points', suffix: 'pts' },
      { key: 'sleepDisciplineTier3MaxMin', label: 'Tier 3 window', suffix: 'min after 10PM' },
      { key: 'sleepDisciplineTier3Pts', label: 'Tier 3 points', suffix: 'pts' },
    ],
  },
  {
    title: 'Meaningful Learning — max 10 pts',
    fields: [
      { key: 'learningMinMinutes', label: 'Minimum minutes', suffix: 'min' },
      { key: 'learningPts', label: 'Points', suffix: 'pts' },
    ],
  },
  {
    title: 'Screen Discipline — max 10 pts',
    fields: [
      { key: 'screenFullMaxHours', label: 'Full points below', suffix: 'hrs', step: 0.25 },
      { key: 'screenFullPts', label: 'Full points', suffix: 'pts' },
      { key: 'screenPartialMaxHours', label: 'Partial points below', suffix: 'hrs', step: 0.25 },
      { key: 'screenPartialPts', label: 'Partial points', suffix: 'pts' },
    ],
  },
  {
    title: 'Family Connection — max 10 pts',
    fields: [
      { key: 'familyMinMinutes', label: 'Minimum minutes', suffix: 'min' },
      { key: 'familyPts', label: 'Points', suffix: 'pts' },
    ],
  },
  {
    title: 'Meditation / Pranayama — max 10 pts',
    fields: [
      { key: 'meditationFullMinutes', label: 'Full points threshold', suffix: 'min' },
      { key: 'meditationFullPts', label: 'Full points', suffix: 'pts' },
      { key: 'meditationPartialMinutes', label: 'Partial threshold', suffix: 'min' },
      { key: 'meditationPartialPts', label: 'Partial points', suffix: 'pts' },
    ],
  },
];

export function AdminScoreCards() {
  const { profile } = useAuth();
  const [values, setValues] = useState<ScoringThresholds>(DEFAULT_SCORING_THRESHOLDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    fetchScoringConfig().then((config) => {
      if (config) {
        setValues({ ...DEFAULT_SCORING_THRESHOLDS, ...config });
        setIsCustom(true);
      }
      setLoading(false);
    });
  }, []);

  const handleChange = (key: keyof ScoringThresholds, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await saveScoringConfig(values, profile.id);
    setScoringThresholds(values); // takes effect immediately, everywhere, no reload needed
    setIsCustom(true);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetDefaults = () => {
    setValues(DEFAULT_SCORING_THRESHOLDS);
  };

  if (loading) return <div className="sub">Loading…</div>;

  return (
    <div className="animate-fadeIn">
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Info className="w-4 h-4" style={{ flexShrink: 0, marginTop: 2, color: 'var(--mind)' }} />
        <p className="sub" style={{ margin: 0 }}>
          These are the exact thresholds the scoring engine uses (<code>src/constants/rules.ts</code> is the source of
          truth — this page only edits the numbers, not the logic). Saving takes effect immediately for every
          participant's calculations, going forward. {isCustom && <strong>Currently using a custom configuration.</strong>}
        </p>
      </div>

      <div className="grid g2">
        {FIELD_GROUPS.map((group) => (
          <div key={group.title} className="card">
            <h2>{group.title}</h2>
            {group.fields.map((f) => (
              <div key={f.key} className="list-row" style={{ borderTop: '1px solid var(--line)' }}>
                <span className="grow" style={{ fontSize: 13, color: 'var(--ink)' }}>
                  {f.label}
                </span>
                <input
                  type="number"
                  step={f.step || 1}
                  value={values[f.key]}
                  onChange={(e) => handleChange(f.key, parseFloat(e.target.value) || 0)}
                  className="field-input"
                  style={{ width: 90, textAlign: 'right' }}
                />
                <span className="sub" style={{ width: 90 }}>
                  {f.suffix}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16, position: 'sticky', bottom: 16 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 inline mr-1.5" /> {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save Configuration'}
        </button>
        <button className="btn-secondary" onClick={handleResetDefaults}>
          <RotateCcw className="w-4 h-4 inline mr-1.5" /> Reset to Defaults
        </button>
      </div>
    </div>
  );
}
