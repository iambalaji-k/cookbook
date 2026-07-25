import { db } from '@/core/db';
import { ratings } from '@/core/db/schema';
import { eq } from 'drizzle-orm';

export interface RatingResult {
  rating: number;
}

export async function getRating(entityId: string): Promise<RatingResult> {
  try {
    const [row] = await db
      .select({ rating: ratings.rating })
      .from(ratings)
      .where(eq(ratings.entityId, entityId))
      .limit(1);

    return { rating: row?.rating ?? 0 };
  } catch (err) {
    console.error('Error fetching rating:', err);
    return { rating: 0 };
  }
}

export async function setRating(entityId: string, ratingValue: number) {
  if (ratingValue < 1 || ratingValue > 5) {
    throw new Error('Rating must be between 1 and 5 stars.');
  }

  const now = new Date().toISOString();

  const [existing] = await db
    .select()
    .from(ratings)
    .where(eq(ratings.entityId, entityId))
    .limit(1);

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
      userIdentifier: 'chef',
      createdAt: now,
    });
  }

  return { rating: ratingValue };
}
