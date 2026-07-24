import { db } from '@/core/db';
import { ratings } from '@/core/db/schema';
import { eq, sql, avg, count, and } from 'drizzle-orm';

export interface RatingSummary {
  averageRating: number;
  totalRatings: number;
}

/**
 * Calculates average star rating and total vote count for a content entity.
 */
export async function getRatingSummary(entityId: string): Promise<RatingSummary> {
  try {
    const result = await db
      .select({
        avgRating: avg(ratings.rating),
        totalCount: count(ratings.id),
      })
      .from(ratings)
      .where(eq(ratings.entityId, entityId));

    const rawAvg = result[0]?.avgRating ? Number(result[0].avgRating) : 0;
    const total = result[0]?.totalCount ? Number(result[0].totalCount) : 0;

    return {
      averageRating: Math.round(rawAvg * 10) / 10,
      totalRatings: total,
    };
  } catch (err) {
    console.error('Error fetching rating summary:', err);
    return { averageRating: 0, totalRatings: 0 };
  }
}

/**
 * Adds or updates a user rating for a content entity.
 */
export async function addOrUpdateRating(
  entityId: string,
  ratingValue: number,
  userIdentifier: string = 'guest'
) {
  if (ratingValue < 1 || ratingValue > 5) {
    throw new Error('Rating must be between 1 and 5 stars.');
  }

  const now = new Date().toISOString();

  // Check if rating exists for this entity and user
  const [existing] = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.entityId, entityId), eq(ratings.userIdentifier, userIdentifier)));

  if (existing) {
    await db
      .update(ratings)
      .set({ rating: ratingValue, createdAt: now })
      .where(eq(ratings.id, existing.id));
  } else {
    await db.insert(ratings).values({
      id: crypto.randomUUID(),
      entityId,
      rating: ratingValue,
      userIdentifier,
      createdAt: now,
    });
  }

  return getRatingSummary(entityId);
}
