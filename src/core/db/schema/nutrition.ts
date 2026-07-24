import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { contentEntities } from './content';

/**
 * Master Food Database Table (Normalized per 100g)
 * Includes physical density and piece weight parameters for precise volume/piece conversions.
 */
export const nutritionFoods = sqliteTable('nutrition_foods', {
  id: text('id').primaryKey(), // UUID
  foodName: text('food_name').notNull().unique(), // e.g. "Garlic, raw", "Olive Oil"
  aliases: text('aliases'), // JSON array of alternative names e.g. ["minced garlic", "garlic cloves"]
  source: text('source').default('manual').notNull(), // 'usda', 'ifct', 'manual', 'ai_search'
  servingSize: real('serving_size').default(100).notNull(),
  servingUnit: text('serving_unit').default('g').notNull(),

  // Physical Conversion Parameters (Ingredient-Specific Density & Weights)
  densityGPerMl: real('density_g_per_ml').default(1.0),   // e.g. Oil = 0.92, Flour = 0.53, Honey = 1.42
  pieceWeightG: real('piece_weight_g'),                   // e.g. 1 Garlic Clove = 3g, 1 Egg = 50g, 1 Apple = 182g
  cupWeightG: real('cup_weight_g'),                       // e.g. 1 cup flour = 120g, 1 cup sugar = 200g
  tbspWeightG: real('tbsp_weight_g'),                     // e.g. 1 tbsp oil = 14g

  // Macronutrients (per 100g)
  calories: real('calories').default(0).notNull(),       // kcal
  protein: real('protein').default(0).notNull(),         // g
  fat: real('fat').default(0).notNull(),                 // g
  saturatedFat: real('saturated_fat').default(0),        // g
  unsaturatedFat: real('unsaturated_fat').default(0),    // g
  carbohydrates: real('carbohydrates').default(0).notNull(), // g
  fiber: real('fiber').default(0),                       // g
  sugar: real('sugar').default(0),                       // g

  // Micronutrients (Vitamins per 100g)
  vitaminA: real('vitamin_a').default(0),   // mcg RAE
  vitaminB1: real('vitamin_b1').default(0), // mg
  vitaminB2: real('vitamin_b2').default(0), // mg
  vitaminB3: real('vitamin_b3').default(0), // mg
  vitaminB5: real('vitamin_b5').default(0), // mg
  vitaminB6: real('vitamin_b6').default(0), // mg
  vitaminB7: real('vitamin_b7').default(0), // mcg
  vitaminB9: real('vitamin_b9').default(0), // mcg
  vitaminB12: real('vitamin_b12').default(0),// mcg
  vitaminC: real('vitamin_c').default(0),   // mg
  vitaminD: real('vitamin_d').default(0),   // mcg
  vitaminE: real('vitamin_e').default(0),   // mg
  vitaminK: real('vitamin_k').default(0),   // mcg

  // Minerals (per 100g)
  calcium: real('calcium').default(0),       // mg
  iron: real('iron').default(0),             // mg
  magnesium: real('magnesium').default(0),   // mg
  potassium: real('potassium').default(0),   // mg
  sodium: real('sodium').default(0),         // mg
  zinc: real('zinc').default(0),             // mg
  copper: real('copper').default(0),         // mg
  selenium: real('selenium').default(0),     // mcg
  manganese: real('manganese').default(0),   // mg
  phosphorus: real('phosphorus').default(0), // mg

  // Other Nutrients (per 100g)
  cholesterol: real('cholesterol').default(0),// mg
  omega3: real('omega3').default(0),         // g
  omega6: real('omega6').default(0),         // g
  water: real('water').default(0),           // g

  sourceReference: text('source_reference'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Shared Canonical Ingredient Nutrition Mapping Table
 * Maps normalized ingredient names (e.g. "garlic") to nutrition_foods records.
 */
export const canonicalIngredientNutritionMap = sqliteTable('canonical_ingredient_nutrition_map', {
  id: text('id').primaryKey(),
  normalizedIngredientName: text('normalized_ingredient_name').notNull().unique(), // lowercased & trimmed e.g. "garlic"
  nutritionFoodId: text('nutrition_food_id').notNull().references(() => nutritionFoods.id, { onDelete: 'cascade' }),
  confidenceScore: real('confidence_score').default(1.0).notNull(),
  mappingMethod: text('mapping_method', { enum: ['manual', 'ai_suggested', 'auto_exact'] }).default('manual').notNull(),
  approvedBy: text('approved_by'), // null if pending admin approval
  approvedAt: text('approved_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * Ingredient Synonyms / Equivalence Sub-Table
 * Maps variant ingredient names to canonical names (e.g. "minced garlic" -> "garlic").
 */
export const ingredientSynonyms = sqliteTable('ingredient_synonyms', {
  id: text('id').primaryKey(),
  variantName: text('variant_name').notNull().unique(), // lowercased e.g. "minced garlic"
  canonicalName: text('canonical_name').notNull(),      // lowercased e.g. "garlic"
});

/**
 * Recipe Nutrition Cache Sub-Table
 * Caches pre-calculated nutrition totals, per-serving values, coverage %, and top-level indexed macros.
 */
export const recipeNutritionCache = sqliteTable('recipe_nutrition_cache', {
  id: text('id').primaryKey(), // UUID
  recipeId: text('recipe_id').notNull().unique().references(() => contentEntities.id, { onDelete: 'cascade' }),

  // Top-Level Indexed Macro Columns (Per Serving) for Fast Database Filtering
  caloriesPerServing: real('calories_per_serving').default(0).notNull(),
  proteinPerServing: real('protein_per_serving').default(0).notNull(),
  carbsPerServing: real('carbs_per_serving').default(0).notNull(),
  fatPerServing: real('fat_per_serving').default(0).notNull(),
  fiberPerServing: real('fiber_per_serving').default(0).notNull(),
  sugarPerServing: real('sugar_per_serving').default(0).notNull(),

  // Nutrition Coverage Metrics
  nutritionCoveragePercent: real('nutrition_coverage_percent').default(100).notNull(), // 0.0 to 100.0
  mappedIngredientCount: integer('mapped_ingredient_count').default(0).notNull(),
  totalIngredientCount: integer('total_ingredient_count').default(0).notNull(),
  unmappedIngredients: text('unmapped_ingredients'), // JSON string array

  // Full Detailed Profiles (Macros + Micros + % DV)
  totalNutrition: text('total_nutrition').notNull(),       // JSON blob
  perServingNutrition: text('per_serving_nutrition').notNull(), // JSON blob

  calculatedAt: text('calculated_at').notNull(),
  calculationVersion: text('calculation_version').default('v1.0').notNull(),
});
