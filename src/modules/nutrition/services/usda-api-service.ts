import { CreateFoodInput } from '../validation/nutrition-schema';

/**
 * USDA FoodData Central (FDC) API Integration
 * API Guide: https://fdc.nal.usda.gov/api-guide.html
 */
export async function searchUSDAFoodDataCentral(
  query: string,
  apiKey?: string
): Promise<CreateFoodInput[]> {
  const key = apiKey || process.env.USDA_FDC_API_KEY || 'DEMO_KEY';
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(
    key
  )}&query=${encodeURIComponent(query)}&dataType=Foundation,SR%20Legacy&pageSize=5`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }, // Cache search queries for 24h
    });

    if (!res.ok) {
      throw new Error(`USDA API HTTP error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.foods || !Array.isArray(data.foods)) {
      return [];
    }

    return data.foods.map((food: any) => mapUSDAFoodToRecord(food));
  } catch (error) {
    console.error('Error querying USDA FoodData Central API:', error);
    throw error;
  }
}

/**
 * Maps USDA FDC Food item JSON response to our standard 100g CreateFoodInput format.
 */
function mapUSDAFoodToRecord(food: any): CreateFoodInput {
  const nutrients: Record<string, number> = {};

  if (food.foodNutrients && Array.isArray(food.foodNutrients)) {
    food.foodNutrients.forEach((n: any) => {
      const num = String(n.nutrientNumber || n.nutrientId);
      const val = Number(n.value || n.amount || 0);
      if (!isNaN(val)) {
        nutrients[num] = val;
      }
    });
  }

  const calories = nutrients['1008'] ?? nutrients['208'] ?? 0;
  const protein = nutrients['1003'] ?? nutrients['203'] ?? 0;
  const fat = nutrients['1004'] ?? nutrients['204'] ?? 0;
  const saturatedFat = nutrients['1258'] ?? nutrients['606'] ?? 0;
  const carbs = nutrients['1005'] ?? nutrients['205'] ?? 0;
  const fiber = nutrients['1079'] ?? nutrients['291'] ?? 0;
  const sugar = nutrients['2000'] ?? nutrients['269'] ?? 0;
  const calcium = nutrients['1087'] ?? nutrients['301'] ?? 0;
  const iron = nutrients['1089'] ?? nutrients['303'] ?? 0;
  const sodium = nutrients['1093'] ?? nutrients['307'] ?? 0;
  const potassium = nutrients['1092'] ?? nutrients['306'] ?? 0;
  const vitC = nutrients['1162'] ?? nutrients['401'] ?? 0;
  const vitA = nutrients['1106'] ?? nutrients['320'] ?? 0;
  const vitD = nutrients['1114'] ?? nutrients['324'] ?? 0;
  const cholesterol = nutrients['1257'] ?? nutrients['601'] ?? 0;

  return {
    foodName: food.description || 'USDA Food',
    aliases: food.additionalDescriptions ? [food.additionalDescriptions] : [],
    source: 'usda',
    servingSize: 100,
    servingUnit: 'g',
    densityGPerMl: 1.0,
    calories: Math.round(calories * 10) / 10,
    protein: Math.round(protein * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    saturatedFat: Math.round(saturatedFat * 10) / 10,
    unsaturatedFat: Math.max(0, Math.round((fat - saturatedFat) * 10) / 10),
    carbohydrates: Math.round(carbs * 10) / 10,
    fiber: Math.round(fiber * 10) / 10,
    sugar: Math.round(sugar * 10) / 10,
    vitaminA: Math.round(vitA * 10) / 10,
    vitaminB1: 0,
    vitaminB2: 0,
    vitaminB3: 0,
    vitaminB5: 0,
    vitaminB6: 0,
    vitaminB7: 0,
    vitaminB9: 0,
    vitaminB12: 0,
    vitaminC: Math.round(vitC * 10) / 10,
    vitaminD: Math.round(vitD * 10) / 10,
    vitaminE: 0,
    vitaminK: 0,
    calcium: Math.round(calcium * 10) / 10,
    iron: Math.round(iron * 10) / 10,
    magnesium: 0,
    potassium: Math.round(potassium * 10) / 10,
    sodium: Math.round(sodium * 10) / 10,
    zinc: 0,
    copper: 0,
    selenium: 0,
    manganese: 0,
    phosphorus: 0,
    cholesterol: Math.round(cholesterol * 10) / 10,
    omega3: 0,
    omega6: 0,
    water: 0,
    sourceReference: `USDA FDC ID: ${food.fdcId || 'N/A'} (Foundation/SR Legacy)`,
  };
}
