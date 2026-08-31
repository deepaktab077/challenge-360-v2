import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { AchievementResult, AchievementTag } from '../services/achievementService';

interface AchievementModalProps {
  result: AchievementResult;
  onClose: () => void;
}

function AchievementSection({ title, tags }: { title: string; tags: AchievementTag[] }) {
  if (!tags.length) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div className="ey" style={{ marginBottom: 8 }}>{title}</div>
      <div className="achievement-modal-list">
        {tags.map((tag) => (
          <div className="achievement-modal-item" key={tag.id}>
            <div className="achievement-modal-icon">{tag.icon}</div>
            <div style={{ minWidth: 0 }}>
              <strong>{tag.label}</strong>
              <div className="sub">{tag.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AchievementModal({ result, onClose }: AchievementModalProps) {
  if (!result.all.length) return null;

  return (
    <div className="achievement-modal-backdrop" role="dialog" aria-modal="true" aria-label="Achievements earned">
      <div className="achievement-modal animate-fadeIn">
        <button className="achievement-modal-close" onClick={onClose} aria-label="Close achievements">
          <X className="w-4 h-4" />
        </button>
        <div className="achievement-modal-hero">
          <div className="achievement-modal-trophy">🏆</div>
          <div>
            <div className="ey">ACHIEVEMENT UNLOCKED</div>
            <h2 style={{ margin: '3px 0 0' }}>Great work! <Sparkles className="w-4 h-4 inline" /></h2>
            <p className="sub" style={{ margin: '4px 0 0' }}>Your saved check-in earned the following achievements.</p>
          </div>
        </div>

        <AchievementSection title="TODAY'S ACHIEVEMENTS" tags={result.daily} />
        <AchievementSection title="WEEKLY ACHIEVEMENTS" tags={result.weekly} />
        <AchievementSection title="OVERALL ACHIEVEMENT" tags={result.overall} />

        <button className="btn-primary" style={{ width: '100%', marginTop: 18 }} onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
}
