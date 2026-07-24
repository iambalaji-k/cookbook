import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { contentEntities } from './content';

/**
 * Revisions Table
 * Permanent, immutable history of approved entity snapshots for rollback & auditing.
 */
export const revisions = sqliteTable('revisions', {
  id: text('id').primaryKey(), // UUID
  entityId: text('entity_id').notNull().references(() => contentEntities.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(),
  revisionNumber: integer('revision_number').notNull(),
  snapshotJSON: text('snapshot_json').notNull(),
  changeSummary: text('change_summary'),
  approvedBy: text('approved_by').default('admin').notNull(),
  approvedAt: text('approved_at').notNull(),
  createdAt: text('created_at').notNull(),
});
