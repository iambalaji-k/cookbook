import { z } from 'zod';
import { executeAIGatewayPipeline } from '@/modules/ai/gateway';

export interface NLQueryInterpretation {
  rawQuery: string;
  keywords: string[];
  maxTotalTimeMinutes: number | null;
  cuisine: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  contentType: string | null;
  summary: string;
}

const nlInterpretationSchema = z.object({
  keywords: z.array(z.string()).default([]),
  maxTotalTimeMinutes: z.union([z.number(), z.string()]).transform((v) => Number(v) || null).nullable().optional().default(null),
  cuisine: z.string().nullable().optional().default(null),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional().default(null),
  contentType: z.enum(['recipe', 'technique', 'ingredient_guide', 'sauce', 'spice_blend', 'kitchen_tip']).nullable().optional().default(null),
  summary: z.string().default(''),
});

/**
 * Interprets a conversational natural language search query into structured constraints.
 * Uses AI Gateway with fallback regex parsing.
 */
export async function interpretNaturalLanguageQuery(
  rawQuery: string
): Promise<NLQueryInterpretation> {
  const text = rawQuery.trim();
  if (!text) {
    return {
      rawQuery: '',
      keywords: [],
      maxTotalTimeMinutes: null,
      cuisine: null,
      difficulty: null,
      contentType: null,
      summary: 'Empty query',
    };
  }

  // 1. Attempt AI Gateway Natural Language Query Parsing
  try {
    const systemPrompt = `You are a culinary search query interpreter. Convert conversational natural language requests (e.g. "What quick Italian dinner can I make with shrimp under 30 minutes?") into structured search constraints. Extract key ingredients/dish keywords, maxTotalTimeMinutes, cuisine, difficulty, and a 1-sentence summary of the user's intent.`;
    const userPrompt = `USER SEARCH QUERY: "${text}"`;

    const aiResult = await executeAIGatewayPipeline({
      systemPrompt,
      userPrompt,
      schema: nlInterpretationSchema,
      maxRetries: 1,
    });

    const finalKeywords = aiResult.data.keywords.length > 0 ? aiResult.data.keywords : [text];

    return {
      rawQuery: text,
      keywords: finalKeywords,
      maxTotalTimeMinutes: aiResult.data.maxTotalTimeMinutes ?? extractTimeFromRegex(text),
      cuisine: aiResult.data.cuisine ?? extractCuisineFromRegex(text),
      difficulty: aiResult.data.difficulty ?? null,
      contentType: aiResult.data.contentType ?? null,
      summary: aiResult.data.summary || `Parsed query for ${finalKeywords.join(', ')}`,
    };
  } catch (aiErr) {
    console.warn('AI Query Interpreter Fallback:', aiErr);
  }

  // 2. Rule-based Regex Fallback Parser
  const extractedTime = extractTimeFromRegex(text);
  const extractedCuisine = extractCuisineFromRegex(text);
  const keywords = text
    .replace(/\b(under|less than|within|mins|minutes|quick|easy|make|recipe|with|for|dinner|lunch|breakfast)\b/gi, ' ')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  return {
    rawQuery: text,
    keywords: keywords.length > 0 ? keywords : [text],
    maxTotalTimeMinutes: extractedTime,
    cuisine: extractedCuisine,
    difficulty: null,
    contentType: null,
    summary: `Search constraints: Keywords [${keywords.join(', ')}]${extractedTime ? `, Max Time ≤${extractedTime}m` : ''}`,
  };
}

function extractTimeFromRegex(text: string): number | null {
  const match = text.match(/(?:under|within|less than|in|\b)(\d+)\s*(?:mins|minutes|min)/i);
  if (match) {
    return Number(match[1]);
  }
  return null;
}

function extractCuisineFromRegex(text: string): string | null {
  const cuisines = ['Italian', 'French', 'Mexican', 'Asian', 'Chinese', 'Indian', 'American', 'Thai', 'Japanese', 'Mediterranean'];
  for (const c of cuisines) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
      return c;
    }
  }
  return null;
}
