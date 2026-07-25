import { db } from '@/core/db';
import { sql } from 'drizzle-orm';
import { nutritionFoods, canonicalIngredientNutritionMap, ingredientSynonyms } from '../database/schema';
import { NutritionFoodRecord } from '../types/nutrition.types';
import { CreateFoodInput } from '../validation/nutrition-schema';
import { safeJsonParse } from '@/lib/utils';

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

    // Single query: try direct match + synonym resolution + food_name/alias LIKE in one go
    const mapRows = await db
      .select({
        id: canonicalIngredientNutritionMap.id,
        normalizedIngredientName: canonicalIngredientNutritionMap.normalizedIngredientName,
        nutritionFoodId: canonicalIngredientNutritionMap.nutritionFoodId,
        mappingMethod: canonicalIngredientNutritionMap.mappingMethod,
        approvedBy: canonicalIngredientNutritionMap.approvedBy,
      })
      .from(canonicalIngredientNutritionMap)
      .where(sql`
        approved_by IS NOT NULL
        AND (
          normalized_ingredient_name = ${rawClean}
          OR normalized_ingredient_name IN (
            SELECT canonical_name FROM ingredient_synonyms WHERE variant_name = ${rawClean}
          )
          OR id IN (
            SELECT id FROM canonical_ingredient_nutrition_map
            WHERE nutrition_food_id IN (
              SELECT id FROM nutrition_foods
              WHERE LOWER(food_name) LIKE ${`%${rawClean}%`}
                 OR LOWER(aliases) LIKE ${`%${rawClean}%`}
            )
          )
        )
      `)
      .limit(1);

    let targetFoodId: string | null = null;

    if (mapRows.length > 0) {
      targetFoodId = mapRows[0].nutritionFoodId;
    } else {
      // Last resort: partial substring match against all approved maps
      const allApprovedMaps = await db
        .select()
        .from(canonicalIngredientNutritionMap)
        .where(sql`approved_by IS NOT NULL`);

      for (const entry of allApprovedMaps) {
        if (rawClean.includes(entry.normalizedIngredientName) || entry.normalizedIngredientName.includes(rawClean)) {
          targetFoodId = entry.nutritionFoodId;
          break;
        }
      }
    }

    if (!targetFoodId) return null;

    const [foodRow] = await db
      .select()
      .from(nutritionFoods)
      .where(sql`id = ${targetFoodId}`)
      .limit(1);

    if (!foodRow) return null;
    return parseFoodRow(foodRow);
  } catch (error) {
    console.error('Error finding approved food mapping:', error);
    return null;
  }
}

/**
 * BATCH METHOD: Resolves multiple ingredient strings to mapped canonical food items in 2 queries total.
 * Drastically reduces database round-trips from N*2 queries down to 2 queries total.
 */
export async function batchFindApprovedFoodMappings(
  ingredientNames: string[]
): Promise<Map<string, NutritionFoodRecord>> {
  const result = new Map<string, NutritionFoodRecord>();
  if (ingredientNames.length === 0) return result;

  try {
    // 1. Fetch ALL approved canonical maps and ALL synonyms in 2 quick parallel reads
    const [approvedMaps, synonymsList] = await Promise.all([
      db.select().from(canonicalIngredientNutritionMap).where(sql`approved_by IS NOT NULL`),
      db.select().from(ingredientSynonyms),
    ]);

    // Build lookup maps in memory
    const synonymToCanonical = new Map<string, string>();
    for (const syn of synonymsList) {
      synonymToCanonical.set(syn.variantName.toLowerCase().trim(), syn.canonicalName.toLowerCase().trim());
    }

    const normToFoodId = new Map<string, string>();
    for (const map of approvedMaps) {
      normToFoodId.set(map.normalizedIngredientName.toLowerCase().trim(), map.nutritionFoodId);
    }

    // Match each ingredient in memory
    const matchedFoodIds = new Set<string>();
    const ingToFoodId = new Map<string, string>();

    for (const rawName of ingredientNames) {
      const clean = normalizeIngredientName(rawName);
      let foodId: string | undefined = normToFoodId.get(clean);

      // Synonym lookup
      if (!foodId && synonymToCanonical.has(clean)) {
        const canonical = synonymToCanonical.get(clean)!;
        foodId = normToFoodId.get(canonical);
      }

      // Substring fallback in memory
      if (!foodId) {
        for (const entry of approvedMaps) {
          const normEntry = entry.normalizedIngredientName.toLowerCase().trim();
          if (clean.includes(normEntry) || normEntry.includes(clean)) {
            foodId = entry.nutritionFoodId;
            break;
          }
        }
      }

      if (foodId) {
        matchedFoodIds.add(foodId);
        ingToFoodId.set(rawName, foodId);
      }
    }

    if (matchedFoodIds.size === 0) return result;

    // 2. Fetch all matching food records in a SINGLE query
    const foodIdsArray = Array.from(matchedFoodIds);
    const foodRows = await db
      .select()
      .from(nutritionFoods)
      .where(sql`id IN (${sql.join(foodIdsArray.map(id => sql`${id}`), sql`, `)})`);

    const foodRecordMap = new Map<string, NutritionFoodRecord>();
    for (const row of foodRows) {
      foodRecordMap.set(row.id, parseFoodRow(row));
    }

    // Associate ingredient names to food records
    for (const [rawName, foodId] of ingToFoodId.entries()) {
      const food = foodRecordMap.get(foodId);
      if (food) {
        result.set(rawName, food);
      }
    }

    return result;
  } catch (error) {
    console.error('Error in batchFindApprovedFoodMappings:', error);
    return result;
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
  data: Partial<CreateFoodInput> & { foodName: string; ingredientNameToMap?: string; approvedBy?: string }
): Promise<{ food: NutritionFoodRecord; mappedName?: string }> {
  const foodId = 'food_custom_' + crypto.randomUUID();
  const now = new Date().toISOString();

  await db.run(sql`
    INSERT OR REPLACE INTO nutrition_foods (
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

function parseFoodRow(row: Record<string, any>): NutritionFoodRecord {
  return {
    id: row.id,
    foodName: row.foodName ?? row.food_name ?? 'Unknown Food',
    aliases: typeof row.aliases === 'string' ? safeJsonParse<string[]>(row.aliases, []) : (Array.isArray(row.aliases) ? row.aliases : []),
    source: row.source ?? 'manual',
    servingSize: Number(row.servingSize ?? row.serving_size ?? 100),
    servingUnit: row.servingUnit ?? row.serving_unit ?? 'g',
    densityGPerMl: Number(row.densityGPerMl ?? row.density_g_per_ml ?? 1.0),
    pieceWeightG: row.pieceWeightG ?? row.piece_weight_g ?? null,
    cupWeightG: row.cupWeightG ?? row.cup_weight_g ?? null,
    tbspWeightG: row.tbspWeightG ?? row.tbsp_weight_g ?? null,
    sourceReference: row.sourceReference ?? row.source_reference ?? null,
    createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? row.updated_at ?? new Date().toISOString(),
    macros: {
      calories: Number(row.calories ?? 0),
      protein: Number(row.protein ?? 0),
      fat: Number(row.fat ?? 0),
      saturatedFat: Number(row.saturatedFat ?? row.saturated_fat ?? 0),
      unsaturatedFat: Number(row.unsaturatedFat ?? row.unsaturated_fat ?? 0),
      carbohydrates: Number(row.carbohydrates ?? 0),
      fiber: Number(row.fiber ?? 0),
      sugar: Number(row.sugar ?? 0),
    },
    vitamins: {
      vitaminA: Number(row.vitaminA ?? row.vitamin_a ?? 0),
      vitaminB1: Number(row.vitaminB1 ?? row.vitamin_b1 ?? 0),
      vitaminB2: Number(row.vitaminB2 ?? row.vitamin_b2 ?? 0),
      vitaminB3: Number(row.vitaminB3 ?? row.vitamin_b3 ?? 0),
      vitaminB5: Number(row.vitaminB5 ?? row.vitamin_b5 ?? 0),
      vitaminB6: Number(row.vitaminB6 ?? row.vitamin_b6 ?? 0),
      vitaminB7: Number(row.vitaminB7 ?? row.vitamin_b7 ?? 0),
      vitaminB9: Number(row.vitaminB9 ?? row.vitamin_b9 ?? 0),
      vitaminB12: Number(row.vitaminB12 ?? row.vitamin_b12 ?? 0),
      vitaminC: Number(row.vitaminC ?? row.vitamin_c ?? 0),
      vitaminD: Number(row.vitaminD ?? row.vitamin_d ?? 0),
      vitaminE: Number(row.vitaminE ?? row.vitamin_e ?? 0),
      vitaminK: Number(row.vitaminK ?? row.vitamin_k ?? 0),
    },
    minerals: {
      calcium: Number(row.calcium ?? 0),
      iron: Number(row.iron ?? 0),
      magnesium: Number(row.magnesium ?? 0),
      potassium: Number(row.potassium ?? 0),
      sodium: Number(row.sodium ?? 0),
      zinc: Number(row.zinc ?? 0),
      copper: Number(row.copper ?? 0),
      selenium: Number(row.selenium ?? 0),
      manganese: Number(row.manganese ?? 0),
      phosphorus: Number(row.phosphorus ?? 0),
    },
    other: {
      cholesterol: Number(row.cholesterol ?? 0),
      omega3: Number(row.omega3 ?? 0),
      omega6: Number(row.omega6 ?? 0),
      water: Number(row.water ?? 0),
    },
  };
}
