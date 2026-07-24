import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Generic Content Model Table (Polymorphic Base)
 * Supports Recipes, Techniques, Ingredient Guides, Sauces, Spice Blends, and Kitchen Tips.
 */
export const contentEntities = sqliteTable('content_entities', {
  id: text('id').primaryKey(), // UUID
  contentType: text('content_type', {
    enum: ['recipe', 'technique', 'ingredient_guide', 'sauce', 'spice_blend', 'kitchen_tip'],
  }).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  summary: text('summary'),
  status: text('status', { enum: ['draft', 'published', 'archived'] }).default('published').notNull(),
  servings: integer('servings').default(4),
  prepTimeMinutes: integer('prep_time_minutes'),
  cookTimeMinutes: integer('cook_time_minutes'),
  cuisine: text('cuisine'),
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }),
  imageUrl: text('image_url'),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false).notNull(),
  // AI Generation Metadata
  aiProvider: text('ai_provider'),
  aiModel: text('ai_model'),
  aiLatencyMs: integer('ai_latency_ms'),
  aiTokenUsage: integer('ai_token_usage'),
  aiConfidence: integer('ai_confidence'),
  aiPromptVersion: text('ai_prompt_version'),
  aiReasoningSummary: text('ai_reasoning_summary'),
  aiTimestamp: text('ai_timestamp'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Structured Ingredients Sub-Table
 */
export const ingredients = sqliteTable('ingredients', {
  id: text('id').primaryKey(), // UUID
  entityId: text('entity_id').notNull().references(() => contentEntities.id, { onDelete: 'cascade' }),
  itemName: text('item_name').notNull(),
  amount: real('amount'),
  unit: text('unit'),
  notes: text('notes'),
  sortOrder: integer('sort_order').default(0).notNull(),
});

/**
 * Structured Instructions Sub-Table
 */
export const instructions = sqliteTable('instructions', {
  id: text('id').primaryKey(), // UUID
  entityId: text('entity_id').notNull().references(() => contentEntities.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  instructionText: text('instruction_text').notNull(),
  timerMinutes: integer('timer_minutes'),
});

/**
 * Images Gallery Sub-Table
 */
export const images = sqliteTable('images', {
  id: text('id').primaryKey(), // UUID
  entityId: text('entity_id').notNull().references(() => contentEntities.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false).notNull(),
});

/**
 * Tags Categorization Sub-Table
 */
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(), // UUID
  entityId: text('entity_id').notNull().references(() => contentEntities.id, { onDelete: 'cascade' }),
  tagName: text('tag_name').notNull(),
});
