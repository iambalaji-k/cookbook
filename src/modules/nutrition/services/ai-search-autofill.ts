import { z } from 'zod';
import { executeAIGatewayPipeline } from '@/modules/ai/gateway';
import { CreateFoodInput } from '../validation/nutrition-schema';
import { searchUSDAFoodDataCentral } from './usda-api-service';

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

  sourceReference: z.string().optional(),
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

const NUTRIENT_FIELDS: Array<keyof CreateFoodInput> = [
  'calories', 'protein', 'fat', 'saturatedFat', 'carbohydrates', 'fiber', 'sugar',
  'vitaminA', 'vitaminB1', 'vitaminB2', 'vitaminB3', 'vitaminB5',
  'vitaminB6', 'vitaminB7', 'vitaminB9', 'vitaminB12',
  'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'calcium', 'iron', 'magnesium', 'potassium', 'sodium',
  'zinc', 'copper', 'selenium', 'manganese', 'phosphorus',
  'cholesterol', 'omega3', 'omega6', 'water',
];

function countNonZeroNutrients(data: Partial<CreateFoodInput>): number {
  return NUTRIENT_FIELDS.filter((f) => {
    const v = data[f];
    return typeof v === 'number' && v > 0;
  }).length;
}

function buildGapList(data: Partial<CreateFoodInput>): string[] {
  return NUTRIENT_FIELDS.filter((f) => {
    const v = data[f];
    return typeof v !== 'number' || v === 0;
  });
}

export async function searchDuckDuckGo(ingredientName: string): Promise<DuckDuckGoResult | null> {
  try {
    const cleanName = ingredientName.trim();
    const queryCandidates = [cleanName, `${cleanName} food`, `${cleanName} fruit`];

    for (const q of queryCandidates) {
      const endpoint = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1`;

      const res = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        next: { revalidate: 86400 },
      });

      if (!res.ok) continue;

      const data = await res.json();

      const relatedTopics: Array<{ text: string; url: string }> = [];
      const extractTopics = (list: any[]) => {
        for (const t of list || []) {
          if (t.Text && t.FirstURL) {
            relatedTopics.push({ text: t.Text, url: t.FirstURL });
          }
          if (Array.isArray(t.Topics)) {
            extractTopics(t.Topics);
          }
        }
      };

      extractTopics(data.RelatedTopics);
      const abstractText = data.AbstractText || data.Abstract || '';

      if (abstractText || relatedTopics.length > 0 || data.Definition) {
        return {
          abstractText,
          abstractURL: data.AbstractURL || '',
          heading: data.Heading || '',
          relatedTopics,
          definition: data.Definition || '',
          definitionURL: data.DefinitionURL || '',
          source: 'duckduckgo_instant_answer',
        };
      }
    }

    return null;
  } catch (error) {
    console.warn('DuckDuckGo search failed:', error);
    return null;
  }
}

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

async function aiGapFill(ingredientName: string, usdaData: Partial<CreateFoodInput>, ddgContext: string): Promise<Partial<CreateFoodInput>> {
  const gaps = buildGapList(usdaData);
  const filledCount = countNonZeroNutrients(usdaData);
  const totalCount = NUTRIENT_FIELDS.length;

  if (gaps.length === 0) return {};

  const systemPrompt = `You are a professional food scientist. An authoritative database provided partial nutrition data for "${ingredientName}". Provide ONLY the missing nutrient values below. Return ONLY a JSON object with the missing field names and their values per 100g. Do NOT include fields that already have values.`;

  const userPrompt = `Ingredient: "${ingredientName}"

Already known values (USDA FoodData Central):
${NUTRIENT_FIELDS.filter((f) => {
  const v = usdaData[f];
  return typeof v === 'number' && v > 0;
}).map((f) => `  ${f}: ${usdaData[f]}`).join('\n')}

Missing fields to fill: ${gaps.join(', ')}

Provide realistic values for the missing nutrients per 100g. Use g for macros, mg for minerals, mcg for vitamins.
Return ONLY a JSON object with the missing fields.${ddgContext ? `\n\nWeb search context for reference:\n${ddgContext}` : ''}`;

  try {
    const result = await executeAIGatewayPipeline({
      systemPrompt,
      userPrompt,
      schema: z.record(z.string(), z.number()),
    });
    return result.data || {};
  } catch {
    return {};
  }
}

function createFoodInput(ingredientName: string, base: Partial<CreateFoodInput>, gaps: Partial<CreateFoodInput>): CreateFoodInput {
  const safeNum = (v: any): number => {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(n) ? 0 : n;
  };

  return {
    foodName: base.foodName || ingredientName,
    aliases: base.aliases || [ingredientName.toLowerCase()],
    source: 'usda',
    servingSize: 100,
    servingUnit: 'g',
    densityGPerMl: 1.0,
    pieceWeightG: base.pieceWeightG || gaps.pieceWeightG,
    calories: safeNum(base.calories || gaps.calories),
    protein: safeNum(base.protein || gaps.protein),
    fat: safeNum(base.fat || gaps.fat),
    saturatedFat: safeNum(base.saturatedFat || gaps.saturatedFat),
    unsaturatedFat: safeNum(base.unsaturatedFat || Math.max(0, safeNum(base.fat || gaps.fat) - safeNum(base.saturatedFat || gaps.saturatedFat))),
    carbohydrates: safeNum(base.carbohydrates || gaps.carbohydrates),
    fiber: safeNum(base.fiber || gaps.fiber),
    sugar: safeNum(base.sugar || gaps.sugar),
    vitaminA: safeNum(base.vitaminA || gaps.vitaminA),
    vitaminB1: safeNum(base.vitaminB1 || gaps.vitaminB1),
    vitaminB2: safeNum(base.vitaminB2 || gaps.vitaminB2),
    vitaminB3: safeNum(base.vitaminB3 || gaps.vitaminB3),
    vitaminB5: safeNum(base.vitaminB5 || gaps.vitaminB5),
    vitaminB6: safeNum(base.vitaminB6 || gaps.vitaminB6),
    vitaminB7: safeNum(base.vitaminB7 || gaps.vitaminB7),
    vitaminB9: safeNum(base.vitaminB9 || gaps.vitaminB9),
    vitaminB12: safeNum(base.vitaminB12 || gaps.vitaminB12),
    vitaminC: safeNum(base.vitaminC || gaps.vitaminC),
    vitaminD: safeNum(base.vitaminD || gaps.vitaminD),
    vitaminE: safeNum(base.vitaminE || gaps.vitaminE),
    vitaminK: safeNum(base.vitaminK || gaps.vitaminK),
    calcium: safeNum(base.calcium || gaps.calcium),
    copper: safeNum(base.copper || gaps.copper),
    iron: safeNum(base.iron || gaps.iron),
    magnesium: safeNum(base.magnesium || gaps.magnesium),
    manganese: safeNum(base.manganese || gaps.manganese),
    phosphorus: safeNum(base.phosphorus || gaps.phosphorus),
    potassium: safeNum(base.potassium || gaps.potassium),
    selenium: safeNum(base.selenium || gaps.selenium),
    sodium: safeNum(base.sodium || gaps.sodium),
    zinc: safeNum(base.zinc || gaps.zinc),
    cholesterol: safeNum(base.cholesterol || gaps.cholesterol),
    omega3: safeNum(base.omega3 || gaps.omega3),
    omega6: safeNum(base.omega6 || gaps.omega6),
    water: safeNum(base.water || gaps.water),
    sourceReference: base.sourceReference || 'USDA FoodData Central (with AI gap-fill)',
  };
}

export async function fetchNutritionDataViaAISearch(ingredientName: string): Promise<CreateFoodInput> {
  const ddgResult = await searchDuckDuckGo(ingredientName);

  const ddgContext = ddgResult
    ? `\n\n--- WEB SEARCH CONTEXT (DuckDuckGo Instant Answer) ---\n` +
      `Abstract: ${ddgResult.abstractText || 'N/A'}\n` +
      `Source: ${ddgResult.abstractURL || 'N/A'}\n` +
      `Definition: ${ddgResult.definition || 'N/A'}\n` +
      `Related Topics:\n${ddgResult.relatedTopics.map((t) => `- ${t.text} (${t.url})`).join('\n')}\n` +
      `--- END WEB CONTEXT ---\n`
    : '';

  let usdaResults: CreateFoodInput[] = [];
  try {
    usdaResults = await searchUSDAFoodDataCentral(ingredientName);
  } catch {
    console.warn('USDA search failed, falling back to AI');
  }

  if (usdaResults.length > 0) {
    const usda = usdaResults[0];
    const filledCount = countNonZeroNutrients(usda);
    const totalFields = NUTRIENT_FIELDS.length;
    const coverage = filledCount / totalFields;

    if (coverage >= 0.5) {
      const gaps = await aiGapFill(ingredientName, usda, ddgContext);
      return createFoodInput(ingredientName, usda, gaps);
    }
  }

  const ddgContextForAI = ddgContext || '\n(No web search context available)\n';

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

  const userPrompt = `What are the standard nutrition facts per 100g for: "${ingredientName}"? Reply with ONLY the JSON object, no other text.${ddgContextForAI}`;

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
