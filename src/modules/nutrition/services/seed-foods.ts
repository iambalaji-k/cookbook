import { db } from '@/core/db';
import { sql, count } from 'drizzle-orm';
import { nutritionFoods, canonicalIngredientNutritionMap, ingredientSynonyms } from '../database/schema';

export async function seedStapleFoods() {
  try {
    const [cCount] = await db.select({ value: count() }).from(nutritionFoods);
    if ((cCount?.value || 0) > 0) {
      return; // Already seeded
    }

    const now = new Date().toISOString();

    // 15 Staple Foods (Normalized per 100g)
    const stapleFoods = [
      {
        id: 'food_shrimp_raw',
        foodName: 'Shrimp, raw',
        aliases: JSON.stringify(['large shrimp', 'shrimp', 'prawns']),
        source: 'usda',
        calories: 85,
        protein: 20.1,
        fat: 0.5,
        saturatedFat: 0.1,
        carbohydrates: 0.2,
        fiber: 0,
        sugar: 0,
        cholesterol: 161,
        sodium: 119,
        potassium: 259,
        calcium: 64,
        iron: 0.5,
        pieceWeightG: 15, // ~15g per large shrimp
      },
      {
        id: 'food_fettuccine_pasta',
        foodName: 'Fettuccine Pasta, dry',
        aliases: JSON.stringify(['fettuccine', 'pasta', 'spaghetti']),
        source: 'usda',
        calories: 371,
        protein: 13.0,
        fat: 1.5,
        saturatedFat: 0.3,
        carbohydrates: 74.7,
        fiber: 3.2,
        sugar: 2.7,
        sodium: 6,
        potassium: 223,
        calcium: 21,
        iron: 1.3,
        cupWeightG: 100,
      },
      {
        id: 'food_garlic_raw',
        foodName: 'Garlic, raw',
        aliases: JSON.stringify(['garlic', 'minced garlic', 'garlic cloves']),
        source: 'usda',
        calories: 149,
        protein: 6.4,
        fat: 0.5,
        saturatedFat: 0.1,
        carbohydrates: 33.1,
        fiber: 2.1,
        sugar: 1.0,
        sodium: 17,
        potassium: 401,
        calcium: 181,
        iron: 1.7,
        vitaminC: 31.2,
        pieceWeightG: 3, // 1 clove = 3g
      },
      {
        id: 'food_sundried_tomatoes',
        foodName: 'Sun-dried Tomatoes',
        aliases: JSON.stringify(['sun-dried tomatoes', 'dried tomatoes']),
        source: 'usda',
        calories: 258,
        protein: 14.1,
        fat: 3.0,
        saturatedFat: 0.4,
        carbohydrates: 55.8,
        fiber: 12.3,
        sugar: 37.6,
        sodium: 2095,
        potassium: 3427,
        calcium: 110,
        iron: 9.1,
        vitaminC: 39.2,
        cupWeightG: 110,
      },
      {
        id: 'food_spinach_raw',
        foodName: 'Fresh Baby Spinach, raw',
        aliases: JSON.stringify(['spinach', 'fresh baby spinach', 'baby spinach']),
        source: 'usda',
        calories: 23,
        protein: 2.9,
        fat: 0.4,
        saturatedFat: 0.1,
        carbohydrates: 3.6,
        fiber: 2.2,
        sugar: 0.4,
        sodium: 79,
        potassium: 558,
        calcium: 99,
        iron: 2.7,
        vitaminA: 469,
        vitaminC: 28.1,
        cupWeightG: 30, // 1 cup packed spinach = 30g
      },
      {
        id: 'food_heavy_cream',
        foodName: 'Heavy Cream',
        aliases: JSON.stringify(['heavy cream', 'heavy whipping cream', 'double cream']),
        source: 'usda',
        densityGPerMl: 0.98,
        calories: 340,
        protein: 2.8,
        fat: 36.1,
        saturatedFat: 23.0,
        carbohydrates: 2.7,
        fiber: 0,
        sugar: 2.9,
        cholesterol: 137,
        sodium: 38,
        potassium: 95,
        calcium: 66,
        vitaminA: 420,
        cupWeightG: 238,
        tbspWeightG: 15,
      },
      {
        id: 'food_olive_oil',
        foodName: 'Olive Oil, extra virgin',
        aliases: JSON.stringify(['olive oil', 'extra virgin olive oil']),
        source: 'usda',
        densityGPerMl: 0.92,
        calories: 884,
        protein: 0,
        fat: 100,
        saturatedFat: 14.0,
        unsaturatedFat: 86.0,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        sodium: 2,
        vitaminE: 14.3,
        tbspWeightG: 14,
      },
      {
        id: 'food_butter',
        foodName: 'Butter, unsalted',
        aliases: JSON.stringify(['butter', 'ghee', 'unsalted butter']),
        source: 'usda',
        calories: 717,
        protein: 0.9,
        fat: 81.1,
        saturatedFat: 51.4,
        carbohydrates: 0.1,
        fiber: 0,
        sugar: 0.1,
        cholesterol: 215,
        sodium: 11,
        calcium: 24,
        vitaminA: 684,
        tbspWeightG: 14.2,
      },
      {
        id: 'food_salt',
        foodName: 'Salt, table',
        aliases: JSON.stringify(['salt', 'sea salt', 'kosher salt']),
        source: 'usda',
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        sodium: 38758,
        calcium: 24,
        iron: 0.3,
      },
      {
        id: 'food_black_pepper',
        foodName: 'Black Pepper, ground',
        aliases: JSON.stringify(['black pepper', 'pepper']),
        source: 'usda',
        calories: 251,
        protein: 10.4,
        fat: 3.3,
        carbohydrates: 64.0,
        fiber: 25.3,
        sugar: 0.6,
        sodium: 20,
        potassium: 1329,
        calcium: 443,
        iron: 9.7,
      },
      {
        id: 'food_chicken_breast',
        foodName: 'Chicken Breast, boneless raw',
        aliases: JSON.stringify(['chicken breast', 'chicken', 'boneless chicken']),
        source: 'usda',
        calories: 120,
        protein: 22.5,
        fat: 2.6,
        saturatedFat: 0.7,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        cholesterol: 73,
        sodium: 45,
        potassium: 334,
        iron: 0.4,
        pieceWeightG: 200,
      },
      {
        id: 'food_basmati_rice',
        foodName: 'Basmati Rice, dry',
        aliases: JSON.stringify(['basmati rice', 'white rice', 'rice']),
        source: 'usda',
        calories: 365,
        protein: 7.1,
        fat: 0.7,
        carbohydrates: 78.9,
        fiber: 1.3,
        sugar: 0.1,
        sodium: 5,
        potassium: 115,
        cupWeightG: 185,
      },
      {
        id: 'food_yellow_onion',
        foodName: 'Yellow Onion, raw',
        aliases: JSON.stringify(['yellow onion', 'onion', 'diced onion']),
        source: 'usda',
        calories: 40,
        protein: 1.1,
        fat: 0.1,
        carbohydrates: 9.3,
        fiber: 1.7,
        sugar: 4.2,
        sodium: 4,
        potassium: 146,
        vitaminC: 7.4,
        pieceWeightG: 150,
      },
      {
        id: 'food_whole_milk',
        foodName: 'Whole Milk',
        aliases: JSON.stringify(['whole milk', 'milk']),
        source: 'usda',
        densityGPerMl: 1.03,
        calories: 61,
        protein: 3.2,
        fat: 3.3,
        saturatedFat: 1.9,
        carbohydrates: 4.8,
        fiber: 0,
        sugar: 5.1,
        cholesterol: 12,
        sodium: 43,
        potassium: 132,
        calcium: 113,
        vitaminD: 1.3,
        cupWeightG: 244,
      },
      {
        id: 'food_granulated_sugar',
        foodName: 'Granulated Sugar',
        aliases: JSON.stringify(['granulated sugar', 'sugar', 'white sugar']),
        source: 'usda',
        calories: 387,
        protein: 0,
        fat: 0,
        carbohydrates: 100,
        fiber: 0,
        sugar: 100,
        cupWeightG: 200,
        tbspWeightG: 12.5,
      },
    ];

    for (const food of stapleFoods) {
      await db.run(sql`
        INSERT OR IGNORE INTO nutrition_foods (
          id, food_name, aliases, source, serving_size, serving_unit,
          density_g_per_ml, piece_weight_g, cup_weight_g, tbsp_weight_g,
          calories, protein, fat, saturated_fat, unsaturated_fat, carbohydrates, fiber, sugar,
          cholesterol, sodium, potassium, calcium, iron, vitamin_a, vitamin_c, vitamin_d,
          created_at, updated_at
        ) VALUES (
          ${food.id}, ${food.foodName}, ${food.aliases}, ${food.source}, 100, 'g',
          ${food.densityGPerMl || 1.0}, ${food.pieceWeightG || null}, ${food.cupWeightG || null}, ${food.tbspWeightG || null},
          ${food.calories}, ${food.protein}, ${food.fat}, ${food.saturatedFat || 0}, ${food.unsaturatedFat || 0}, ${food.carbohydrates}, ${food.fiber || 0}, ${food.sugar || 0},
          ${food.cholesterol || 0}, ${food.sodium || 0}, ${food.potassium || 0}, ${food.calcium || 0}, ${food.iron || 0}, ${food.vitaminA || 0}, ${food.vitaminC || 0}, ${food.vitaminD || 0},
          ${now}, ${now}
        );
      `);
    }

    // Standard Canonical Mappings
    const canonicalMappings = [
      { name: 'large shrimp (peeled & deveined)', foodId: 'food_shrimp_raw' },
      { name: 'shrimp', foodId: 'food_shrimp_raw' },
      { name: 'fettuccine pasta', foodId: 'food_fettuccine_pasta' },
      { name: 'garlic', foodId: 'food_garlic_raw' },
      { name: 'sun-dried tomatoes', foodId: 'food_sundried_tomatoes' },
      { name: 'fresh baby spinach', foodId: 'food_spinach_raw' },
      { name: 'heavy cream', foodId: 'food_heavy_cream' },
      { name: 'olive oil', foodId: 'food_olive_oil' },
      { name: 'butter', foodId: 'food_butter' },
      { name: 'ghee', foodId: 'food_butter' },
      { name: 'salt', foodId: 'food_salt' },
      { name: 'black pepper', foodId: 'food_black_pepper' },
      { name: 'chicken breast', foodId: 'food_chicken_breast' },
      { name: 'basmati rice', foodId: 'food_basmati_rice' },
      { name: 'onion', foodId: 'food_yellow_onion' },
      { name: 'milk', foodId: 'food_whole_milk' },
      { name: 'sugar', foodId: 'food_granulated_sugar' },
    ];

    for (const map of canonicalMappings) {
      await db.run(sql`
        INSERT OR IGNORE INTO canonical_ingredient_nutrition_map (
          id, normalized_ingredient_name, nutrition_food_id, confidence_score, mapping_method, approved_by, approved_at, created_at, updated_at
        ) VALUES (
          ${'map_' + crypto.randomUUID().slice(0, 8)}, ${map.name.toLowerCase().trim()}, ${map.foodId}, 1.0, 'auto_exact', 'System Seed', ${now}, ${now}, ${now}
        );
      `);
    }

    // Synonyms
    const synonyms = [
      { variant: 'minced garlic', canonical: 'garlic' },
      { variant: 'garlic cloves', canonical: 'garlic' },
      { variant: 'prawns', canonical: 'shrimp' },
      { variant: 'baby spinach', canonical: 'fresh baby spinach' },
      { variant: 'spinach leaves', canonical: 'fresh baby spinach' },
      { variant: 'unsalted butter', canonical: 'butter' },
      { variant: 'heavy whipping cream', canonical: 'heavy cream' },
    ];

    for (const syn of synonyms) {
      await db.run(sql`
        INSERT OR IGNORE INTO ingredient_synonyms (id, variant_name, canonical_name)
        VALUES (${'syn_' + crypto.randomUUID().slice(0, 8)}, ${syn.variant.toLowerCase().trim()}, ${syn.canonical.toLowerCase().trim()});
      `);
    }

  } catch (error) {
    console.warn('Seed staple foods skipped/error:', error);
  }
}
