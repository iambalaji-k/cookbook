import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { rawImports } from './imports';
import { contentEntities } from './content';

/**
 * AI Drafts Table
 * Staged AI proposals awaiting explicit human administrator approval or rejection.
 * Includes confidence metrics, token usage, latency, prompt versioning, and rationale summaries.
 */
export const aiDrafts = sqliteTable('ai_drafts', {
  id: text('id').primaryKey(), // UUID
  rawImportId: text('raw_import_id').references(() => rawImports.id, { onDelete: 'set null' }),
  entityId: text('entity_id').references(() => contentEntities.id, { onDelete: 'set null' }),
  targetContentType: text('target_content_type', {
    enum: ['recipe', 'technique', 'ingredient_guide', 'sauce', 'spice_blend', 'kitchen_tip'],
  }).notNull(),
  proposedDataJSON: text('proposed_data_json').notNull(),
  reason: text('reason').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  confidence: integer('confidence').default(100).notNull(), // 0 to 100 confidence score
  tokenUsage: integer('token_usage').default(0).notNull(),
  latencyMs: integer('latency_ms').default(0).notNull(),
  promptVersion: text('prompt_version').default('v1.0').notNull(),
  createdBy: text('created_by').default('ai_gateway').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).default('pending').notNull(),
  rejectionReason: text('rejection_reason'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
