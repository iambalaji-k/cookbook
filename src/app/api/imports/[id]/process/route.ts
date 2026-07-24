import { NextResponse } from 'next/server';
import { z } from 'zod';
import { initializeDatabase } from '@/core/db/init-db';
import { getRawImportById } from '@/modules/imports/services/import-service';
import { executeAIGatewayPipeline } from '@/modules/ai/gateway';
import { createAIDraft } from '@/modules/drafts/services/draft-service';
import { RECIPE_EXTRACTOR_SYSTEM_PROMPT, normalizeIngredientObject } from '@/modules/ai/prompts/recipe-extractor';

// Strict Zod schema enforcing numbers and separate fields
const recipeExtractionSchema = z.object({
  title: z.string().min(1).default('Untitled Recipe'),
  slug: z.string().optional(),
  contentType: z.enum(['recipe', 'technique', 'ingredient_guide', 'sauce', 'spice_blend', 'kitchen_tip']).default('recipe'),
  summary: z.string().optional().default(''),
  servings: z.union([z.number(), z.string()]).transform((val) => Number(val) || 4).default(4),
  prepTimeMinutes: z.union([z.number(), z.string()]).transform((val) => Number(val) || 15).default(15),
  cookTimeMinutes: z.union([z.number(), z.string()]).transform((val) => Number(val) || 20).default(20),
  cuisine: z.string().optional().default('General'),
  difficulty: z.enum(['easy', 'medium', 'hard']).catch('easy').default('easy'),
  imageUrl: z.string().nullable().optional(),
  ingredients: z.array(z.any()).default([]),
  instructions: z.array(
    z.union([
      z.string().transform((str) => ({ stepNumber: 1, instructionText: str, timerMinutes: null })),
      z.object({
        stepNumber: z.union([z.number(), z.string()]).transform((v) => Number(v) || 1).optional(),
        instructionText: z.string().default(''),
        timerMinutes: z.union([z.number(), z.string()]).transform((v) => Number(v) || null).nullable().optional(),
      }),
    ])
  ).default([]),
  tags: z.array(z.string()).default([]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const rawImport = await getRawImportById(id);

    if (!rawImport) {
      return NextResponse.json(
        { status: 'error', message: 'Raw import record not found' },
        { status: 404 }
      );
    }

    const userPrompt = `UNADULTERATED RAW PAYLOAD TO PARSE:\n\n${rawImport.rawPayload}`;

    // 1. Run prompt through AI Gateway Pipeline
    const aiResult = await executeAIGatewayPipeline({
      systemPrompt: RECIPE_EXTRACTOR_SYSTEM_PROMPT,
      userPrompt,
      schema: recipeExtractionSchema,
      maxRetries: 2,
    });

    // 2. Normalize and clean ingredient objects
    const normalizedIngredients = aiResult.data.ingredients.map((ing) => normalizeIngredientObject(ing));

    // 3. Normalize instruction step numbers sequentially
    const normalizedInstructions = aiResult.data.instructions.map((inst, idx) => ({
      stepNumber: idx + 1,
      instructionText: inst.instructionText || String(inst),
      timerMinutes: inst.timerMinutes || null,
    }));

    // 4. Sanitize imageUrl (ensure it is a valid HTTP/HTTPS URL or null)
    let cleanImageUrl: string | null = null;
    if (aiResult.data.imageUrl && /^https?:\/\/.+/i.test(aiResult.data.imageUrl.trim())) {
      cleanImageUrl = aiResult.data.imageUrl.trim();
    }

    // Ensure slug is generated
    const cleanTitle = (aiResult.data.title || 'extracted-recipe')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-');
    const slug = `${cleanTitle}-${Math.random().toString(36).substring(2, 7)}`;

    const proposedPayload = {
      ...aiResult.data,
      imageUrl: cleanImageUrl,
      ingredients: normalizedIngredients,
      instructions: normalizedInstructions,
      prepTimeMinutes: aiResult.data.prepTimeMinutes || 15,
      cookTimeMinutes: aiResult.data.cookTimeMinutes || 20,
      slug,
    };

    // 5. Stage extracted payload into ai_drafts
    const draft = await createAIDraft({
      rawImportId: rawImport.id,
      targetContentType: aiResult.data.contentType as any,
      proposedDataJSON: JSON.stringify(proposedPayload),
      reason: `AI Extracted structured recipe payload from ${rawImport.sourceType} import. Parsed ${normalizedIngredients.length} ingredients and ${normalizedInstructions.length} instruction steps.`,
      provider: aiResult.audit.provider,
      model: aiResult.audit.model,
      confidence: aiResult.audit.confidence,
      tokenUsage: aiResult.audit.tokenUsage,
      latencyMs: aiResult.audit.latencyMs,
      promptVersion: aiResult.audit.promptVersion,
      createdBy: 'ai_gateway',
      status: 'pending',
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Raw import processed by AI Gateway and staged into ai_drafts successfully!',
      draftId: draft?.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: `AI Processing Error: ${error.message}` },
      { status: 500 }
    );
  }
}
