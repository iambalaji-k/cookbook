import { db } from '@/core/db';
import { rawImports } from '@/core/db/schema';
import { rawImportSchema, type RawImportInput } from '../validation';
import { eq, desc } from 'drizzle-orm';

/**
 * Creates a new raw import record preserving the unadulterated source payload.
 */
export async function createRawImport(rawInput: RawImportInput) {
  const validated = rawImportSchema.parse(rawInput);
  const importId = validated.id || crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(rawImports).values({
    id: importId,
    sourceType: validated.sourceType,
    sourceUrl: validated.sourceUrl || null,
    rawPayload: validated.rawPayload,
    metadataJSON: validated.metadataJSON || null,
    status: validated.status || 'pending',
    createdAt: now,
  });

  return getRawImportById(importId);
}

/**
 * Lists all raw imports ordered by creation date descending.
 */
export async function getRawImports(status?: 'pending' | 'processed' | 'failed') {
  const query = status
    ? db.select().from(rawImports).where(eq(rawImports.status, status)).orderBy(desc(rawImports.createdAt))
    : db.select().from(rawImports).orderBy(desc(rawImports.createdAt));

  return await query;
}

/**
 * Fetches a single raw import record by ID.
 */
export async function getRawImportById(id: string) {
  const [record] = await db
    .select()
    .from(rawImports)
    .where(eq(rawImports.id, id));

  return record || null;
}

/**
 * Updates the status of a raw import record.
 */
export async function updateRawImportStatus(id: string, status: 'pending' | 'processed' | 'failed') {
  await db
    .update(rawImports)
    .set({ status })
    .where(eq(rawImports.id, id));

  return getRawImportById(id);
}

/**
 * Deletes a raw import record by ID.
 */
export async function deleteRawImport(id: string) {
  await db.delete(rawImports).where(eq(rawImports.id, id));
  return { success: true };
}
