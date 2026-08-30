import React, { useEffect, useState } from 'react';
import { X, Flame, Gift, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { IndividualLeaderboardEntry } from '../types';
import { fetchLatestFeedPostForUser, toggleFeedReaction, REACTION_EMOJIS } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileModalProps {
  entry: IndividualLeaderboardEntry;
  onClose: () => void;
  onEditAsAdmin?: (userId: string) => void;
}

const PILLARS: { key: 'bodyScore' | 'mindScore' | 'heartScore' | 'soulScore'; label: string; max: number; color: string }[] = [
  { key: 'bodyScore', label: 'Body', max: 40, color: 'bg-emerald-400' },
  { key: 'mindScore', label: 'Mind', max: 20, color: 'bg-indigo-400' },
  { key: 'heartScore', label: 'Heart', max: 10, color: 'bg-rose-400' },
  { key: 'soulScore', label: 'Soul', max: 10, color: 'bg-purple-400' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
            {entry.fullName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-100 truncate">{entry.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{entry.teamName || 'No team'} · Rank #{entry.rank}</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 mb-4">
          <div>
            <p className="text-2xl font-black text-amber-400">{entry.totalScore}</p>
            <p className="text-[11px] text-slate-500">total points</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-200">{entry.goalProgress}%</p>
            <p className="text-[11px] text-slate-500">of {entry.goalPoints} pt goal</p>
          </div>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${entry.goalProgress}%` }} />
        </div>

        <div className="space-y-2 mb-4">
          {PILLARS.map((p) => {
            const value = entry[p.key];
            const pct = Math.min(100, Math.round((value / p.max) * 100));
            return (
              <div key={p.key}>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>{p.label}</span>
                  <span>
                    {value}/{p.max}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          {entry.perfectDays > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5" /> {entry.perfectDays} complete day{entry.perfectDays > 1 ? 's' : ''}
            </span>
          )}
          {entry.charityQualified && (
            <span className="flex items-center gap-1 text-xs font-bold bg-pink-500/10 text-pink-400 border border-pink-500/30 px-2 py-1 rounded-full">
              <Gift className="w-3.5 h-3.5" /> Charity Qualified
            </span>
          )}
          {entry.disqualifiedWeeks > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" /> {entry.disqualifiedWeeks} week
              {entry.disqualifiedWeeks > 1 ? 's' : ''} missed qualifier
            </span>
          )}
        </div>

        <div className="border-t border-slate-800 pt-4">
          <p className="text-xs font-semibold text-slate-400 mb-2">Cheer them on</p>
          {loadingPost ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
            </div>
          ) : !latestPostId ? (
            <p className="text-xs text-slate-600 italic">No recent activity to react to yet.</p>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {REACTION_EMOJIS.map((emoji) => {
                const count = reactions.filter((r) => r.emoji === emoji).length;
                const active = reactions.some((r) => r.emoji === emoji && r.userId === profile?.id);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span>{emoji}</span>
                    {count > 0 && <span>{count}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {isAdmin && onEditAsAdmin && entry.userId !== profile?.id && (
          <button
            onClick={() => onEditAsAdmin(entry.userId)}
            className="w-full flex items-center justify-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
          >
            <Shield className="w-3.5 h-3.5" /> Edit as Admin
          </button>
        )}
      </div>
    </div>
  );
}
