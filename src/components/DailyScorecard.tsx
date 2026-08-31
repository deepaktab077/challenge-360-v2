import React from 'react';
import {
  Footprints,
  Salad,
  Droplets,
  Moon,
  Clock,
  BookOpen,
  PhoneOff,
  HeartHandshake,
  Sparkles,
  Gift,
  MessageSquare,
  Dumbbell,
} from 'lucide-react';
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
} from '../constants/rules';

interface DailyScorecardProps {
  currentLog: DailyLog;
  onUpdateLog: (updatedLog: DailyLog) => void;
  openCharityModal: () => void;
  currentCharityRecord: MonthlyCharityRecord | undefined;
  monthKey: string;
}

// ----------------------------------------------------------------------------
// Small reusable pieces
// ----------------------------------------------------------------------------
// NOTE: Tailwind's build-time scanner only picks up class names that appear as
// literal strings in source — it can't resolve `bg-${color}-500` template
// interpolation. So every color variant is spelled out explicitly here.

type PillarColor = 'indigo' | 'rose' | 'pink' | 'purple';

const COLOR_CLASSES: Record<
  PillarColor,
  { bar: string; title: string; badge: string; itemActive: string; iconActive: string; ptsActive: string }
> = {
  indigo: {
    bar: 'bg-indigo-500',
    title: 'text-indigo-300',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    itemActive: 'bg-indigo-500/10 border-indigo-500/30 shadow-sm',
    iconActive: 'bg-indigo-600 text-white',
    ptsActive: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  },
  rose: {
    bar: 'bg-rose-500',
    title: 'text-rose-300',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    itemActive: 'bg-rose-500/10 border-rose-500/30 shadow-sm',
    iconActive: 'bg-rose-600 text-white',
    ptsActive: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
  pink: {
    bar: 'bg-pink-500',
    title: 'text-pink-300',
    badge: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    itemActive: 'bg-pink-500/10 border-pink-500/30 shadow-sm',
    iconActive: 'bg-pink-600 text-white',
    ptsActive: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  },
  purple: {
    bar: 'bg-purple-500',
    title: 'text-purple-300',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    itemActive: 'bg-purple-500/10 border-purple-500/30 shadow-sm',
    iconActive: 'bg-purple-600 text-white',
    ptsActive: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
};

const PillarSection: React.FC<{
  id?: string;
  number: number;
  title: string;
  subtitle: string;
  maxPoints: number;
  color: PillarColor;
  children: React.ReactNode;
}> = ({ id, number, title, subtitle, maxPoints, color, children }) => {
  const c = COLOR_CLASSES[color];
  return (
    <div id={id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm scroll-mt-20">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
        <div className="flex items-center space-x-3">
          <span className={`w-2.5 h-6 ${c.bar} rounded-full inline-block`}></span>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`text-lg font-bold ${c.title} tracking-tight`}>
                {number}. {title}
              </h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${c.badge}`}>
                {maxPoints} Points Max
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">{children}</div>
    </div>
  );
};

const ItemCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  points: number;
  maxPoints: number;
  color: PillarColor;
  description: string;
  children: React.ReactNode;
}> = ({ icon, label, points, maxPoints, color, description, children }) => {
  const c = COLOR_CLASSES[color];
  return (
    <div className={`p-4 rounded-2xl border transition-all ${points > 0 ? c.itemActive : 'bg-slate-800/40 border-slate-800'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start space-x-3">
          <div
            className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              points > 0 ? c.iconActive : 'bg-slate-700 text-slate-500'
            }`}
          >
            {icon}
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold text-sm text-slate-200">{label}</span>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-md border ${
                  points > 0 ? c.ptsActive : 'text-slate-500 bg-slate-800 border-slate-800'
                }`}
              >
                {points} / {maxPoints} pts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{description}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-800/80">{children}</div>
    </div>
  );
};

const NumberField: React.FC<{
  value: number;
  onChange: (v: number) => void;
  suffix: string;
  step?: number;
  placeholder?: string;
}> = ({ value, onChange, suffix, step = 1, placeholder }) => (
  <div className="flex items-center space-x-1.5">
    <input
      type="number"
      step={step}
      min={0}
      value={Number.isFinite(value) && value !== 0 ? value : value === 0 ? '' : value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
      className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-bold text-center focus:outline-none focus:border-indigo-500"
    />
    <span className="text-slate-500 font-medium text-xs">{suffix}</span>
  </div>
);

const ToggleField: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
      checked
        ? 'bg-emerald-600 border-emerald-600 text-white'
        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
    }`}
  >
    <span
      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
        checked ? 'bg-white border-white' : 'border-slate-600'
      }`}
    >
      {checked && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
    </span>
    {label}
  </button>
);

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export const DailyScorecard: React.FC<DailyScorecardProps> = ({
  currentLog,
  onUpdateLog,
  openCharityModal,
  currentCharityRecord,
}) => {
  const updateBody = (patch: Partial<DailyLog['body']>) =>
    onUpdateLog({ ...currentLog, body: { ...currentLog.body, ...patch } });
  const updateMind = (patch: Partial<DailyLog['mind']>) =>
    onUpdateLog({ ...currentLog, mind: { ...currentLog.mind, ...patch } });
  const updateHeart = (patch: Partial<DailyLog['heart']>) =>
    onUpdateLog({ ...currentLog, heart: { ...currentLog.heart, ...patch } });
  const updateSoul = (patch: Partial<DailyLog['soul']>) =>
    onUpdateLog({ ...currentLog, soul: { ...currentLog.soul, ...patch } });
  const updateNotes = (notes: string) => onUpdateLog({ ...currentLog, notes });

  const body = currentLog.body;
  const mind = currentLog.mind;
  const heart = currentLog.heart;
  const soul = currentLog.soul;

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
    <div className="space-y-8">
      {/* BODY */}
      <PillarSection
        id="pillar-body"
        number={1}
        title="Body Prime"
        subtitle="Move · Nourish · Hydrate · Recover"
        maxPoints={40}
        color="indigo"
      >
        {/* Strength/Cardio weekly qualifier */}
        <div className="p-4 rounded-2xl border bg-slate-800/40 border-slate-800 md:col-span-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start space-x-3">
              <div
                className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  body.strengthCardioCompleted ? 'bg-slate-800 text-white' : 'bg-slate-700 text-slate-500'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-bold text-sm text-slate-200">Strength / Cardio</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 border border-slate-700">
                    Weekly Qualifier — no daily points
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Min. 45-minute session, at least 2x/week, to qualify for the leaderboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NumberField
                value={body.strengthCardioMinutes || 0}
                onChange={(v) => updateBody({ strengthCardioMinutes: v, strengthCardioCompleted: v >= 45 })}
                suffix="min"
              />
              <ToggleField
                checked={body.strengthCardioCompleted}
                onChange={(v) => updateBody({ strengthCardioCompleted: v })}
                label="Done today"
              />
            </div>
          </div>
        </div>

        <ItemCard
          icon={<Footprints className="w-3.5 h-3.5" />}
          label="Movement (Steps)"
          points={movementPts}
          maxPoints={10}
          color="indigo"
          description="10,000+ = 10 · 8,000–9,999 = 5 · below 8,000 = 0"
        >
          <NumberField value={body.stepsCount} onChange={(v) => updateBody({ stepsCount: v })} suffix="steps" step={100} />
        </ItemCard>

        <ItemCard
          icon={<Salad className="w-3.5 h-3.5" />}
          label="Nutrition"
          points={nutritionPts}
          maxPoints={10}
          color="indigo"
          description="Follow diet = 5 · No-Cheat Day = +5 bonus"
        >
          <div className="flex flex-wrap items-center gap-2">
            <ToggleField
              checked={body.nutritionCompleted}
              onChange={(v) => updateBody({ nutritionCompleted: v })}
              label="Diet followed"
            />
            <ToggleField
              checked={body.noCheatDay}
              onChange={(v) => updateBody({ noCheatDay: v })}
              label="No-Cheat Day"
            />
          </div>
          <input
            type="text"
            placeholder="Notes (e.g. clean whole foods, no sugar)..."
            value={body.nutritionNotes || ''}
            onChange={(e) => updateBody({ nutritionNotes: e.target.value })}
            className="w-full mt-2 px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </ItemCard>

        <ItemCard
          icon={<Droplets className="w-3.5 h-3.5" />}
          label="Hydration"
          points={hydrationPts}
          maxPoints={7}
          color="indigo"
          description="4L+ = 7 · 3–3.99L = 4 · below 3L = 0"
        >
          <NumberField value={body.hydrationLiters} onChange={(v) => updateBody({ hydrationLiters: v })} suffix="liters" step={0.1} />
        </ItemCard>

        <ItemCard
          icon={<Moon className="w-3.5 h-3.5" />}
          label="Sleep Duration"
          points={sleepDurationPts}
          maxPoints={7}
          color="indigo"
          description="7.5+ hrs = 7 · 7.0–7.29 = 5 · 6.5–6.99 = 2 · below 6.5 = 0"
        >
          <NumberField value={body.sleepHours} onChange={(v) => updateBody({ sleepHours: v })} suffix="hours" step={0.1} />
        </ItemCard>

        <ItemCard
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Sleep Discipline"
          points={sleepDisciplinePts}
          maxPoints={6}
          color="indigo"
          description="By 10:00 PM = 6 · 10:01–10:15 = 4 · 10:16–10:30 = 2 · after 10:30 = 0"
        >
          <div className="flex items-center space-x-1.5">
            <input
              type="time"
              value={body.bedTime || ''}
              onChange={(e) => updateBody({ bedTime: e.target.value })}
              className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-bold text-center focus:outline-none focus:border-indigo-500"
            />
            <span className="text-slate-500 font-medium text-xs">bedtime</span>
          </div>
        </ItemCard>
      </PillarSection>

      {/* MIND */}
      <PillarSection id="pillar-mind" number={2} title="Mind Spark" subtitle="Learn · Grow · Disconnect" maxPoints={20} color="rose">
        <ItemCard
          icon={<BookOpen className="w-3.5 h-3.5" />}
          label="Meaningful Learning"
          points={learningPts}
          maxPoints={10}
          color="rose"
          description="45+ min of reading/audiobook/educational podcast (news doesn't qualify) = 10, else 0"
        >
          <div className="flex flex-wrap items-center gap-2">
            <NumberField value={mind.learningMinutes} onChange={(v) => updateMind({ learningMinutes: v })} suffix="min" step={5} />
            <input
              type="text"
              placeholder="Topic (e.g. Atomic Habits, Huberman Lab)..."
              value={mind.learningTopic || ''}
              onChange={(e) => updateMind({ learningTopic: e.target.value })}
              className="flex-1 min-w-[140px] px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>
        </ItemCard>

        <ItemCard
          icon={<PhoneOff className="w-3.5 h-3.5" />}
          label="Screen Discipline"
          points={screenPts}
          maxPoints={10}
          color="rose"
          description="<2 hrs = 10 · 2–3 hrs = 5 · >3 hrs = 0, plus phone-free 30 min around sleep"
        >
          <div className="flex flex-wrap items-center gap-2">
            <NumberField value={mind.screenHours} onChange={(v) => updateMind({ screenHours: v })} suffix="hrs (social/entertainment)" step={0.25} />
            <ToggleField
              checked={mind.phoneFreeWindows}
              onChange={(v) => updateMind({ phoneFreeWindows: v })}
              label="Phone-free before bed & after waking"
            />
          </div>
        </ItemCard>
      </PillarSection>

      {/* HEART */}
      <PillarSection id="pillar-heart" number={3} title="Heart Pulse" subtitle="Connect · Care · Give" maxPoints={10} color="pink">
        <ItemCard
          icon={<HeartHandshake className="w-3.5 h-3.5" />}
          label="Family Connection"
          points={familyPts}
          maxPoints={10}
          color="pink"
          description="30+ min quality time with spouse/kids (ideally distraction-free) = 10, else 0"
        >
          <div className="flex flex-wrap items-center gap-2">
            <NumberField value={heart.familyMinutes} onChange={(v) => updateHeart({ familyMinutes: v })} suffix="min" step={5} />
          </div>
          <input
            type="text"
            placeholder="e.g. Dinner with spouse/kids, video call with parents..."
            value={heart.familyNotes || ''}
            onChange={(e) => updateHeart({ familyNotes: e.target.value })}
            className="w-full mt-2 px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500"
          />
        </ItemCard>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            currentCharityRecord?.completed ? 'bg-pink-500/10 border-pink-500/30 shadow-sm' : 'bg-slate-800/40 border-slate-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                  currentCharityRecord?.completed ? 'bg-pink-500 text-white shadow-sm' : 'bg-slate-700 text-slate-500'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-200">Giving Back</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/30">
                    Monthly Qualifier
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  One charity/community activity during September — required for the final leaderboard
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 font-medium">This Month: </span>
              <span className={`font-bold ${currentCharityRecord?.completed ? 'text-pink-600' : 'text-orange-600'}`}>
                {currentCharityRecord?.completed ? 'Qualified ✓' : 'Pending'}
              </span>
            </div>
            <button
              onClick={openCharityModal}
              className="px-3 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/15 text-pink-400 border border-pink-500/30 text-xs font-bold transition-colors shadow-sm"
            >
              {currentCharityRecord?.completed ? 'View Details' : 'Log Charity Act'}
            </button>
          </div>
        </div>
      </PillarSection>

      {/* SOUL */}
      <PillarSection id="pillar-soul" number={4} title="Soul Glow" subtitle="Pause · Breathe · Reconnect" maxPoints={10} color="purple">
        <div className="md:col-span-2">
          <ItemCard
            icon={<Sparkles className="w-3.5 h-3.5" />}
            label="Meditation / Pranayama"
            points={meditationPts}
            maxPoints={10}
            color="purple"
            description="45+ min = 10 · 30–45 min = 5 · below 30 min = 0"
          >
            <div className="flex flex-wrap items-center gap-2">
              <NumberField value={soul.meditationMinutes} onChange={(v) => updateSoul({ meditationMinutes: v })} suffix="min" step={5} />
              <input
                type="text"
                placeholder="Technique (e.g. Anulom Vilom, Vipassana)..."
                value={soul.meditationType || ''}
                onChange={(e) => updateSoul({ meditationType: e.target.value })}
                className="flex-1 min-w-[140px] px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </ItemCard>
        </div>
      </PillarSection>

      {/* NOTES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <h4 className="text-sm font-bold text-slate-200">Daily Journal & Wins</h4>
        </div>
        <textarea
          rows={3}
          value={currentLog.notes || ''}
          onChange={(e) => updateNotes(e.target.value)}
          placeholder="Reflections on energy levels, mindset breakthroughs, workout performance or gratitude..."
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all"
        />
      </div>
    </div>
  );
};
