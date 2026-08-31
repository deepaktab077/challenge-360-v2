import React from 'react';
import {
  X,
  ShieldCheck,
  Footprints,
  Salad,
  Droplets,
  Moon,
  Clock,
  BookOpen,
  PhoneOff,
  HeartHandshake,
  Gift,
  Sparkles,
  Trophy,
  Users,
  Dumbbell,
} from 'lucide-react';

interface RulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RuleRow: React.FC<{ icon: React.ReactNode; label: string; points: string; description: string }> = ({
  icon,
  label,
  points,
  description,
}) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-b-0">
    <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-sm text-slate-200">{label}</span>
        <span className="text-xs font-black text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md whitespace-nowrap">
          {points}
        </span>
      </div>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
  </div>
);

export const RulebookModal: React.FC<RulebookModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800/60 bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">360° September Challenge — Official Rules</h3>
              <p className="text-xs text-slate-500">Body · Mind · Heart · Soul — Final Proposed Point System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
          <p className="text-xs text-slate-500 italic">
            "The objective is not to be exceptional in just one area. It is to build consistency and balance across
            all four dimensions."
          </p>

          <section className="rule-summary">
            <h4 className="text-sm font-black text-amber-400 uppercase tracking-wide mb-2">🏆 Daily Points — Max 85 pts / Day</h4>
            <div className="rule-summary-grid">
              <div><b>🏃 Body</b><span>40 pts</span></div>
              <div><b>🧠 Mind</b><span>20 pts</span></div>
              <div><b>❤️ Heart</b><span>10 pts</span></div>
              <div><b>🧘 Soul</b><span>10 pts</span></div>
              <div><b>⭐ Complete Day</b><span>+5 pts</span></div>
              <div><b>🏋️ Morning Group Workout</b><span>+50 pts / week</span></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Base daily score is capped at 80 points, plus the automatic +5 Complete Day bonus. The +50 Morning Group Workout is a separate weekly bonus and can be earned once per week.</p>
          </section>

          {/* BODY */}
          <section>
            <h4 className="text-sm font-black text-indigo-400 uppercase tracking-wide mb-1">
              Body Prime — Move · Nourish · Hydrate · Recover
            </h4>
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl px-4">
              <RuleRow
                icon={<Dumbbell className="w-4 h-4" />}
                label="Strength / Cardio"
                points="Qualifier"
                description="Minimum 45-minute session, at least 2x/week. Once a week ends, if it fell short, that week's points (including any morning workout bonus) are excluded from the leaderboard — the current week in progress is never judged early."
              />
              <RuleRow
                icon={<Footprints className="w-4 h-4" />}
                label="Movement"
                points="10 pts"
                description="10,000+ steps = 10 · 8,000–9,999 = 5 · below 8,000 = 0"
              />
              <RuleRow
                icon={<Users className="w-4 h-4" />}
                label="Morning Group Workout"
                points="+50 bonus"
                description="Morning group workout on any 1 day = +50 bonus. Applicable once a week only."
              />
              <RuleRow
                icon={<Salad className="w-4 h-4" />}
                label="Nutrition"
                points="10 pts"
                description="Follow your pre-decided healthy diet = 5 · Complete No-Cheat Day = +5 bonus · max 10/day"
              />
              <RuleRow
                icon={<Droplets className="w-4 h-4" />}
                label="Hydration"
                points="7 pts"
                description="3–3.99L = 4 · 4L+ = 7 · below 3L = 0"
              />
              <RuleRow
                icon={<Moon className="w-4 h-4" />}
                label="Sleep Duration"
                points="7 pts"
                description="7.5h+ = 7 · 7.0–7.49h = 5 · 6.5–6.99h = 2 · below 6.5h = 0"
              />
              <RuleRow
                icon={<Clock className="w-4 h-4" />}
                label="Sleep Discipline"
                points="6 pts"
                description="By 10:00 PM = 6 · 10:01–10:15 = 4 · 10:16–10:30 = 2 · after 10:30 = 0"
              />
            </div>
          </section>

          {/* MIND */}
          <section>
            <h4 className="text-sm font-black text-rose-400 uppercase tracking-wide mb-1">
              Mind Spark — Learn · Grow · Disconnect
            </h4>
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl px-4">
              <RuleRow
                icon={<BookOpen className="w-4 h-4" />}
                label="Meaningful Learning / Podcast / Video"
                points="10 pts"
                description="Minimum 45 minutes/day. Reading, audiobook, educational podcast or other meaningful learning qualifies. Regular news/current affairs does not qualify."
              />
              <RuleRow
                icon={<PhoneOff className="w-4 h-4" />}
                label="Screen Discipline"
                points="10 pts"
                description="Social media + entertainment apps <2 hrs/day = 10 · 2–3 hrs = 5 · >3 hrs = 0. No phone use 30 min before sleeping and after waking up."
              />
            </div>
          </section>

          {/* HEART */}
          <section>
            <h4 className="text-sm font-black text-pink-400 uppercase tracking-wide mb-1">
              Heart Pulse — Connect · Care · Give
            </h4>
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl px-4">
              <RuleRow
                icon={<HeartHandshake className="w-4 h-4" />}
                label="Family Connection"
                points="10 pts"
                description="Minimum 30 minutes of quality time with spouse/kids, ideally without phones/distractions."
              />
              <RuleRow
                icon={<Gift className="w-4 h-4" />}
                label="Giving Back"
                points="Monthly qualifier"
                description="Minimum one meaningful charity/community activity during September. No points attached to the amount of money spent — must be completed to qualify for the final leaderboard."
              />
            </div>
          </section>

          {/* SOUL */}
          <section>
            <h4 className="text-sm font-black text-purple-400 uppercase tracking-wide mb-1">
              Soul Glow — Pause · Breathe · Reconnect
            </h4>
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl px-4">
              <RuleRow
                icon={<Sparkles className="w-4 h-4" />}
                label="Meditation / Pranayama"
                points="10 pts"
                description="45+ minutes = 10 · 30–45 minutes = 5 · below 30 minutes = 0"
              />
            </div>
          </section>

          {/* BONUS */}
          <section>
            <h4 className="text-sm font-black text-amber-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> 360° Complete Day Bonus
            </h4>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200">
              Complete the core requirement in all four dimensions on the same day — Body ✓ Mind ✓ Heart ✓ Soul ✓ —
              and earn <strong>+5 bonus points</strong>.
            </div>
          </section>

          {/* QUALIFICATION */}
          <section>
            <h4 className="text-sm font-black text-slate-200 uppercase tracking-wide mb-1">Critical Qualifiers</h4>
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-xl p-4 text-xs space-y-1.5">
              <p>⚠️ These must be met — they directly affect your leaderboard score:</p>
              <p>1️⃣ <strong>Weekly Strength Qualifier</strong>: minimum 2 × 45-minute strength/cardio sessions every week. Miss it by the time that week ends, and the whole week's points (plus any morning workout bonus) are excluded from the leaderboard. The week currently in progress always counts normally until it's over.</p>
              <p>2️⃣ <strong>Monthly Charity Qualifier</strong>: at least 1 community giving act during September, required to appear on the final leaderboard.</p>
            </div>
          </section>

          <section className="rule-howto">
            <h4 className="text-sm font-black text-slate-200 uppercase tracking-wide mb-2">⚡ How to Log</h4>
            <p>1️⃣ Open the Challenge 360 application.</p>
            <p>2️⃣ Pick your name and tap your habits — it should take less than 15 seconds daily.</p>
            <p>3️⃣ Check the Leaderboard and cheer the team in the Community Feed. 💪✨</p>
          </section>

          <p className="text-xs text-slate-500 text-center pt-2">
            Daily max: Body (40) + Mind (20) + Heart (10) + Soul (10) = 80 base points + 5 Complete Day Bonus = 85.
            Weekly bonus: +50 Morning Group Workout, once per week.
          </p>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-800/60 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
