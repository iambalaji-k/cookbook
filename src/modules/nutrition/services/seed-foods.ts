import { db } from '@/core/db';
import { sql, count } from 'drizzle-orm';
import { nutritionFoods, canonicalIngredientNutritionMap, ingredientSynonyms } from '../database/schema';

export async function seedStapleFoods() {
  const now = new Date().toISOString();

  // Check if initial Western batch was seeded (food_shrimp_raw exists)
  const [shrimpCheck] = await db
    .select({ value: count() })
    .from(nutritionFoods)
    .where(sql`id = 'food_shrimp_raw'`);

  if ((shrimpCheck?.value || 0) === 0) {

    // 15 Western Staple Foods (Normalized per 100g)
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

    } // end if Western batch not yet seeded

  // ---------------------------------------------------------------------------
  // INDIAN STAPLE FOODS BATCH
  // ---------------------------------------------------------------------------
  try {
    const [indianCheck] = await db
      .select({ value: count() })
      .from(nutritionFoods)
      .where(sql`id = 'food_chana_dal'`);

    if ((indianCheck?.value || 0) > 0) {
      return;
    }

    const now = new Date().toISOString();

    const indianFoods = [
      // --- Dals & Lentils ---
      {
        id: 'food_chana_dal',
        foodName: 'Chana Dal (Split Bengal Gram), raw',
        aliases: JSON.stringify(['chana dal', 'bengal gram dal', 'split chickpea lentils']),
        source: 'ifct',
        calories: 357, protein: 20.8, fat: 5.6, saturatedFat: 0.6, unsaturatedFat: 5.0,
        carbohydrates: 59.4, fiber: 15.5, sugar: 2.9,
        sodium: 36, potassium: 983, calcium: 186, iron: 7.2, magnesium: 115,
        vitaminB1: 0.48, vitaminB2: 0.18, vitaminB3: 2.2, vitaminB6: 0.54, vitaminB9: 437,
        phosphorus: 372, zinc: 3.0, manganese: 1.4,
        cupWeightG: 200,
      },
      {
        id: 'food_toor_dal',
        foodName: 'Toor Dal (Pigeon Pea), raw',
        aliases: JSON.stringify(['toor dal', 'arhar dal', 'pigeon pea lentils', 'tuvar dal']),
        source: 'ifct',
        calories: 343, protein: 22.3, fat: 1.7, saturatedFat: 0.3, unsaturatedFat: 1.4,
        carbohydrates: 62.8, fiber: 15.0, sugar: 0,
        sodium: 17, potassium: 1392, calcium: 130, iron: 5.2, magnesium: 183,
        vitaminB1: 0.64, vitaminB2: 0.19, vitaminB3: 2.9, vitaminB6: 0.28, vitaminB9: 456,
        phosphorus: 366, zinc: 2.8, manganese: 1.8,
        cupWeightG: 200,
      },
      {
        id: 'food_urad_dal',
        foodName: 'Urad Dal (Black Gram), raw',
        aliases: JSON.stringify(['urad dal', 'black gram dal', 'split black gram']),
        source: 'ifct',
        calories: 341, protein: 25.2, fat: 1.4, saturatedFat: 0.1, unsaturatedFat: 1.3,
        carbohydrates: 59.6, fiber: 10.8, sugar: 0,
        sodium: 38, potassium: 983, calcium: 138, iron: 7.6, magnesium: 267,
        vitaminB1: 0.42, vitaminB2: 0.29, vitaminB3: 2.7, vitaminB6: 0.34, vitaminB9: 216,
        phosphorus: 385, zinc: 3.4, manganese: 1.8,
        cupWeightG: 200,
      },
      {
        id: 'food_masoor_dal',
        foodName: 'Masoor Dal (Red Lentil), raw',
        aliases: JSON.stringify(['masoor dal', 'red lentil', 'masur dal']),
        source: 'ifct',
        calories: 343, protein: 25.4, fat: 1.2, saturatedFat: 0.2, unsaturatedFat: 1.0,
        carbohydrates: 59.0, fiber: 11.0, sugar: 0,
        sodium: 7, potassium: 955, calcium: 48, iron: 7.5, magnesium: 107,
        vitaminB1: 0.51, vitaminB2: 0.20, vitaminB3: 2.6, vitaminB6: 0.60, vitaminB9: 479,
        phosphorus: 294, zinc: 3.6, manganese: 1.7,
        cupWeightG: 200,
      },
      {
        id: 'food_mung_dal',
        foodName: 'Moong Dal (Split Green Gram), raw',
        aliases: JSON.stringify(['moong dal', 'mung dal', 'split green gram', 'yellow lentil']),
        source: 'ifct',
        calories: 347, protein: 24.0, fat: 1.2, saturatedFat: 0.3, unsaturatedFat: 0.9,
        carbohydrates: 63.0, fiber: 16.3, sugar: 2.0,
        sodium: 15, potassium: 1246, calcium: 132, iron: 6.7, magnesium: 189,
        vitaminB1: 0.62, vitaminB2: 0.21, vitaminB3: 2.2, vitaminB6: 0.38, vitaminB9: 625,
        phosphorus: 367, zinc: 2.7, manganese: 1.0,
        cupWeightG: 200,
      },

      // --- Spices ---
      {
        id: 'food_cumin_seeds',
        foodName: 'Cumin Seeds',
        aliases: JSON.stringify(['cumin seeds', 'jeera', 'cumin']),
        source: 'ifct',
        calories: 375, protein: 17.8, fat: 22.3, saturatedFat: 2.0, unsaturatedFat: 20.3,
        carbohydrates: 44.2, fiber: 10.5, sugar: 2.3,
        sodium: 168, potassium: 1788, calcium: 931, iron: 66.4, magnesium: 366,
        vitaminA: 64, vitaminC: 7.7, vitaminB1: 0.63, vitaminB6: 0.44,
        phosphorus: 499, zinc: 4.8, manganese: 3.3,
        tbspWeightG: 6,
      },
      {
        id: 'food_mustard_seeds',
        foodName: 'Mustard Seeds',
        aliases: JSON.stringify(['mustard seeds', 'rai', 'black mustard']),
        source: 'ifct',
        calories: 508, protein: 26.1, fat: 36.2, saturatedFat: 2.0, unsaturatedFat: 34.2,
        carbohydrates: 28.1, fiber: 12.2, sugar: 6.8,
        sodium: 13, potassium: 738, calcium: 266, iron: 9.2, magnesium: 370,
        vitaminC: 7.1, vitaminB1: 0.81, vitaminB6: 0.40,
        phosphorus: 828, zinc: 6.1, manganese: 2.4,
        tbspWeightG: 10,
      },
      {
        id: 'food_coriander_powder',
        foodName: 'Coriander Powder (Dhaniya)',
        aliases: JSON.stringify(['coriander powder', 'dhaniya powder', 'ground coriander']),
        source: 'ifct',
        calories: 298, protein: 12.4, fat: 17.8, saturatedFat: 1.0, unsaturatedFat: 16.8,
        carbohydrates: 55.0, fiber: 41.9, sugar: 0,
        sodium: 35, potassium: 1267, calcium: 709, iron: 16.3, magnesium: 330,
        vitaminC: 21.0, vitaminB1: 0.24, vitaminB2: 0.29, vitaminB3: 2.1,
        phosphorus: 409, zinc: 4.7, manganese: 1.9,
        tbspWeightG: 5,
      },
      {
        id: 'food_red_chili_powder',
        foodName: 'Red Chili Powder',
        aliases: JSON.stringify(['red chili powder', 'chilli powder', 'lal mirch powder', 'chili powder']),
        source: 'ifct',
        calories: 314, protein: 12.6, fat: 16.8, saturatedFat: 3.3, unsaturatedFat: 13.5,
        carbohydrates: 49.7, fiber: 34.8, sugar: 7.2,
        sodium: 1640, potassium: 1950, calcium: 330, iron: 17.3, magnesium: 230,
        vitaminA: 2960, vitaminC: 31.4, vitaminB6: 2.1, vitaminB9: 100,
        phosphorus: 300, zinc: 2.5,
        tbspWeightG: 8,
      },
      {
        id: 'food_turmeric_powder',
        foodName: 'Turmeric Powder (Haldi)',
        aliases: JSON.stringify(['turmeric powder', 'haldi', 'ground turmeric']),
        source: 'ifct',
        calories: 354, protein: 7.8, fat: 9.9, saturatedFat: 3.1, unsaturatedFat: 6.8,
        carbohydrates: 64.9, fiber: 21.1, sugar: 3.2,
        sodium: 38, potassium: 2525, calcium: 183, iron: 41.4, magnesium: 193,
        vitaminC: 25.9, vitaminB6: 1.8,
        phosphorus: 268, zinc: 4.4, manganese: 7.8,
        tbspWeightG: 7,
      },
      {
        id: 'food_asafoetida',
        foodName: 'Asafoetida (Hing)',
        aliases: JSON.stringify(['asafoetida', 'hing']),
        source: 'ifct',
        calories: 297, protein: 4.0, fat: 1.0, saturatedFat: 0.5, unsaturatedFat: 0.5,
        carbohydrates: 67.6, fiber: 8.5, sugar: 0,
        sodium: 30, potassium: 600, calcium: 590, iron: 39.0, magnesium: 120,
        phosphorus: 110,
        tbspWeightG: 5,
      },

      // --- Vegetables ---
      {
        id: 'food_tomato_medium',
        foodName: 'Tomato, raw',
        aliases: JSON.stringify(['tomato', 'tomatoes', 'medium tomatoes']),
        source: 'usda',
        calories: 18, protein: 0.9, fat: 0.2, saturatedFat: 0.1, unsaturatedFat: 0.1,
        carbohydrates: 3.9, fiber: 1.2, sugar: 2.6,
        sodium: 5, potassium: 237, calcium: 10, iron: 0.3, magnesium: 11,
        vitaminA: 42, vitaminC: 13.7, vitaminB9: 15,
        pieceWeightG: 100, densityGPerMl: 1.0,
      },
      {
        id: 'food_green_chili',
        foodName: 'Green Chili Pepper, raw',
        aliases: JSON.stringify(['green chili', 'green chilli', 'hari mirch']),
        source: 'ifct',
        calories: 40, protein: 2.0, fat: 0.2, saturatedFat: 0.1, unsaturatedFat: 0.1,
        carbohydrates: 9.5, fiber: 1.5, sugar: 5.1,
        sodium: 9, potassium: 340, calcium: 14, iron: 1.0, magnesium: 23,
        vitaminA: 59, vitaminC: 144, vitaminB6: 0.5,
        pieceWeightG: 5,
      },
      {
        id: 'food_curry_leaves',
        foodName: 'Curry Leaves, raw',
        aliases: JSON.stringify(['curry leaves', 'kadi patta', 'curry leaf']),
        source: 'ifct',
        calories: 108, protein: 6.1, fat: 1.0, saturatedFat: 0.1, unsaturatedFat: 0.9,
        carbohydrates: 18.7, fiber: 6.4, sugar: 0,
        sodium: 10, potassium: 530, calcium: 830, iron: 0.9, magnesium: 80,
        vitaminA: 756, vitaminC: 4.0, vitaminB1: 0.22, vitaminB2: 0.21, vitaminB3: 2.3,
        phosphorus: 57, zinc: 0.7,
        cupWeightG: 5,
      },
      {
        id: 'food_drumstick',
        foodName: 'Drumstick (Moringa Pod), raw',
        aliases: JSON.stringify(['drumstick', 'moringa pod', 'sarjhan', 'sundakkai']),
        source: 'ifct',
        calories: 37, protein: 2.1, fat: 0.2, saturatedFat: 0.1, unsaturatedFat: 0.1,
        carbohydrates: 8.5, fiber: 3.2, sugar: 0,
        sodium: 42, potassium: 259, calcium: 30, iron: 0.4, magnesium: 45,
        vitaminA: 74, vitaminC: 140, vitaminB6: 0.4,
        pieceWeightG: 20,
      },

      // --- Coconut ---
      {
        id: 'food_grated_coconut',
        foodName: 'Coconut, grated raw',
        aliases: JSON.stringify(['grated coconut', 'fresh coconut', 'coconut', 'nariyal']),
        source: 'ifct',
        calories: 354, protein: 3.3, fat: 33.5, saturatedFat: 29.7, unsaturatedFat: 3.8,
        carbohydrates: 15.2, fiber: 9.0, sugar: 6.2,
        sodium: 20, potassium: 356, calcium: 14, iron: 2.4, magnesium: 32,
        vitaminB5: 0.3, vitaminB9: 26,
        phosphorus: 113, zinc: 1.1, manganese: 1.5,
        densityGPerMl: 0.48, cupWeightG: 80,
      },

      // --- Tamarind ---
      {
        id: 'food_tamarind',
        foodName: 'Tamarind, raw pulp',
        aliases: JSON.stringify(['tamarind', 'imli']),
        source: 'ifct',
        calories: 239, protein: 2.8, fat: 0.6, saturatedFat: 0.3, unsaturatedFat: 0.3,
        carbohydrates: 62.5, fiber: 5.1, sugar: 38.8,
        sodium: 28, potassium: 628, calcium: 74, iron: 2.8, magnesium: 92,
        vitaminB1: 0.43, vitaminB2: 0.15, vitaminB3: 1.9,
        phosphorus: 113, zinc: 0.1,
        densityGPerMl: 1.1,
      },

      // --- Rice ---
      {
        id: 'food_raw_rice',
        foodName: 'White Rice, raw medium grain',
        aliases: JSON.stringify(['raw rice', 'white rice', 'rice', 'sona masoori', 'ponni rice']),
        source: 'ifct',
        calories: 362, protein: 6.8, fat: 0.6, saturatedFat: 0.2, unsaturatedFat: 0.4,
        carbohydrates: 80.0, fiber: 0.6, sugar: 0.1,
        sodium: 2, potassium: 77, calcium: 10, iron: 0.8, magnesium: 23,
        vitaminB1: 0.07, vitaminB3: 1.6,
        phosphorus: 96,
        cupWeightG: 200,
      },

      // --- Oil (Indian Cooking) ---
      {
        id: 'food_coconut_oil',
        foodName: 'Coconut Oil',
        aliases: JSON.stringify(['coconut oil', 'copra oil']),
        source: 'ifct',
        densityGPerMl: 0.92,
        calories: 884, protein: 0, fat: 100, saturatedFat: 86.5, unsaturatedFat: 13.5,
        carbohydrates: 0, fiber: 0, sugar: 0,
        sodium: 0, potassium: 0, vitaminE: 0.1,
        tbspWeightG: 14,
      },
      {
        id: 'food_gingelly_oil',
        foodName: 'Sesame Oil (Gingelly)',
        aliases: JSON.stringify(['sesame oil', 'gingelly oil', 'nalla ennai']),
        source: 'ifct',
        densityGPerMl: 0.92,
        calories: 884, protein: 0, fat: 100, saturatedFat: 14.2, unsaturatedFat: 85.8,
        carbohydrates: 0, fiber: 0, sugar: 0,
        sodium: 0, potassium: 0, vitaminE: 1.4,
        tbspWeightG: 14,
      },
      {
        id: 'food_water',
        foodName: 'Water',
        aliases: JSON.stringify(['water', 'h2o']),
        source: 'usda',
        densityGPerMl: 1.0,
        calories: 0, protein: 0, fat: 0, saturatedFat: 0,
        carbohydrates: 0, fiber: 0, sugar: 0,
        sodium: 5, cupWeightG: 240,
      },
    ];

    for (const food of indianFoods) {
      const f = {
        densityGPerMl: 1.0, pieceWeightG: null, cupWeightG: null, tbspWeightG: null,
        cholesterol: 0, magnesium: 0,
        vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0, vitaminB6: 0, vitaminB9: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0,
        phosphorus: 0, zinc: 0, manganese: 0,
        ...food,
      };
      await db.run(sql`
        INSERT OR IGNORE INTO nutrition_foods (
          id, food_name, aliases, source, serving_size, serving_unit,
          density_g_per_ml, piece_weight_g, cup_weight_g, tbsp_weight_g,
          calories, protein, fat, saturated_fat, unsaturated_fat, carbohydrates, fiber, sugar,
          cholesterol, sodium, potassium, calcium, iron, magnesium,
          vitamin_a, vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b5, vitamin_b6, vitamin_b9, vitamin_c, vitamin_d, vitamin_e,
          phosphorus, zinc, manganese,
          created_at, updated_at
        ) VALUES (
          ${f.id}, ${f.foodName}, ${f.aliases}, ${f.source}, 100, 'g',
          ${f.densityGPerMl || 1.0}, ${f.pieceWeightG || null}, ${f.cupWeightG || null}, ${f.tbspWeightG || null},
          ${f.calories}, ${f.protein}, ${f.fat}, ${f.saturatedFat || 0}, ${f.unsaturatedFat || 0}, ${f.carbohydrates}, ${f.fiber || 0}, ${f.sugar || 0},
          ${f.cholesterol || 0}, ${f.sodium || 0}, ${f.potassium || 0}, ${f.calcium || 0}, ${f.iron || 0}, ${f.magnesium || 0},
          ${f.vitaminA || 0}, ${f.vitaminB1 || 0}, ${f.vitaminB2 || 0}, ${f.vitaminB3 || 0}, ${f.vitaminB5 || 0}, ${f.vitaminB6 || 0}, ${f.vitaminB9 || 0}, ${f.vitaminC || 0}, ${f.vitaminD || 0}, ${f.vitaminE || 0},
          ${f.phosphorus || 0}, ${f.zinc || 0}, ${f.manganese || 0},
          ${now}, ${now}
        );
      `);

    }

    // Indian Canonical Mappings
    const indianMappings = [
      // Dals
      { name: 'chana dal', foodId: 'food_chana_dal' },
      { name: 'toor dal', foodId: 'food_toor_dal' },
      { name: 'urad dal', foodId: 'food_urad_dal' },
      { name: 'masoor dal', foodId: 'food_masoor_dal' },
      { name: 'moong dal', foodId: 'food_mung_dal' },
      // Spices
      { name: 'cumin seeds', foodId: 'food_cumin_seeds' },
      { name: 'jeera', foodId: 'food_cumin_seeds' },
      { name: 'mustard seeds', foodId: 'food_mustard_seeds' },
      { name: 'rai', foodId: 'food_mustard_seeds' },
      { name: 'coriander powder', foodId: 'food_coriander_powder' },
      { name: 'dhaniya powder', foodId: 'food_coriander_powder' },
      { name: 'red chili powder', foodId: 'food_red_chili_powder' },
      { name: 'turmeric powder', foodId: 'food_turmeric_powder' },
      { name: 'haldi', foodId: 'food_turmeric_powder' },
      { name: 'asafoetida', foodId: 'food_asafoetida' },
      { name: 'hing', foodId: 'food_asafoetida' },
      // Vegetables
      { name: 'tomato', foodId: 'food_tomato_medium' },
      { name: 'medium tomatoes', foodId: 'food_tomato_medium' },
      { name: 'green chili', foodId: 'food_green_chili' },
      { name: 'curry leaves', foodId: 'food_curry_leaves' },
      { name: 'drumstick', foodId: 'food_drumstick' },
      // Coconut & Tamarind
      { name: 'grated coconut', foodId: 'food_grated_coconut' },
      { name: 'coconut', foodId: 'food_grated_coconut' },
      { name: 'tamarind', foodId: 'food_tamarind' },
      // Rice
      { name: 'raw rice', foodId: 'food_raw_rice' },
      { name: 'rice', foodId: 'food_raw_rice' },
      // Oils & Water
      { name: 'coconut oil', foodId: 'food_coconut_oil' },
      { name: 'sesame oil', foodId: 'food_gingelly_oil' },
      { name: 'gingelly oil', foodId: 'food_gingelly_oil' },
      { name: 'water', foodId: 'food_water' },
    ];

    for (const map of indianMappings) {
      await db.run(sql`
        INSERT OR IGNORE INTO canonical_ingredient_nutrition_map (
          id, normalized_ingredient_name, nutrition_food_id, confidence_score, mapping_method, approved_by, approved_at, created_at, updated_at
        ) VALUES (
          ${'map_' + crypto.randomUUID().slice(0, 8)}, ${map.name.toLowerCase().trim()}, ${map.foodId}, 1.0, 'auto_exact', 'System Seed', ${now}, ${now}, ${now}
        );
      `);
    }

    // Indian Ingredient Synonyms
    const indianSynonyms = [
      { variant: 'jeera', canonical: 'cumin seeds' },
      { variant: 'jeera seeds', canonical: 'cumin seeds' },
      { variant: 'black mustard seeds', canonical: 'mustard seeds' },
      { variant: 'rai seeds', canonical: 'mustard seeds' },
      { variant: 'dhaniya', canonical: 'coriander powder' },
      { variant: 'ground coriander', canonical: 'coriander powder' },
      { variant: 'lal mirch', canonical: 'red chili powder' },
      { variant: 'chilli powder', canonical: 'red chili powder' },
      { variant: 'hing powder', canonical: 'asafoetida' },
      { variant: 'grated fresh coconut', canonical: 'grated coconut' },
      { variant: 'fresh coconut grated', canonical: 'grated coconut' },
      { variant: 'nariyal', canonical: 'grated coconut' },
      { variant: 'tomatoes', canonical: 'tomato' },
      { variant: 'medium tomato', canonical: 'tomato' },
      { variant: 'ripe tomato', canonical: 'tomato' },
      { variant: 'green chillies', canonical: 'green chili' },
      { variant: 'hari mirch', canonical: 'green chili' },
      { variant: 'chana daal', canonical: 'chana dal' },
      { variant: 'channa dal', canonical: 'chana dal' },
      { variant: 'bengal gram', canonical: 'chana dal' },
      { variant: 'toovar dal', canonical: 'toor dal' },
      { variant: 'arhar dal', canonical: 'toor dal' },
      { variant: 'pigeon pea', canonical: 'toor dal' },
      { variant: 'udad dal', canonical: 'urad dal' },
      { variant: 'black gram', canonical: 'urad dal' },
      { variant: 'red lentils', canonical: 'masoor dal' },
      { variant: 'masar dal', canonical: 'masoor dal' },
      { variant: 'moong daal', canonical: 'mung dal' },
      { variant: 'mung beans', canonical: 'mung dal' },
      { variant: 'yellow moong dal', canonical: 'mung dal' },
      { variant: 'kadi patta', canonical: 'curry leaves' },
      { variant: 'curry leaf', canonical: 'curry leaves' },
      { variant: 'fresh curry leaves', canonical: 'curry leaves' },
      { variant: 'sundakkai vathal', canonical: 'drumstick' },
      { variant: 'imli', canonical: 'tamarind' },
      { variant: 'tamarind pulp', canonical: 'tamarind' },
      { variant: 'sona masoori rice', canonical: 'raw rice' },
      { variant: 'ponni rice', canonical: 'raw rice' },
      { variant: 'medium grain rice', canonical: 'raw rice' },
    ];

    for (const syn of indianSynonyms) {
      await db.run(sql`
        INSERT OR IGNORE INTO ingredient_synonyms (id, variant_name, canonical_name)
        VALUES (${'syn_' + crypto.randomUUID().slice(0, 8)}, ${syn.variant.toLowerCase().trim()}, ${syn.canonical.toLowerCase().trim()});
      `);
    }
  } catch (error) {
    console.warn('Seed Indian staple foods skipped/error:', error);
  }
}
