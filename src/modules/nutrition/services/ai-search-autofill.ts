import { z } from 'zod';
import { executeAIGatewayPipeline } from '@/modules/ai/gateway';
import { CreateFoodInput } from '../validation/nutrition-schema';

const nutritionFetchSchema = z.object({
  foodName: z.string(),
  aliases: z.array(z.string()).optional(),
  servingSize: z.number().default(100),
  servingUnit: z.string().default('g'),
  densityGPerMl: z.number().optional().default(1.0),
  pieceWeightG: z.number().optional(),

  calories: z.number().min(0).default(0),
  protein: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
  saturatedFat: z.number().min(0).default(0),
  carbohydrates: z.number().min(0).default(0),
  fiber: z.number().min(0).default(0),
  sugar: z.number().min(0).default(0),

  vitaminA: z.number().min(0).default(0),
  vitaminC: z.number().min(0).default(0),
  vitaminD: z.number().min(0).default(0),
  calcium: z.number().min(0).default(0),
  iron: z.number().min(0).default(0),
  sodium: z.number().min(0).default(0),
  potassium: z.number().min(0).default(0),

  sourceReference: z.string().default('USDA / Verified Nutrition Reference'),
  confidenceNotes: z.string().optional(),
});

/**
 * Searches web/authoritative database via AI Gateway to retrieve nutritional profile per 100g.
 */
export async function fetchNutritionDataViaAISearch(ingredientName: string): Promise<CreateFoodInput> {
  const systemPrompt = `You are a professional food scientist and nutritionist assistant.
Your task is to provide accurate, standard nutritional facts per 100 grams for the specified ingredient based on authoritative databases like USDA FoodData Central, McCance and Widdowson, or Indian Food Composition Tables (IFCT).`;

  const userPrompt = `Fetch standard nutrition facts per 100g for ingredient: "${ingredientName}".
Return values for calories (kcal), protein (g), fat (g), saturatedFat (g), carbohydrates (g), fiber (g), sugar (g), vitaminA (mcg), vitaminC (mg), vitaminD (mcg), calcium (mg), iron (mg), sodium (mg), potassium (mg), pieceWeightG (weight of 1 piece in grams if applicable, e.g. 3g for garlic clove, 50g for egg), and sourceReference string.`;

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
      vitaminB1: 0,
      vitaminB2: 0,
      vitaminB3: 0,
      vitaminB5: 0,
      vitaminB6: 0,
      vitaminB7: 0,
      vitaminB9: 0,
      vitaminB12: 0,
      vitaminC: data.vitaminC,
      vitaminD: data.vitaminD,
      vitaminE: 0,
      vitaminK: 0,
      calcium: data.calcium,
      iron: data.iron,
      magnesium: 0,
      potassium: data.potassium,
      sodium: data.sodium,
      zinc: 0,
      copper: 0,
      selenium: 0,
      manganese: 0,
      phosphorus: 0,
      cholesterol: 0,
      omega3: 0,
      omega6: 0,
      water: 0,
      sourceReference: data.sourceReference || 'USDA FoodData Central Reference',
    };
  } catch (error) {
    console.warn('AI search pipeline fallback triggered:', error);
    // Provide a sensible baseline template for manual editing if API key is unconfigured
    return {
      foodName: ingredientName,
      aliases: [ingredientName.toLowerCase()],
      source: 'ai_search',
      servingSize: 100,
      servingUnit: 'g',
      densityGPerMl: 1.0,
      calories: 120,
      protein: 2.0,
      fat: 1.0,
      saturatedFat: 0.2,
      unsaturatedFat: 0.8,
      carbohydrates: 25.0,
      fiber: 2.0,
      sugar: 5.0,
      vitaminA: 0,
      vitaminB1: 0,
      vitaminB2: 0,
      vitaminB3: 0,
      vitaminB5: 0,
      vitaminB6: 0,
      vitaminB7: 0,
      vitaminB9: 0,
      vitaminB12: 0,
      vitaminC: 10,
      vitaminD: 0,
      vitaminE: 0,
      vitaminK: 0,
      calcium: 20,
      iron: 1.0,
      magnesium: 0,
      potassium: 150,
      sodium: 10,
      zinc: 0,
      copper: 0,
      selenium: 0,
      manganese: 0,
      phosphorus: 0,
      cholesterol: 0,
      omega3: 0,
      omega6: 0,
      water: 0,
      sourceReference: 'AI Search Baseline (Please review & confirm)',
    };
  }
}
