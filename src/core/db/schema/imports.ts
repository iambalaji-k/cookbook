import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Raw Imports Table
 * Stores unadulterated source material (URLs, raw Tesseract OCR text, PDF dumps, transcripts) for future prompt re-processing.
 */
export const rawImports = sqliteTable('raw_imports', {
  id: text('id').primaryKey(), // UUID
  sourceType: text('source_type', {
    enum: ['url', 'ocr_image', 'pdf', 'plain_text', 'transcript'],
  }).notNull(),
  sourceUrl: text('source_url'),
  rawPayload: text('raw_payload').notNull(),
  metadataJSON: text('metadata_json'),
  status: text('status', { enum: ['pending', 'processed', 'failed'] }).default('pending').notNull(),
  createdAt: text('created_at').notNull(),
});
