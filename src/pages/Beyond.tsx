import React, { useEffect, useState } from 'react';
import { loadReflection, saveReflection } from '../services/dataService';

interface BeyondProps {
  userId: string;
  weekKey: string;
}

export function Beyond({ userId, weekKey }: BeyondProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadReflection(userId, weekKey).then((r) => {
      if (cancelled) return;
      setContent(r?.content || '');
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, weekKey]);

  const handleSave = async () => {
    await saveReflection(userId, weekKey, content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fadeIn grid g2">
      <div className="card">
        <div className="ey">BEYOND</div>
        <h2>Reflect • Evolve • Inspire</h2>
        <p className="sub">Reflection and giving stay meaningful rather than becoming a high-value points race.</p>
        <label className="field-label">This week's reflection</label>
        <textarea
          className="field-textarea"
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          placeholder="What made this week meaningful?"
        />
        <button className="btn-primary" style={{ marginTop: 8 }} onClick={handleSave} disabled={loading}>
          {saved ? 'Saved ✓' : 'Save privately'}
        </button>
      </div>
      <div className="card">
        <div className="ey">ONE QUESTION</div>
        <h2>What did you do this week that made someone else's life a little better?</h2>
        <div className="notice">Private by default — only you (and admins, for moderation) can see this.</div>
      </div>
    </div>
  );
}
