import { z } from 'zod';
import { executeAIGatewayPipeline } from '@/modules/ai/gateway';
import { CreateFoodInput } from '../validation/nutrition-schema';

const nutritionFetchSchema = z.object({
  foodName: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  servingSize: z.number().default(100),
  servingUnit: z.string().default('g'),
  densityGPerMl: z.number().optional().default(1.0),
  pieceWeightG: z.number().optional(),

  calories: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  protein: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  fat: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  saturatedFat: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  carbohydrates: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  fiber: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  sugar: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),

  vitaminA: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminB1: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminB2: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminB3: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminB5: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminB6: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminB7: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminB9: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminB12: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminC: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminD: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminE: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  vitaminK: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  calcium: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  copper: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  iron: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  magnesium: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  manganese: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  phosphorus: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  potassium: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  selenium: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  sodium: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  zinc: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  cholesterol: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  omega3: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  omega6: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),
  water: z.union([z.number().min(0), z.string().transform(v => parseFloat(v) || 0)]).default(0),

  sourceReference: z.string().default('USDA / Verified Nutrition Reference'),
  confidenceNotes: z.string().optional(),
}).passthrough();

interface DuckDuckGoResult {
  abstractText: string;
  abstractURL: string;
  heading: string;
  relatedTopics: Array<{ text: string; url: string }>;
  definition: string;
  definitionURL: string;
  source: string;
}

/**
 * Queries the DuckDuckGo Instant Answer API (free, no API key required)
 * to retrieve nutrition-related information for an ingredient.
 */
export async function searchDuckDuckGo(ingredientName: string): Promise<DuckDuckGoResult | null> {
  try {
    const query = `${ingredientName} nutrition per 100g`;
    const endpoint = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&no_redirect=1`;

    const res = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      console.warn('DuckDuckGo API error:', res.status);
      return null;
    }

    const data = await res.json();

    return {
      abstractText: data.AbstractText || '',
      abstractURL: data.AbstractURL || '',
      heading: data.Heading || '',
      relatedTopics: (data.RelatedTopics || [])
        .filter((t: { Text?: string; FirstURL?: string }) => t.Text && t.FirstURL)
        .map((t: { Text?: string; FirstURL?: string }) => ({ text: t.Text || '', url: t.FirstURL || '' })),
      definition: data.Definition || '',
      definitionURL: data.DefinitionURL || '',
      source: 'duckduckgo_instant_answer',
    };
  } catch (error) {
    console.warn('DuckDuckGo search failed:', error);
    return null;
  }
}

/**
 * Attempts to extract nutrition values from DuckDuckGo search results
 * using regex patterns. Returns partial data if found.
 */
function parseDuckDuckGoNutrition(
  ingredientName: string,
  ddg: DuckDuckGoResult
): Partial<CreateFoodInput> | null {
  const combinedText = [
    ddg.abstractText,
    ddg.definition,
    ...ddg.relatedTopics.map((t) => t.text),
  ].join(' ').toLowerCase();

  if (!combinedText) return null;

  const extractNum = (pattern: RegExp): number | undefined => {
    const match = combinedText.match(pattern);
    if (match) {
      const val = parseFloat(match[1]);
      return isNaN(val) ? undefined : val;
    }
    return undefined;
  };

  const values: Record<string, number | undefined> = {};

  values.calories = extractNum(/(\d+(?:\.\d+)?)\s*(?:kcal|calories?)\s*per\s*100g/i);
  values.protein = extractNum(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*protein/i);
  values.fat = extractNum(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*fat/i);
  values.carbohydrates = extractNum(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:carbs?|carbohydrates?)/i);
  values.fiber = extractNum(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*fiber/i);
  values.sugar = extractNum(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*sugar/i);
  values.calcium = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|milligrams?)\s*calcium/i);
  values.iron = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|milligrams?)\s*iron/i);
  values.sodium = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|milligrams?)\s*sodium/i);
  values.potassium = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|milligrams?)\s*potassium/i);
  values.vitaminA = extractNum(/(\d+(?:\.\d+)?)\s*(?:mcg|μg|IU)\s*vitamin\s*a/i);
  values.vitaminC = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|mcg)\s*vitamin\s*c/i);
  values.vitaminD = extractNum(/(\d+(?:\.\d+)?)\s*(?:mcg|μg|IU)\s*vitamin\s*d/i);
  values.vitaminB1 = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|mcg)\s*vitamin\s*b1/i);
  values.vitaminB2 = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|mcg)\s*vitamin\s*b2/i);
  values.vitaminB3 = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|mcg)\s*(?:vitamin\s*b3|niacin)/i);
  values.vitaminB5 = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|mcg)\s*vitamin\s*b5/i);
  values.vitaminB6 = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|mcg)\s*vitamin\s*b6/i);
  values.vitaminB7 = extractNum(/(\d+(?:\.\d+)?)\s*(?:mcg|μg)\s*(?:vitamin\s*b7|biotin)/i);
  values.vitaminB9 = extractNum(/(\d+(?:\.\d+)?)\s*(?:mcg|μg)\s*(?:vitamin\s*b9|folate|folic acid)/i);
  values.vitaminB12 = extractNum(/(\d+(?:\.\d+)?)\s*(?:mcg|μg)\s*vitamin\s*b12/i);
  values.vitaminE = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|mcg)\s*vitamin\s*e/i);
  values.vitaminK = extractNum(/(\d+(?:\.\d+)?)\s*(?:mcg|μg)\s*vitamin\s*k/i);
  values.magnesium = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|milligrams?)\s*magnesium/i);
  values.zinc = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|milligrams?)\s*zinc/i);
  values.copper = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|mcg)\s*copper/i);
  values.selenium = extractNum(/(\d+(?:\.\d+)?)\s*(?:mcg|μg)\s*selenium/i);
  values.manganese = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|mcg)\s*manganese/i);
  values.phosphorus = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|milligrams?)\s*phosphorus/i);
  values.cholesterol = extractNum(/(\d+(?:\.\d+)?)\s*(?:mg|milligrams?)\s*cholesterol/i);
  values.omega3 = extractNum(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*omega[\s-]*3/i);
  values.omega6 = extractNum(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*omega[\s-]*6/i);
  values.water = extractNum(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*water/i);

  const foundKeys = Object.keys(values).filter((k) => values[k] !== undefined);
  if (foundKeys.length < 3) return null;

  const result: Partial<CreateFoodInput> = {
    foodName: ingredientName,
    aliases: [ingredientName.toLowerCase()],
    source: 'ai_search',
    servingSize: 100,
    servingUnit: 'g',
    densityGPerMl: 1.0,
    calories: values.calories || 0,
    protein: values.protein || 0,
    fat: values.fat || 0,
    saturatedFat: values.fat ? Math.round(values.fat * 0.3 * 10) / 10 : 0,
    unsaturatedFat: values.fat ? Math.round(values.fat * 0.7 * 10) / 10 : 0,
    carbohydrates: values.carbohydrates || 0,
    fiber: values.fiber || 0,
    sugar: values.sugar || 0,
    vitaminA: values.vitaminA || 0,
    vitaminB1: values.vitaminB1 || 0,
    vitaminB2: values.vitaminB2 || 0,
    vitaminB3: values.vitaminB3 || 0,
    vitaminB5: values.vitaminB5 || 0,
    vitaminB6: values.vitaminB6 || 0,
    vitaminB7: values.vitaminB7 || 0,
    vitaminB9: values.vitaminB9 || 0,
    vitaminB12: values.vitaminB12 || 0,
    vitaminC: values.vitaminC || 0,
    vitaminD: values.vitaminD || 0,
    vitaminE: values.vitaminE || 0,
    vitaminK: values.vitaminK || 0,
    calcium: values.calcium || 0,
    copper: values.copper || 0,
    iron: values.iron || 0,
    magnesium: values.magnesium || 0,
    manganese: values.manganese || 0,
    phosphorus: values.phosphorus || 0,
    potassium: values.potassium || 0,
    selenium: values.selenium || 0,
    sodium: values.sodium || 0,
    zinc: values.zinc || 0,
    cholesterol: values.cholesterol || 0,
    omega3: values.omega3 || 0,
    omega6: values.omega6 || 0,
    water: values.water || 0,
    sourceReference: ddg.abstractURL || ddg.definitionURL || 'DuckDuckGo Instant Answer',
  };

  return result;
}

/**
 * Searches web/authoritative database via AI Gateway with DuckDuckGo web context.
 *
 * Tier 1: DuckDuckGo search → AI Gateway prompt (web context for AI)
 * Tier 2: Regex parse DuckDuckGo results directly
 * Tier 3: Error → user must enter manually
 */
export async function fetchNutritionDataViaAISearch(ingredientName: string): Promise<CreateFoodInput> {
  const ddgResult = await searchDuckDuckGo(ingredientName);

  const ddgContext = ddgResult
    ? `\n\n--- WEB SEARCH CONTEXT (DuckDuckGo Instant Answer) ---\n` +
      `Abstract: ${ddgResult.abstractText || 'N/A'}\n` +
      `Source: ${ddgResult.abstractURL || 'N/A'}\n` +
      `Definition: ${ddgResult.definition || 'N/A'}\n` +
      `Related Topics:\n${ddgResult.relatedTopics.map((t) => `- ${t.text} (${t.url})`).join('\n')}\n` +
      `--- END WEB CONTEXT ---\n`
    : '\n(No web search context available)\n';

  const systemPrompt = `You are a professional food scientist and nutritionist assistant.
Your task is to provide accurate, standard nutritional facts per 100 grams for the specified ingredient based on authoritative databases like USDA FoodData Central, McCance and Widdowson, or Indian Food Composition Tables (IFCT).
You must return a valid JSON object with these numeric fields using the EXACT names below. Do NOT use different key names — aliasing will break the parser.

Required JSON shape:
{
  "foodName": "string (name of ingredient)",
  "calories": number,
  "protein": number,
  "fat": number,
  "saturatedFat": number,
  "carbohydrates": number,
  "fiber": number,
  "sugar": number,
  "vitaminA": number,
  "vitaminB1": number,
  "vitaminB2": number,
  "vitaminB3": number,
  "vitaminB5": number,
  "vitaminB6": number,
  "vitaminB7": number,
  "vitaminB9": number,
  "vitaminB12": number,
  "vitaminC": number,
  "vitaminD": number,
  "vitaminE": number,
  "vitaminK": number,
  "calcium": number,
  "copper": number,
  "iron": number,
  "magnesium": number,
  "manganese": number,
  "phosphorus": number,
  "potassium": number,
  "selenium": number,
  "sodium": number,
  "zinc": number,
  "cholesterol": number,
  "omega3": number,
  "omega6": number,
  "water": number,
  "sourceReference": "string"
}
All nutrition values are per 100g. Use g for macros (protein, fat, carbs, fiber, sugar, water, omega3, omega6), mg for minerals (calcium, iron, magnesium, phosphorus, potassium, sodium, zinc, copper, manganese) and cholesterol, mcg for vitamins (A, B1, B2, B3, B5, B6, B7, B9, B12, D, E, K) and selenium, and mg for vitamin C. Return ONLY the JSON object.`;

  const userPrompt = `What are the standard nutrition facts per 100g for: "${ingredientName}"? Reply with ONLY the JSON object, no other text.${ddgContext}`;

  try {
    const result = await executeAIGatewayPipeline({
      systemPrompt,
      userPrompt,
      schema: nutritionFetchSchema,
    });

    const data = result.data;
    return {
      foodName: data.foodName || ingredientName,
      aliases: data.aliases || [ingredientName.toLowerCase()],
      source: 'ai_search',
      servingSize: 100,
      servingUnit: 'g',
      densityGPerMl: data.densityGPerMl || 1.0,
      pieceWeightG: data.pieceWeightG,
      calories: data.calories,
      protein: data.protein,
      fat: data.fat,
      saturatedFat: data.saturatedFat,
      unsaturatedFat: Math.max(0, data.fat - data.saturatedFat),
      carbohydrates: data.carbohydrates,
      fiber: data.fiber,
      sugar: data.sugar,
      vitaminA: data.vitaminA,
      vitaminB1: data.vitaminB1 || 0,
      vitaminB2: data.vitaminB2 || 0,
      vitaminB3: data.vitaminB3 || 0,
      vitaminB5: data.vitaminB5 || 0,
      vitaminB6: data.vitaminB6 || 0,
      vitaminB7: data.vitaminB7 || 0,
      vitaminB9: data.vitaminB9 || 0,
      vitaminB12: data.vitaminB12 || 0,
      vitaminC: data.vitaminC,
      vitaminD: data.vitaminD,
      vitaminE: data.vitaminE || 0,
      vitaminK: data.vitaminK || 0,
      calcium: data.calcium,
      copper: data.copper || 0,
      iron: data.iron,
      magnesium: data.magnesium || 0,
      manganese: data.manganese || 0,
      phosphorus: data.phosphorus || 0,
      potassium: data.potassium,
      selenium: data.selenium || 0,
      sodium: data.sodium,
      zinc: data.zinc || 0,
      cholesterol: data.cholesterol || 0,
      omega3: data.omega3 || 0,
      omega6: data.omega6 || 0,
      water: data.water || 0,
      sourceReference: data.sourceReference || 'USDA FoodData Central Reference',
    };
  } catch (error) {
    console.warn('AI search pipeline fallback triggered:', error);

    if (ddgResult) {
      const parsed = parseDuckDuckGoNutrition(ingredientName, ddgResult);
      if (parsed) {
        console.info('Nutrition data retrieved from DuckDuckGo for:', ingredientName);
        return parsed as CreateFoodInput;
      }
    }

    throw new Error(`Could not resolve nutrition data for "${ingredientName}". Please enter manually.`);
  }
}
