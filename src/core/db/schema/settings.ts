import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * System Settings Table
 * App preferences (theme, metric/imperial, PWA toggles, search mode).
 */
export const systemSettings = sqliteTable('system_settings', {
  id: text('id').primaryKey().default('system'),
  theme: text('theme', { enum: ['dark', 'light'] }).default('dark').notNull(),
  unitSystem: text('unit_system', { enum: ['metric', 'imperial'] }).default('metric').notNull(),
  pwaEnabled: integer('pwa_enabled', { mode: 'boolean' }).default(true).notNull(),
  defaultLanguage: text('default_language').default('en').notNull(),
  searchMode: text('search_mode', { enum: ['fts5', 'hybrid'] }).default('fts5').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * AI Provider Settings Table
 * Provider-agnostic AI Gateway configuration (OpenAI, DeepSeek, Groq, Ollama).
 */
export const aiProviderSettings = sqliteTable('ai_provider_settings', {
  id: text('id').primaryKey().default('default'),
  provider: text('provider').default('openai').notNull(),
  baseUrl: text('base_url').default('https://api.openai.com/v1').notNull(),
  apiKey: text('api_key'),
  model: text('model').default('gpt-4o-mini').notNull(),
  temperature: text('temperature').default('0.2').notNull(),
  promptVersion: text('prompt_version').default('v1.0').notNull(),
  updatedAt: text('updated_at').notNull(),
});
