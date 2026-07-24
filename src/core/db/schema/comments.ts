import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { contentEntities } from './content';

/**
 * Recipe Comments Sub-Table
 * Stores user comments for each recipe/content entity.
 */
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(), // UUID
  entityId: text('entity_id').notNull().references(() => contentEntities.id, { onDelete: 'cascade' }),
  author: text('author').notNull(),
  commentText: text('comment_text').notNull(),
  createdAt: text('created_at').notNull(),
});
