import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserName, updateLeaderboardVisibility, fetchAllEarnedAchievements, EarnedAchievementRecord } from '../services/dataService';
import { ACHIEVEMENT_DEFINITIONS } from '../services/achievementService';

export function Profile() {
  const { profile, refreshMyProfile } = useAuth();
  const [name, setName] = useState(profile?.fullName || '');
  const [visible, setVisible] = useState(profile?.leaderboardVisible ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [earned, setEarned] = useState<EarnedAchievementRecord[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchAllEarnedAchievements(profile.id).then((records) => {
      setEarned(records);
      setLoadingBadges(false);
    });
  }, [profile?.id]);

  if (!profile) return null;

  const handleSave = async () => {
    setSaving(true);
    if (name.trim() && name.trim() !== profile.fullName) {
      await updateUserName(profile.id, name.trim());
    }
    if (visible !== profile.leaderboardVisible) {
      await updateLeaderboardVisibility(profile.id, visible);
    }
    await refreshMyProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const earnedById = new Map<string, string>(earned.map((e) => [e.achievementId, e.earnedAt]));

  return (
    <div className="animate-fadeIn grid g2">
      <div className="card">
        <div className="ey">PROFILE</div>
        <h2>{profile.fullName}</h2>
        <div className="form2">
          <div>
            <label className="field-label">Display name</label>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Community</label>
            <input className="field-input" value="Challenge 360°" disabled />
          </div>
        </div>

        <label className="field-label">Privacy</label>
        <div className="toggleline">
          <div>
            <b style={{ fontSize: 13 }}>Show me on the leaderboard</b>
            <div className="sub">Turn this off to hide your name from other participants' rankings.</div>
          </div>
          <div className={`toggle ${visible ? 'on' : ''}`} onClick={() => setVisible((v) => !v)} />
        </div>

        <button className="btn-primary" style={{ marginTop: 14 }} onClick={handleSave} disabled={saving}>
          {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="card">
        <div className="ey">DATA</div>
        <h2>Where are my records?</h2>
        <p className="sub">
          Everything you log — daily check-ins, health report screenshots, reflections — is stored in a private
          Supabase Postgres database with row-level security, plus private Supabase Storage for images. No data ever
          goes to a third party, and nothing is public unless you choose to appear on the leaderboard.
        </p>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="ey">BADGES</div>
        <h2>{loadingBadges ? 'Loading…' : `${earned.length} of ${ACHIEVEMENT_DEFINITIONS.length} earned`}</h2>
        <div className="badgegrid">
          {ACHIEVEMENT_DEFINITIONS.map((def) => {
            const earnedAt = earnedById.get(def.id);
            const isEarned = !!earnedAt;
            return (
              <div key={def.id} className="badge-item" style={{ opacity: isEarned ? 1 : 0.5 }}>
                <span>{def.icon}</span>
                <b>{def.label}</b>
                <p className="sub" style={{ margin: 0 }}>
                  {isEarned ? `Earned ${new Date(earnedAt!).toLocaleDateString()}` : def.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
