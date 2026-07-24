'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, User, Clock, AlertCircle } from 'lucide-react';

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
          author: author.trim() || 'Anonymous Chef',
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
    <div className="p-6 rounded-2xl glass-panel border border-neutral-800 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Community Comments & Culinary Notes</span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-orange-400">
                {comments.length}
              </span>
            </h3>
            <p className="text-xs text-neutral-400">Share tips, substitutions, and feedback for this recipe</p>
          </div>
        </div>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1 relative">
            <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Your Name (optional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="sm:col-span-2">
            <textarea
              rows={2}
              placeholder="Write a comment or tip..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !commentText.trim()}
            className="px-4 py-2 rounded-xl amber-gradient-bg text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {comments.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-neutral-900/40 border border-neutral-800/60 text-xs text-neutral-500">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-2 group relative transition-colors hover:border-neutral-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-white">{comment.author}</span>
                  <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(comment.createdAt).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-all"
                  title="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed font-sans pl-8">
                {comment.commentText}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
