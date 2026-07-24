import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { contentEntities } from './content';

/**
 * Recipe Ratings Sub-Table
 * Stores user ratings (1 to 5 stars) per recipe/content entity.
 */
export const ratings = sqliteTable('ratings', {
  id: text('id').primaryKey(), // UUID
  entityId: text('entity_id').notNull().references(() => contentEntities.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1 to 5 stars
  userIdentifier: text('user_identifier').default('guest').notNull(),
  createdAt: text('created_at').notNull(),
});
