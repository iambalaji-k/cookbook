import { db } from '@/core/db';
import { sql } from 'drizzle-orm';
import { contentEntities, ingredients } from '@/core/db/schema/content';
import { recipeNutritionCache } from '../database/schema';
import { findApprovedFoodMapping, batchFindApprovedFoodMappings } from './nutrition-service';
import { convertQuantityToGrams } from '../utils/quantity-to-grams-converter';
import { calculateDailyValuePercentages, DVProfile } from '../utils/daily-values';
import {
  FullNutritionProfile,
  RecipeNutritionCalculationResult,
  MacroNutrients,
  VitaminNutrients,
  MineralNutrients,
  OtherNutrients,
} from '../types/nutrition.types';

function createEmptyProfile(): FullNutritionProfile {
  return {
    macros: {
      calories: 0,
      protein: 0,
      fat: 0,
      saturatedFat: 0,
      unsaturatedFat: 0,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
    },
    vitamins: {
      vitaminA: 0,
      vitaminB1: 0,
      vitaminB2: 0,
      vitaminB3: 0,
      vitaminB5: 0,
      vitaminB6: 0,
      vitaminB7: 0,
      vitaminB9: 0,
      vitaminB12: 0,
      vitaminC: 0,
      vitaminD: 0,
      vitaminE: 0,
      vitaminK: 0,
    },
    minerals: {
      calcium: 0,
      iron: 0,
      magnesium: 0,
      potassium: 0,
      sodium: 0,
      zinc: 0,
      copper: 0,
      selenium: 0,
      manganese: 0,
      phosphorus: 0,
    },
    other: {
      cholesterol: 0,
      omega3: 0,
      omega6: 0,
      water: 0,
    },
  };
}

/**
 * Deterministically calculates nutrition for a recipe and updates the cache table.
 */
export async function calculateAndCacheRecipeNutrition(
  recipeId: string,
  dvProfile: DVProfile = 'US_FDA'
): Promise<RecipeNutritionCalculationResult | null> {
  try {
    // 1. Fetch recipe entity
    const [recipe] = await db
      .select()
      .from(contentEntities)
      .where(sql`id = ${recipeId}`);

    if (!recipe) return null;

    const servings = recipe.servings && recipe.servings > 0 ? recipe.servings : 4;

    // 2. Fetch ingredients
    const ingList = await db
      .select()
      .from(ingredients)
      .where(sql`entity_id = ${recipeId}`);

    const totalCount = ingList.length;
    let mappedCount = 0;
    const unmappedNames: string[] = [];

    const totalProfile = createEmptyProfile();

    // 3. Batch lookup all ingredient food mappings in 1 single database pass
    const ingredientNames = ingList.map((ing) => ing.itemName);
    const foodMap = await batchFindApprovedFoodMappings(ingredientNames);

    // 4. Process each ingredient deterministically in memory
    for (const ing of ingList) {
      const food = foodMap.get(ing.itemName);

      if (!food) {
        unmappedNames.push(ing.itemName);
        continue;
      }

      mappedCount++;


      // Convert unit + amount to grams using food's specific physical properties
      const { grams } = convertQuantityToGrams(ing.amount, ing.unit, food);
      const factor = grams / 100;

      // Accumulate Macros
      totalProfile.macros.calories += food.macros.calories * factor;
      totalProfile.macros.protein += food.macros.protein * factor;
      totalProfile.macros.fat += food.macros.fat * factor;
      totalProfile.macros.saturatedFat += food.macros.saturatedFat * factor;
      totalProfile.macros.unsaturatedFat += food.macros.unsaturatedFat * factor;
      totalProfile.macros.carbohydrates += food.macros.carbohydrates * factor;
      totalProfile.macros.fiber += food.macros.fiber * factor;
      totalProfile.macros.sugar += food.macros.sugar * factor;

      // Accumulate Vitamins
      totalProfile.vitamins.vitaminA += food.vitamins.vitaminA * factor;
      totalProfile.vitamins.vitaminB1 += food.vitamins.vitaminB1 * factor;
      totalProfile.vitamins.vitaminB2 += food.vitamins.vitaminB2 * factor;
      totalProfile.vitamins.vitaminB3 += food.vitamins.vitaminB3 * factor;
      totalProfile.vitamins.vitaminB5 += food.vitamins.vitaminB5 * factor;
      totalProfile.vitamins.vitaminB6 += food.vitamins.vitaminB6 * factor;
      totalProfile.vitamins.vitaminB7 += food.vitamins.vitaminB7 * factor;
      totalProfile.vitamins.vitaminB9 += food.vitamins.vitaminB9 * factor;
      totalProfile.vitamins.vitaminB12 += food.vitamins.vitaminB12 * factor;
      totalProfile.vitamins.vitaminC += food.vitamins.vitaminC * factor;
      totalProfile.vitamins.vitaminD += food.vitamins.vitaminD * factor;
      totalProfile.vitamins.vitaminE += food.vitamins.vitaminE * factor;
      totalProfile.vitamins.vitaminK += food.vitamins.vitaminK * factor;

      // Accumulate Minerals
      totalProfile.minerals.calcium += food.minerals.calcium * factor;
      totalProfile.minerals.iron += food.minerals.iron * factor;
      totalProfile.minerals.magnesium += food.minerals.magnesium * factor;
      totalProfile.minerals.potassium += food.minerals.potassium * factor;
      totalProfile.minerals.sodium += food.minerals.sodium * factor;
      totalProfile.minerals.zinc += food.minerals.zinc * factor;
      totalProfile.minerals.copper += food.minerals.copper * factor;
      totalProfile.minerals.selenium += food.minerals.selenium * factor;
      totalProfile.minerals.manganese += food.minerals.manganese * factor;
      totalProfile.minerals.phosphorus += food.minerals.phosphorus * factor;

      // Accumulate Other Nutrients
      totalProfile.other.cholesterol += food.other.cholesterol * factor;
      totalProfile.other.omega3 += food.other.omega3 * factor;
      totalProfile.other.omega6 += food.other.omega6 * factor;
      totalProfile.other.water += food.other.water * factor;
    }

    // 4. Calculate Coverage %
    const coveragePercent = totalCount > 0 ? Math.round((mappedCount / totalCount) * 100) : 100;

    // 5. Calculate Per Serving Profile
    const perServingProfile = createEmptyProfile();
    const round2 = (num: number) => Math.round(num * 10) / 10;

    (Object.keys(totalProfile.macros) as Array<keyof MacroNutrients>).forEach((key) => {
      perServingProfile.macros[key] = round2(totalProfile.macros[key] / servings);
      totalProfile.macros[key] = round2(totalProfile.macros[key]);
    });

    (Object.keys(totalProfile.vitamins) as Array<keyof VitaminNutrients>).forEach((key) => {
      perServingProfile.vitamins[key] = round2(totalProfile.vitamins[key] / servings);
      totalProfile.vitamins[key] = round2(totalProfile.vitamins[key]);
    });

    (Object.keys(totalProfile.minerals) as Array<keyof MineralNutrients>).forEach((key) => {
      perServingProfile.minerals[key] = round2(totalProfile.minerals[key] / servings);
      totalProfile.minerals[key] = round2(totalProfile.minerals[key]);
    });

    (Object.keys(totalProfile.other) as Array<keyof OtherNutrients>).forEach((key) => {
      perServingProfile.other[key] = round2(totalProfile.other[key] / servings);
      totalProfile.other[key] = round2(totalProfile.other[key]);
    });

    // 6. Calculate % Daily Values
    const dvPercentages = calculateDailyValuePercentages(perServingProfile, dvProfile);

    // 7. Store / Update Cache
    const cacheId = 'cache_' + recipeId;
    const now = new Date().toISOString();

    await db.run(sql`
      INSERT INTO recipe_nutrition_cache (
        id, recipe_id,
        calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, fiber_per_serving, sugar_per_serving,
        nutrition_coverage_percent, mapped_ingredient_count, total_ingredient_count, unmapped_ingredients,
        total_nutrition, per_serving_nutrition, calculated_at, calculation_version
      ) VALUES (
        ${cacheId}, ${recipeId},
        ${perServingProfile.macros.calories}, ${perServingProfile.macros.protein}, ${perServingProfile.macros.carbohydrates}, ${perServingProfile.macros.fat}, ${perServingProfile.macros.fiber}, ${perServingProfile.macros.sugar},
        ${coveragePercent}, ${mappedCount}, ${totalCount}, ${JSON.stringify(unmappedNames)},
        ${JSON.stringify(totalProfile)}, ${JSON.stringify(perServingProfile)}, ${now}, 'v1.0'
      ) ON CONFLICT(recipe_id) DO UPDATE SET
        calories_per_serving = excluded.calories_per_serving,
        protein_per_serving = excluded.protein_per_serving,
        carbs_per_serving = excluded.carbs_per_serving,
        fat_per_serving = excluded.fat_per_serving,
        fiber_per_serving = excluded.fiber_per_serving,
        sugar_per_serving = excluded.sugar_per_serving,
        nutrition_coverage_percent = excluded.nutrition_coverage_percent,
        mapped_ingredient_count = excluded.mapped_ingredient_count,
        total_ingredient_count = excluded.total_ingredient_count,
        unmapped_ingredients = excluded.unmapped_ingredients,
        total_nutrition = excluded.total_nutrition,
        per_serving_nutrition = excluded.per_serving_nutrition,
        calculated_at = excluded.calculated_at,
        calculation_version = excluded.calculation_version;
    `);

    return {
      recipeId,
      servings,
      nutritionCoveragePercent: coveragePercent,
      mappedIngredientCount: mappedCount,
      totalIngredientCount: totalCount,
      unmappedIngredients: unmappedNames,
      totalNutrition: totalProfile,
      perServingNutrition: perServingProfile,
      dailyValuePercentages: dvPercentages,
      calculatedAt: now,
      calculationVersion: 'v1.0',
    };
  } catch (error) {
    console.error('Error calculating recipe nutrition:', error);
    return null;
  }
}

/**
 * Retrieves cached recipe nutrition or calculates it if missing/stale.
 */
export async function getRecipeNutrition(recipeId: string): Promise<RecipeNutritionCalculationResult | null> {
  try {
    const rows = await db
      .select()
      .from(recipeNutritionCache)
      .where(sql`recipe_id = ${recipeId}`);

    if (rows.length > 0) {
      const row = rows[0];
      const perServing = JSON.parse(row.perServingNutrition);
      const total = JSON.parse(row.totalNutrition);
      const dvPercentages = calculateDailyValuePercentages(perServing, 'US_FDA');

      // Fetch actual servings from the recipe entity
      const [recipe] = await db
        .select({ servings: contentEntities.servings })
        .from(contentEntities)
        .where(sql`id = ${recipeId}`);
      const servings = recipe?.servings && recipe.servings > 0 ? recipe.servings : 4;

      return {
        recipeId: row.recipeId,
        servings,
        nutritionCoveragePercent: row.nutritionCoveragePercent,
        mappedIngredientCount: row.mappedIngredientCount,
        totalIngredientCount: row.totalIngredientCount,
        unmappedIngredients: row.unmappedIngredients ? JSON.parse(row.unmappedIngredients) : [],
        totalNutrition: total,
        perServingNutrition: perServing,
        dailyValuePercentages: dvPercentages,
        calculatedAt: row.calculatedAt,
        calculationVersion: row.calculationVersion,
      };
    }

    // If cache missing, calculate and return
    return await calculateAndCacheRecipeNutrition(recipeId);
  } catch (error) {
    console.error('Error retrieving recipe nutrition:', error);
    return null;
  }
}
