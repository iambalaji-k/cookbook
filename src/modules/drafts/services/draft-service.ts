import { db } from '@/core/db';
import { aiDrafts } from '@/core/db/schema';
import { createDraftSchema, type CreateDraftInput } from '../validation';
import { 
  createContentEntity, 
  updateContentEntity, 
  getContentEntityById 
} from '@/modules/content/services/content-service';
import { updateRawImportStatus, getRawImportById } from '@/modules/imports/services/import-service';
import { eq, desc } from 'drizzle-orm';

/**
 * Creates a new staged proposal entry in `ai_drafts`.
 * AI NEVER writes directly to content_entities.
 */
export async function createAIDraft(rawInput: CreateDraftInput) {
  const validated = createDraftSchema.parse(rawInput);
  const draftId = validated.id || crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(aiDrafts).values({
    id: draftId,
    rawImportId: validated.rawImportId || null,
    entityId: validated.entityId || null,
    targetContentType: validated.targetContentType,
    proposedDataJSON: validated.proposedDataJSON,
    reason: validated.reason,
    provider: validated.provider,
    model: validated.model,
    confidence: validated.confidence ?? 100,
    tokenUsage: validated.tokenUsage ?? 0,
    latencyMs: validated.latencyMs ?? 0,
    promptVersion: validated.promptVersion ?? 'v1.0',
    createdBy: validated.createdBy ?? 'ai_gateway',
    status: validated.status || 'pending',
    createdAt: now,
    updatedAt: now,
  });

  return getAIDraftById(draftId);
}

/**
 * Fetches listing of staged AI proposals ordered by creation date descending.
 */
export async function getAIDrafts(status?: 'pending' | 'approved' | 'rejected') {
  const query = status
    ? db.select().from(aiDrafts).where(eq(aiDrafts.status, status)).orderBy(desc(aiDrafts.createdAt))
    : db.select().from(aiDrafts).orderBy(desc(aiDrafts.createdAt));

  return await query;
}

/**
 * Fetches a single staged draft record with populated raw source import and target content entity.
 */
export async function getAIDraftById(id: string) {
  const [draft] = await db
    .select()
    .from(aiDrafts)
    .where(eq(aiDrafts.id, id));

  if (!draft) return null;

  const sourceImport = draft.rawImportId ? await getRawImportById(draft.rawImportId) : null;
  const targetEntity = draft.entityId ? await getContentEntityById(draft.entityId) : null;

  return {
    ...draft,
    proposedData: JSON.parse(draft.proposedDataJSON),
    sourceImport,
    targetEntity,
  };
}

/**
 * Human Approval Workflow Handler
 * Accepts optional `editedData` if administrator manually tweaked the AI proposal before committing.
 * Commits payload to `content_entities` and creates an immutable snapshot in `revisions`.
 */
export async function approveAIDraft(id: string, editedData?: any) {
  const draft = await getAIDraftById(id);
  if (!draft) {
    throw new Error(`AI Draft with ID ${id} not found.`);
  }

  if (draft.status !== 'pending') {
    throw new Error(`Draft ${id} is already ${draft.status}.`);
  }

  const payloadToCommit = (editedData && typeof editedData === 'object' && !Array.isArray(editedData)) ? editedData : draft.proposedData;
  const now = new Date().toISOString();
  let committedEntity = null;

  const aiMetadata = {
    aiProvider: draft.provider,
    aiModel: draft.model,
    aiLatencyMs: draft.latencyMs,
    aiTokenUsage: draft.tokenUsage,
    aiConfidence: draft.confidence,
    aiPromptVersion: draft.promptVersion,
    aiReasoningSummary: draft.reason,
    aiTimestamp: draft.createdAt,
  };

  // 1. If updating an existing entity, call updateContentEntity (which automatically snapshots to `revisions`)
  if (draft.entityId) {
    committedEntity = await updateContentEntity(draft.entityId, {
      ...payloadToCommit,
      ...aiMetadata,
      changeSummary: `Approved & edited AI Draft proposal (${draft.provider} ${draft.model}): ${draft.reason}`,
    });
  } else {
    // 2. If creating a brand new entity, call createContentEntity
    committedEntity = await createContentEntity({
      ...payloadToCommit,
      ...aiMetadata,
      contentType: draft.targetContentType as any,
    });
  }

  // 3. Mark draft as approved and save final committed payload to proposedDataJSON
  await db
    .update(aiDrafts)
    .set({
      proposedDataJSON: JSON.stringify(payloadToCommit),
      status: 'approved',
      updatedAt: now,
    })
    .where(eq(aiDrafts.id, id));

  // 4. Mark associated raw import as processed
  if (draft.rawImportId) {
    await updateRawImportStatus(draft.rawImportId, 'processed');
  }

  return {
    success: true,
    committedEntity,
    draft: await getAIDraftById(id),
  };
}

/**
 * Rejects an AI draft proposal with optional explanation.
 */
export async function rejectAIDraft(id: string, rejectionReason?: string) {
  const draft = await getAIDraftById(id);
  if (!draft) {
    throw new Error(`AI Draft with ID ${id} not found.`);
  }

  const now = new Date().toISOString();

  await db
    .update(aiDrafts)
    .set({
      status: 'rejected',
      rejectionReason: rejectionReason || 'Rejected by administrator during review',
      updatedAt: now,
    })
    .where(eq(aiDrafts.id, id));

  return {
    success: true,
    draft: await getAIDraftById(id),
  };
}
