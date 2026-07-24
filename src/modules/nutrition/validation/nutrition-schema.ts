import { z } from 'zod';

export const createFoodSchema = z.object({
  foodName: z.string().min(2, 'Food name must be at least 2 characters'),
  aliases: z.array(z.string()).optional(),
  source: z.enum(['usda', 'ifct', 'manual', 'ai_search']).default('manual'),
  servingSize: z.number().positive().default(100),
  servingUnit: z.string().default('g'),

  densityGPerMl: z.number().positive().optional().default(1.0),
  pieceWeightG: z.number().positive().optional(),
  cupWeightG: z.number().positive().optional(),
  tbspWeightG: z.number().positive().optional(),

  // Macros
  calories: z.number().min(0).default(0),
  protein: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
  saturatedFat: z.number().min(0).default(0),
  unsaturatedFat: z.number().min(0).default(0),
  carbohydrates: z.number().min(0).default(0),
  fiber: z.number().min(0).default(0),
  sugar: z.number().min(0).default(0),

  // Vitamins
  vitaminA: z.number().min(0).default(0),
  vitaminB1: z.number().min(0).default(0),
  vitaminB2: z.number().min(0).default(0),
  vitaminB3: z.number().min(0).default(0),
  vitaminB5: z.number().min(0).default(0),
  vitaminB6: z.number().min(0).default(0),
  vitaminB7: z.number().min(0).default(0),
  vitaminB9: z.number().min(0).default(0),
  vitaminB12: z.number().min(0).default(0),
  vitaminC: z.number().min(0).default(0),
  vitaminD: z.number().min(0).default(0),
  vitaminE: z.number().min(0).default(0),
  vitaminK: z.number().min(0).default(0),

  // Minerals
  calcium: z.number().min(0).default(0),
  iron: z.number().min(0).default(0),
  magnesium: z.number().min(0).default(0),
  potassium: z.number().min(0).default(0),
  sodium: z.number().min(0).default(0),
  zinc: z.number().min(0).default(0),
  copper: z.number().min(0).default(0),
  selenium: z.number().min(0).default(0),
  manganese: z.number().min(0).default(0),
  phosphorus: z.number().min(0).default(0),

  // Other
  cholesterol: z.number().min(0).default(0),
  omega3: z.number().min(0).default(0),
  omega6: z.number().min(0).default(0),
  water: z.number().min(0).default(0),

  sourceReference: z.string().optional(),
});

export const manualEntrySchema = createFoodSchema.extend({
  ingredientName: z.string().min(1, 'Ingredient name is required'),
});

export type CreateFoodInput = z.infer<typeof createFoodSchema>;
export type ManualEntryInput = z.infer<typeof manualEntrySchema>;
