import { z } from 'zod';

export const sourceTypeEnum = z.enum([
  'url',
  'ocr_image',
  'pdf',
  'plain_text',
  'transcript',
]);

export type SourceType = z.infer<typeof sourceTypeEnum>;

export const rawImportSchema = z.object({
  id: z.string().optional(),
  sourceType: sourceTypeEnum,
  sourceUrl: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  rawPayload: z.string().min(1, 'Source payload text is required'),
  metadataJSON: z.string().nullable().optional(),
  status: z.enum(['pending', 'processed', 'failed']).default('pending'),
});

export type RawImportInput = z.infer<typeof rawImportSchema>;
