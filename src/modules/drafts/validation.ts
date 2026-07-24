import { z } from 'zod';
import { contentTypeEnum } from '../content/validation';

export const createDraftSchema = z.object({
  id: z.string().optional(),
  rawImportId: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  targetContentType: contentTypeEnum,
  proposedDataJSON: z.string().min(1, 'Proposed data JSON is required'),
  reason: z.string().min(1, 'AI rationale is required'),
  provider: z.string().min(1),
  model: z.string().min(1),
  confidence: z.number().min(0).max(100).default(100),
  tokenUsage: z.number().default(0),
  latencyMs: z.number().default(0),
  promptVersion: z.string().default('v1.0'),
  createdBy: z.string().default('ai_gateway'),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

export type CreateDraftInput = z.infer<typeof createDraftSchema>;
