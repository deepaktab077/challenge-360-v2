import React, { useEffect, useState } from 'react';
import { X, Flame, Gift, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { IndividualLeaderboardEntry } from '../types';
import { fetchLatestFeedPostForUser, toggleFeedReaction, REACTION_EMOJIS } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { TEAMS_ENABLED } from '../constants/features';
import { ProgressRow } from './ChoiceInputs';

interface UserProfileModalProps {
  entry: IndividualLeaderboardEntry;
  onClose: () => void;
  onEditAsAdmin?: (userId: string) => void;
}

const PILLARS: { key: 'bodyScore' | 'mindScore' | 'heartScore' | 'soulScore'; label: string; max: number; color: string }[] = [
  { key: 'bodyScore', label: 'BODY', max: 40, color: 'var(--body)' },
  { key: 'mindScore', label: 'MIND', max: 20, color: 'var(--mind)' },
  { key: 'heartScore', label: 'HEART', max: 10, color: 'var(--heart)' },
  { key: 'soulScore', label: 'SOUL', max: 10, color: 'var(--soul)' },
];

export function UserProfileModal({ entry, onClose, onEditAsAdmin }: UserProfileModalProps) {
  const { profile, isAdmin } = useAuth();
  const [latestPostId, setLatestPostId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<{ emoji: string; userId: string }[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchLatestFeedPostForUser(entry.userId).then((post) => {
      if (cancelled) return;
      setLatestPostId(post?.id || null);
      setReactions(post?.reactions.map((r) => ({ emoji: r.emoji, userId: r.userId })) || []);
      setLoadingPost(false);
    });
    return () => {
      cancelled = true;
    };
  }, [entry.userId]);

  const handleReact = async (emoji: string) => {
    if (!profile || !latestPostId) return;
    const alreadyActive = reactions.some((r) => r.emoji === emoji && r.userId === profile.id);
    setReactions((prev) =>
      alreadyActive
        ? prev.filter((r) => !(r.emoji === emoji && r.userId === profile.id))
        : [...prev, { emoji, userId: profile.id }]
    );
    await toggleFeedReaction(latestPostId, profile.id, emoji, alreadyActive);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.6)' }} className="animate-fadeIn">
      <div className="card" style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: 'var(--chip)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--muted)' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
          <div className="avatar" style={{ width: 52, height: 52, fontSize: 18 }}>
            {entry.fullName[0]?.toUpperCase()}
          </div>
          <div className="grow" style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{entry.fullName}</p>
            <p className="sub" style={{ margin: 0 }}>
              {TEAMS_ENABLED ? `${entry.teamName || 'No team'} · ` : ''}Rank #{entry.rank}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between" style={{ background: 'var(--chip)', borderRadius: 14, padding: 12, marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold)', margin: 0 }}>{entry.totalScore}</p>
            <p className="sub" style={{ margin: 0 }}>total points</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{entry.goalProgress}%</p>
            <p className="sub" style={{ margin: 0 }}>of {entry.goalPoints} pt goal</p>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          {PILLARS.map((p) => (
            <ProgressRow key={p.key} label={p.label} value={entry[p.key]} max={p.max} color={p.color} />
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 14 }}>
          {entry.perfectDays > 0 && (
            <span className="tag">
              <Flame className="w-3.5 h-3.5 inline mr-1" /> {entry.perfectDays} complete day{entry.perfectDays > 1 ? 's' : ''}
            </span>
          )}
          {entry.charityQualified && (
            <span className="tag">
              <Gift className="w-3.5 h-3.5 inline mr-1" /> Charity Qualified
            </span>
          )}
          {entry.disqualifiedWeeks > 0 && (
            <span className="tag" style={{ color: 'var(--danger)' }}>
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> {entry.disqualifiedWeeks} week
              {entry.disqualifiedWeeks > 1 ? 's' : ''} missed qualifier
            </span>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Cheer them on</p>
          {loadingPost ? (
            <div className="sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
            </div>
          ) : !latestPostId ? (
            <p className="sub" style={{ fontStyle: 'italic' }}>No recent activity to react to yet.</p>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {REACTION_EMOJIS.map((emoji) => {
                const count = reactions.filter((r) => r.emoji === emoji).length;
                const active = reactions.some((r) => r.emoji === emoji && r.userId === profile?.id);
                return (
                  <button key={emoji} onClick={() => handleReact(emoji)} className={`choice ${active ? 'on' : ''}`} style={{ padding: '5px 9px' }}>
                    {emoji} {count > 0 ? count : ''}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {isAdmin && onEditAsAdmin && entry.userId !== profile?.id && (
          <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => onEditAsAdmin(entry.userId)}>
            <Shield className="w-3.5 h-3.5 inline mr-1.5" /> Edit as Admin
          </button>
        )}
      </div>
    </div>
  );
}
