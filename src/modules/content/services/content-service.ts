import { db } from '@/core/db';
import { 
  contentEntities, 
  ingredients, 
  instructions, 
  images, 
  tags, 
  revisions 
} from '@/core/db/schema';
import { createContentEntitySchema, type CreateContentEntityInput, type UpdateContentEntityInput } from '../validation';
import { generateSlug } from '../utils/slug';
import { eq, desc, like, or, and, inArray, sql } from 'drizzle-orm';
import { syncEntityToFTS } from '@/core/db/init-db';

/**
 * Creates a new content entity (Recipe, Technique, Ingredient Guide, etc.)
 */
export async function createContentEntity(rawInput: CreateContentEntityInput) {
  const validated = createContentEntitySchema.parse(rawInput);
  const entityId = validated.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const slug = validated.slug || generateSlug(validated.title);

  // 1. Insert base polymorphic content entity
  await db.insert(contentEntities).values({
    id: entityId,
    contentType: validated.contentType,
    title: validated.title,
    slug,
    summary: validated.summary ?? null,
    status: validated.status || 'published',
    servings: validated.servings ?? 4,
    prepTimeMinutes: validated.prepTimeMinutes ?? null,
    cookTimeMinutes: validated.cookTimeMinutes ?? null,
    cuisine: validated.cuisine ?? null,
    difficulty: validated.difficulty ?? null,
    imageUrl: validated.imageUrl ?? null,
    createdAt: now,
    updatedAt: now,
  });

  // 2. Insert ingredients
  if (validated.ingredients && validated.ingredients.length > 0) {
    await db.insert(ingredients).values(
      validated.ingredients.map((ing, idx) => ({
        id: crypto.randomUUID(),
        entityId,
        itemName: ing.itemName,
        amount: ing.amount ?? null,
        unit: ing.unit ?? null,
        notes: ing.notes ?? null,
        sortOrder: ing.sortOrder ?? idx,
      }))
    );
  }

  // 3. Insert instructions
  if (validated.instructions && validated.instructions.length > 0) {
    await db.insert(instructions).values(
      validated.instructions.map((inst) => ({
        id: crypto.randomUUID(),
        entityId,
        stepNumber: inst.stepNumber,
        instructionText: inst.instructionText,
        timerMinutes: inst.timerMinutes ?? null,
      }))
    );
  }

  // 4. Insert images
  if (validated.images && validated.images.length > 0) {
    await db.insert(images).values(
      validated.images.map((img) => ({
        id: crypto.randomUUID(),
        entityId,
        imageUrl: img.imageUrl,
        caption: img.caption ?? null,
        isPrimary: img.isPrimary ?? false,
      }))
    );
  }

  // 5. Insert tags
  if (validated.tags && validated.tags.length > 0) {
    await db.insert(tags).values(
      validated.tags.map((t: any) => ({
        id: crypto.randomUUID(),
        entityId,
        tagName: typeof t === 'string' ? t.trim() : (t.tagName || '').trim(),
      }))
    );
  }

  // 6. Sync entity to FTS Index
  await syncEntityToFTS(entityId);

  // 7. Record Initial Baseline Revision Snapshot (#1)
  const snapshotData = await getContentEntityById(entityId);
  if (snapshotData) {
    await db.insert(revisions).values({
      id: crypto.randomUUID(),
      entityId,
      entityType: validated.contentType,
      revisionNumber: 1,
      snapshotJSON: JSON.stringify(snapshotData),
      changeSummary: 'Initial creation & publication',
      approvedBy: 'system',
      approvedAt: now,
      createdAt: now,
    });
  }

  return snapshotData;
}

/**
 * Updates an existing content entity and records an immutable snapshot in `revisions`.
 */
export async function updateContentEntity(id: string, rawInput: any) {
  const existing = await getContentEntityById(id);
  if (!existing) {
    throw new Error(`Content entity with ID ${id} not found.`);
  }

  const now = new Date().toISOString();

  // Calculate next revision number
  const [latestRevision] = await db
    .select({ revisionNumber: revisions.revisionNumber })
    .from(revisions)
    .where(eq(revisions.entityId, id))
    .orderBy(desc(revisions.revisionNumber))
    .limit(1);

  const nextRevisionNumber = (latestRevision?.revisionNumber || 0) + 1;

  // 1. Save IMMUTABLE snapshot of existing entity to `revisions`
  await db.insert(revisions).values({
    id: crypto.randomUUID(),
    entityId: id,
    entityType: existing.contentType,
    revisionNumber: nextRevisionNumber,
    snapshotJSON: JSON.stringify(existing),
    changeSummary: rawInput.changeSummary || 'Entity updated',
    approvedBy: rawInput.approvedBy || 'admin',
    approvedAt: now,
    createdAt: now,
  });

  // 2. Update base entity table
  const updatePayload: Record<string, any> = { updatedAt: now };
  if (rawInput.title) updatePayload.title = rawInput.title;
  if (rawInput.summary !== undefined) updatePayload.summary = rawInput.summary;
  if (rawInput.servings !== undefined) updatePayload.servings = rawInput.servings;
  if (rawInput.prepTimeMinutes !== undefined) updatePayload.prepTimeMinutes = rawInput.prepTimeMinutes;
  if (rawInput.cookTimeMinutes !== undefined) updatePayload.cookTimeMinutes = rawInput.cookTimeMinutes;
  if (rawInput.cuisine !== undefined) updatePayload.cuisine = rawInput.cuisine;
  if (rawInput.difficulty !== undefined) updatePayload.difficulty = rawInput.difficulty;
  if (rawInput.imageUrl !== undefined) updatePayload.imageUrl = rawInput.imageUrl || null;
  if (rawInput.status) updatePayload.status = rawInput.status;
  if (rawInput.isFavorite !== undefined) updatePayload.isFavorite = rawInput.isFavorite;
  if (rawInput.aiProvider !== undefined) updatePayload.aiProvider = rawInput.aiProvider;
  if (rawInput.aiModel !== undefined) updatePayload.aiModel = rawInput.aiModel;
  if (rawInput.aiLatencyMs !== undefined) updatePayload.aiLatencyMs = rawInput.aiLatencyMs;
  if (rawInput.aiTokenUsage !== undefined) updatePayload.aiTokenUsage = rawInput.aiTokenUsage;
  if (rawInput.aiConfidence !== undefined) updatePayload.aiConfidence = rawInput.aiConfidence;
  if (rawInput.aiPromptVersion !== undefined) updatePayload.aiPromptVersion = rawInput.aiPromptVersion;
  if (rawInput.aiReasoningSummary !== undefined) updatePayload.aiReasoningSummary = rawInput.aiReasoningSummary;
  if (rawInput.aiTimestamp !== undefined) updatePayload.aiTimestamp = rawInput.aiTimestamp;

  await db
    .update(contentEntities)
    .set(updatePayload)
    .where(eq(contentEntities.id, id));

  // 3. Update ingredients if provided
  if (rawInput.ingredients) {
    await db.delete(ingredients).where(eq(ingredients.entityId, id));
    if (rawInput.ingredients.length > 0) {
      await db.insert(ingredients).values(
        rawInput.ingredients.map((ing: any, idx: number) => ({
          id: crypto.randomUUID(),
          entityId: id,
          itemName: ing.itemName,
          amount: ing.amount ?? null,
          unit: ing.unit ?? null,
          notes: ing.notes ?? null,
          sortOrder: ing.sortOrder ?? idx,
        }))
      );
    }
  }

  // 4. Update instructions if provided
  if (rawInput.instructions) {
    await db.delete(instructions).where(eq(instructions.entityId, id));
    if (rawInput.instructions.length > 0) {
      await db.insert(instructions).values(
        rawInput.instructions.map((inst: any, idx: number) => ({
          id: crypto.randomUUID(),
          entityId: id,
          stepNumber: inst.stepNumber || idx + 1,
          instructionText: inst.instructionText,
          timerMinutes: inst.timerMinutes ?? null,
        }))
      );
    }
  }

  // 5. Update tags if provided
  if (rawInput.tags) {
    await db.delete(tags).where(eq(tags.entityId, id));
    if (rawInput.tags.length > 0) {
      await db.insert(tags).values(
        rawInput.tags.map((t: any) => ({
          id: crypto.randomUUID(),
          entityId: id,
          tagName: typeof t === 'string' ? t.trim() : (t.tagName || '').trim(),
        }))
      );
    }
  }

  // 6. Re-sync FTS index
  await syncEntityToFTS(id);

  return getContentEntityById(id);
}

/**
 * Toggles favorite state of a content entity.
 */
export async function toggleFavoriteEntity(id: string) {
  const [existing] = await db
    .select({ isFavorite: contentEntities.isFavorite })
    .from(contentEntities)
    .where(eq(contentEntities.id, id));

  if (!existing) {
    throw new Error(`Content entity ${id} not found.`);
  }

  const nextState = !existing.isFavorite;

  await db
    .update(contentEntities)
    .set({ isFavorite: nextState, updatedAt: new Date().toISOString() })
    .where(eq(contentEntities.id, id));

  return { id, isFavorite: nextState };
}

/**
 * Fetches a single content entity with populated ingredients, instructions, images, tags, revision history, rating summary, and comments.
 */
export async function getContentEntityById(idOrSlug: string) {
  const [entity] = await db
    .select()
    .from(contentEntities)
    .where(or(eq(contentEntities.id, idOrSlug), eq(contentEntities.slug, idOrSlug)));

  if (!entity) return null;

  const [entityIngredients, entityInstructions, entityImages, entityTags, entityRevisions] = await Promise.all([
    db.select().from(ingredients).where(eq(ingredients.entityId, entity.id)).orderBy(ingredients.sortOrder),
    db.select().from(instructions).where(eq(instructions.entityId, entity.id)).orderBy(instructions.stepNumber),
    db.select().from(images).where(eq(images.entityId, entity.id)),
    db.select().from(tags).where(eq(tags.entityId, entity.id)),
    db.select().from(revisions).where(eq(revisions.entityId, entity.id)).orderBy(desc(revisions.revisionNumber)),
  ]);

  return {
    ...entity,
    ingredients: entityIngredients,
    instructions: entityInstructions,
    images: entityImages,
    tags: entityTags,
    revisions: entityRevisions,
  };
}

export const getContentEntityBySlug = getContentEntityById;

/**
 * Searches and lists content entities with category filtering and favorites support.
 */
export async function getContentEntities(options?: {
  contentType?: string;
  query?: string;
  favoritesOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  const conditions = [];
  const page = options?.page || 1;
  const pageSize = options?.limit || 50;

  if (options?.contentType && options.contentType !== 'all' && options.contentType !== 'favorites') {
    conditions.push(eq(contentEntities.contentType, options.contentType as any));
  }

  if (options?.favoritesOnly || options?.contentType === 'favorites') {
    conditions.push(eq(contentEntities.isFavorite, true));
  }

  if (options?.query) {
    const q = `%${options.query}%`;
    conditions.push(
      or(
        like(contentEntities.title, q),
        like(contentEntities.summary, q),
        like(contentEntities.cuisine, q)
      )
    );
  }

  const baseQuery = db.select().from(contentEntities);
  const finalQuery = conditions.length > 0
    ? baseQuery.where(and(...conditions)).orderBy(desc(contentEntities.createdAt))
    : baseQuery.orderBy(desc(contentEntities.createdAt));

  return await finalQuery.limit(pageSize).offset((page - 1) * pageSize);
}

/**
 * Deletes a content entity. Cascades automatically to sub-tables in SQLite.
 */
export async function deleteContentEntity(id: string) {
  await db.run(sql`DELETE FROM content_fts WHERE entity_id = ${id}`);
  await db.delete(contentEntities).where(eq(contentEntities.id, id));
  return { success: true };
}
