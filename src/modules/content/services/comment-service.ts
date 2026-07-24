import { db } from '@/core/db';
import { comments } from '@/core/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Fetches all comments for a content entity ordered by creation date descending.
 */
export async function getCommentsByEntityId(entityId: string) {
  try {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.entityId, entityId))
      .orderBy(desc(comments.createdAt));
  } catch (err) {
    console.error('Error fetching comments:', err);
    return [];
  }
}

/**
 * Adds a new comment for a content entity.
 */
export async function addComment(entityId: string, author: string, commentText: string) {
  const cleanAuthor = author.trim() || 'Anonymous Chef';
  const cleanText = commentText.trim();

  if (!cleanText) {
    throw new Error('Comment text cannot be empty.');
  }

  const commentId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(comments).values({
    id: commentId,
    entityId,
    author: cleanAuthor,
    commentText: cleanText,
    createdAt: now,
  });

  return getCommentsByEntityId(entityId);
}

/**
 * Deletes a comment by ID.
 */
export async function deleteComment(commentId: string, entityId: string) {
  await db.delete(comments).where(eq(comments.id, commentId));
  return getCommentsByEntityId(entityId);
}
