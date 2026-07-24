import { db } from '@/core/db';
import { sql } from 'drizzle-orm';
import { nutritionFoods, canonicalIngredientNutritionMap, ingredientSynonyms } from '../database/schema';
import { NutritionFoodRecord } from '../types/nutrition.types';
import { CreateFoodInput } from '../validation/nutrition-schema';

export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\(.*?\)/g, '') // remove parenthetical notes e.g. "(peeled & deveined)"
    .trim();
}

/**
 * Resolves an ingredient string to a mapped canonical food item ID.
 */
export async function findApprovedFoodMapping(ingredientName: string): Promise<NutritionFoodRecord | null> {
  try {
    const rawClean = normalizeIngredientName(ingredientName);

    // 1. Direct check in canonical_ingredient_nutrition_map
    let mapRows = await db
      .select()
      .from(canonicalIngredientNutritionMap)
      .where(sql`normalized_ingredient_name = ${rawClean} AND approved_by IS NOT NULL`);

    // 2. If no direct match, check ingredient_synonyms
    if (mapRows.length === 0) {
      const synRows = await db
        .select()
        .from(ingredientSynonyms)
        .where(sql`variant_name = ${rawClean}`);

      if (synRows.length > 0) {
        const canonicalName = synRows[0].canonicalName;
        mapRows = await db
          .select()
          .from(canonicalIngredientNutritionMap)
          .where(sql`normalized_ingredient_name = ${canonicalName} AND approved_by IS NOT NULL`);
      }
    }

    // 3. Partial substring matching if exact match failed
    if (mapRows.length === 0) {
      const allApprovedMaps = await db
        .select()
        .from(canonicalIngredientNutritionMap)
        .where(sql`approved_by IS NOT NULL`);

      for (const entry of allApprovedMaps) {
        if (rawClean.includes(entry.normalizedIngredientName) || entry.normalizedIngredientName.includes(rawClean)) {
          mapRows = [entry];
          break;
        }
      }
    }

    if (mapRows.length === 0) {
      return null;
    }

    const targetFoodId = mapRows[0].nutritionFoodId;
    const foodRows = await db
      .select()
      .from(nutritionFoods)
      .where(sql`id = ${targetFoodId}`);

    if (foodRows.length === 0) return null;

    const row = foodRows[0];
    return parseFoodRow(row);
  } catch (error) {
    console.error('Error finding approved food mapping:', error);
    return null;
  }
}

/**
 * Searches master food records by name or alias.
 */
export async function searchNutritionFoods(query: string, limit = 20): Promise<NutritionFoodRecord[]> {
  try {
    const cleanQuery = `%${query.trim().toLowerCase()}%`;
    const rows = await db
      .select()
      .from(nutritionFoods)
      .where(sql`LOWER(food_name) LIKE ${cleanQuery} OR LOWER(aliases) LIKE ${cleanQuery}`)
      .limit(limit);

    return rows.map(parseFoodRow);
  } catch (error) {
    console.error('Error searching nutrition foods:', error);
    return [];
  }
}

/**
 * Creates a custom food record and automatically registers an approved canonical mapping.
 */
export async function createCustomFoodAndMap(
  data: CreateFoodInput & { ingredientNameToMap?: string; approvedBy?: string }
): Promise<{ food: NutritionFoodRecord; mappedName?: string }> {
  const foodId = 'food_custom_' + crypto.randomUUID();
  const now = new Date().toISOString();

  await db.run(sql`
    INSERT INTO nutrition_foods (
      id, food_name, aliases, source, serving_size, serving_unit,
      density_g_per_ml, piece_weight_g, cup_weight_g, tbsp_weight_g,
      calories, protein, fat, saturated_fat, unsaturated_fat, carbohydrates, fiber, sugar,
      vitamin_a, vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b5, vitamin_b6, vitamin_b7, vitamin_b9, vitamin_b12, vitamin_c, vitamin_d, vitamin_e, vitamin_k,
      calcium, iron, magnesium, potassium, sodium, zinc, copper, selenium, manganese, phosphorus,
      cholesterol, omega3, omega6, water, source_reference, created_at, updated_at
    ) VALUES (
      ${foodId}, ${data.foodName}, ${JSON.stringify(data.aliases || [])}, ${data.source || 'manual'}, ${data.servingSize || 100}, ${data.servingUnit || 'g'},
      ${data.densityGPerMl || 1.0}, ${data.pieceWeightG || null}, ${data.cupWeightG || null}, ${data.tbspWeightG || null},
      ${data.calories}, ${data.protein}, ${data.fat}, ${data.saturatedFat || 0}, ${data.unsaturatedFat || 0}, ${data.carbohydrates}, ${data.fiber || 0}, ${data.sugar || 0},
      ${data.vitaminA || 0}, ${data.vitaminB1 || 0}, ${data.vitaminB2 || 0}, ${data.vitaminB3 || 0}, ${data.vitaminB5 || 0}, ${data.vitaminB6 || 0}, ${data.vitaminB7 || 0}, ${data.vitaminB9 || 0}, ${data.vitaminB12 || 0}, ${data.vitaminC || 0}, ${data.vitaminD || 0}, ${data.vitaminE || 0}, ${data.vitaminK || 0},
      ${data.calcium || 0}, ${data.iron || 0}, ${data.magnesium || 0}, ${data.potassium || 0}, ${data.sodium || 0}, ${data.zinc || 0}, ${data.copper || 0}, ${data.selenium || 0}, ${data.manganese || 0}, ${data.phosphorus || 0},
      ${data.cholesterol || 0}, ${data.omega3 || 0}, ${data.omega6 || 0}, ${data.water || 0}, ${data.sourceReference || null}, ${now}, ${now}
    );
  `);

  const normalizedName = normalizeIngredientName(data.ingredientNameToMap || data.foodName);
  const mapId = 'map_' + crypto.randomUUID().slice(0, 8);
  const approver = data.approvedBy || 'User';

  await db.run(sql`
    INSERT OR REPLACE INTO canonical_ingredient_nutrition_map (
      id, normalized_ingredient_name, nutrition_food_id, confidence_score, mapping_method, approved_by, approved_at, created_at, updated_at
    ) VALUES (
      ${mapId}, ${normalizedName}, ${foodId}, 1.0, 'manual', ${approver}, ${now}, ${now}, ${now}
    );
  `);

  const createdRows = await db.select().from(nutritionFoods).where(sql`id = ${foodId}`);
  return {
    food: parseFoodRow(createdRows[0]),
    mappedName: normalizedName,
  };
}

function parseFoodRow(row: any): NutritionFoodRecord {
  return {
    id: row.id,
    foodName: row.foodName,
    aliases: row.aliases ? JSON.parse(row.aliases) : [],
    source: row.source,
    servingSize: row.servingSize,
    servingUnit: row.servingUnit,
    densityGPerMl: row.densityGPerMl,
    pieceWeightG: row.pieceWeightG,
    cupWeightG: row.cupWeightG,
    tbspWeightG: row.tbspWeightG,
    sourceReference: row.sourceReference,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    macros: {
      calories: row.calories || 0,
      protein: row.protein || 0,
      fat: row.fat || 0,
      saturatedFat: row.saturatedFat || 0,
      unsaturatedFat: row.unsaturatedFat || 0,
      carbohydrates: row.carbohydrates || 0,
      fiber: row.fiber || 0,
      sugar: row.sugar || 0,
    },
    vitamins: {
      vitaminA: row.vitaminA || 0,
      vitaminB1: row.vitaminB1 || 0,
      vitaminB2: row.vitaminB2 || 0,
      vitaminB3: row.vitaminB3 || 0,
      vitaminB5: row.vitaminB5 || 0,
      vitaminB6: row.vitaminB6 || 0,
      vitaminB7: row.vitaminB7 || 0,
      vitaminB9: row.vitaminB9 || 0,
      vitaminB12: row.vitaminB12 || 0,
      vitaminC: row.vitaminC || 0,
      vitaminD: row.vitaminD || 0,
      vitaminE: row.vitaminE || 0,
      vitaminK: row.vitaminK || 0,
    },
    minerals: {
      calcium: row.calcium || 0,
      iron: row.iron || 0,
      magnesium: row.magnesium || 0,
      potassium: row.potassium || 0,
      sodium: row.sodium || 0,
      zinc: row.zinc || 0,
      copper: row.copper || 0,
      selenium: row.selenium || 0,
      manganese: row.manganese || 0,
      phosphorus: row.phosphorus || 0,
    },
    other: {
      cholesterol: row.cholesterol || 0,
      omega3: row.omega3 || 0,
      omega6: row.omega6 || 0,
      water: row.water || 0,
    },
  };
}
