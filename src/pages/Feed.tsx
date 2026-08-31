import React, { useEffect, useState } from 'react';
import { MessageCircle, Loader2, Sparkles, Send, Trash2 } from 'lucide-react';
import { fetchFeed, toggleFeedReaction, addFeedComment, deleteFeedComment, REACTION_EMOJIS } from '../services/dataService';
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
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const reload = () =>
    fetchFeed().then((p) => {
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
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const reactions = alreadyActive
          ? p.reactions.filter((r) => !(r.userId === profile.id && r.emoji === emoji))
          : [...p.reactions, { id: 'temp', postId, userId: profile.id, emoji, createdAt: new Date().toISOString() }];
        return { ...p, reactions };
      })
    );
    try {
      await toggleFeedReaction(postId, profile.id, emoji, alreadyActive);
    } catch {
      await reload();
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = (commentDrafts[postId] || '').trim();
    if (!content || !profile) return;
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: 'temp_' + Date.now(),
                  postId,
                  userId: profile.id,
                  fullName: profile.fullName,
                  content,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : p
      )
    );
    try {
      await addFeedComment(postId, profile.id, content);
    } catch {
      await reload();
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!profile) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p))
    );
    await deleteFeedComment(commentId, profile.id);
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 640, margin: '0 auto', display: 'grid', gap: 14 }}>
      {loading ? (
        <div className="sub" style={{ textAlign: 'center', padding: '48px 0' }}>
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading feed…
        </div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 0' }}>
          <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--line)' }} />
          <p className="sub">No activity yet — be the first to log today!</p>
        </div>
      ) : (
        posts.map((post) => {
          const reactionCounts = REACTION_EMOJIS.map((emoji) => ({
            emoji,
            count: post.reactions.filter((r) => r.emoji === emoji).length,
            active: post.reactions.some((r) => r.emoji === emoji && r.userId === profile?.id),
          }));
          const commentsOpen = !!expandedComments[post.id];

          return (
            <div key={post.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="avatar">{post.fullName?.[0]?.toUpperCase() || '?'}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{post.fullName}</p>
                    <p className="sub" style={{ margin: 0 }}>
                      {timeAgo(post.createdAt)} {post.teamName ? `· ${post.teamName}` : ''}
                    </p>
                  </div>
                </div>
                <span className="tag">+{post.totalScore} pts</span>
              </div>

              <p style={{ fontWeight: 700, fontSize: 14, marginTop: 10, color: 'var(--ink)' }}>
                {post.allDimensionsCompleted ? '⭐ 360° Complete Day!' : '🚀 Daily Check-in'}
              </p>
              <p className="sub">{post.message}</p>

              {post.achievementTags.length > 0 && (
                <div className="achievement-tags" aria-label="Achievements earned">
                  {post.achievementTags.map((tag) => (
                    <span key={tag.id} className="achievement-tag">
                      {tag.icon} {tag.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: 10 }}>
                {reactionCounts.map(({ emoji, count, active }) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(post.id, emoji, active)}
                    className={`choice ${active ? 'on' : ''}`}
                    style={{ padding: '5px 9px' }}
                  >
                    {emoji} {count > 0 ? count : ''}
                  </button>
                ))}
                <button
                  className="choice"
                  style={{ padding: '5px 9px' }}
                  onClick={() => setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                >
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  {post.comments.length > 0 ? post.comments.length : 'Comment'}
                </button>
              </div>

              {commentsOpen && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  {post.comments.map((c) => (
                    <div key={c.id} className="list-row" style={{ borderTop: 0, alignItems: 'flex-start' }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                        {c.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="grow">
                        <p style={{ fontSize: 12, margin: 0 }}>
                          <b>{c.fullName}</b> <span className="sub">{timeAgo(c.createdAt)}</span>
                        </p>
                        <p style={{ fontSize: 13, margin: '2px 0 0', color: 'var(--ink)' }}>{c.content}</p>
                      </div>
                      {c.userId === profile?.id && (
                        <button
                          onClick={() => handleDeleteComment(post.id, c.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      className="field-input"
                      placeholder="Cheer them on…"
                      value={commentDrafts[post.id] || ''}
                      onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    />
                    <button className="btn-secondary" onClick={() => handleAddComment(post.id)}>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
