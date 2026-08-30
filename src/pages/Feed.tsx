import React, { useEffect, useState } from 'react';
import { MessageCircle, Loader2, Sparkles } from 'lucide-react';
import { fetchFeed, toggleFeedReaction, REACTION_EMOJIS } from '../services/dataService';
import { FeedPost } from '../types';
import { useAuth } from '../contexts/AuthContext';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function Feed() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => fetchFeed().then((p) => {
    setPosts(p);
    setLoading(false);
  });

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReact = async (postId: string, emoji: string, alreadyActive: boolean) => {
    if (!profile) return;
    // optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const reactions = alreadyActive
          ? p.reactions.filter((r) => !(r.userId === profile.id && r.emoji === emoji))
          : [...p.reactions, { id: 'temp', postId, userId: profile.id, emoji, createdAt: new Date().toISOString() }];
        return { ...p, reactions };
      })
    );
    await toggleFeedReaction(postId, profile.id, emoji, alreadyActive);
  };

  return (
    <div className="animate-fadeIn space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-emerald-400" />
          Feed
        </h1>
        <p className="text-sm text-slate-400 mt-1">See who's showing up today — cheer them on!</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading feed…
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-700" />
          No activity yet — be the first to log today!
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const reactionCounts = REACTION_EMOJIS.map((emoji) => ({
              emoji,
              count: post.reactions.filter((r) => r.emoji === emoji).length,
              active: post.reactions.some((r) => r.emoji === emoji && r.userId === profile?.id),
            })).filter((r) => r.count > 0 || true);

            return (
              <div
                key={post.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {post.fullName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-100">{post.fullName}</p>
                      <p className="text-xs text-slate-500">
                        {timeAgo(post.createdAt)} {post.teamName ? `· ${post.teamName}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                    +{post.totalScore} pts
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-200 mt-3 flex items-center gap-1.5">
                  {post.allDimensionsCompleted ? '⭐ 360° Complete Day!' : '🚀 High Scoring Day!'}
                </p>
                <p className="text-sm text-slate-400 mt-0.5">{post.message}</p>

                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {reactionCounts.map(({ emoji, count, active }) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(post.id, emoji, active)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                        active
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span>{emoji}</span>
                      {count > 0 && <span>{count}</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
