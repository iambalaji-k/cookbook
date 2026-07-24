'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, User, Clock, AlertCircle } from 'lucide-react';

export interface CommentItem {
  id: string;
  entityId: string;
  author: string;
  commentText: string;
  createdAt: string;
}

export interface RecipeCommentsSectionProps {
  entityId: string;
  initialComments?: CommentItem[];
}

export function RecipeCommentsSection({
  entityId,
  initialComments = [],
}: RecipeCommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [author, setAuthor] = useState('');
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch live comments on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchComments() {
      setLoading(true);
      try {
        const res = await fetch(`/api/content/${entityId}/comments`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setComments(data);
          }
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (entityId) fetchComments();
    return () => { isMounted = false; };
  }, [entityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/content/${entityId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: author.trim() || 'Chef',
          commentText: commentText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.comments);
        setCommentText('');
      } else {
        setError(data.error || 'Failed to post comment.');
      }
    } catch (err: any) {
      setError(err.message || 'Error posting comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/content/${entityId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-2xl elevation-level2 border border-neutral-800/90 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-sm">
            <MessageSquare className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <span>Culinary Notes & Comments</span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-orange-400">
                {comments.length}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 font-sans">Share cooking notes, variations, and feedback</p>
          </div>
        </div>
      </div>

      {/* Separate Input Boxes Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Separate Username Box */}
        <div className="relative max-w-xs">
          <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Your Name (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 transition-colors font-sans"
          />
        </div>

        {/* Separate Comment Text Box */}
        <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800/90 p-4 space-y-3 focus-within:border-orange-500/50 transition-all">
          <textarea
            rows={3}
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            required
            className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed font-sans"
          />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="px-5 py-2 rounded-xl amber-gradient-bg text-white text-xs font-bold hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100 shadow-md cursor-pointer"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>

      {/* Comments Feed */}
      <div className="space-y-3 pt-2">
        {comments.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-neutral-900/40 border border-neutral-800/60 text-xs text-zinc-500 font-sans">
            No culinary notes posted yet. Be the first to share your experience!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4.5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-2 group relative transition-colors hover:border-neutral-700/80 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-400 font-mono font-bold text-xs flex items-center justify-center border border-orange-500/30">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-white font-sans">{comment.author}</span>
                  <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {new Date(comment.createdAt).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-zinc-200 leading-relaxed font-sans pl-9">
                {comment.commentText}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
