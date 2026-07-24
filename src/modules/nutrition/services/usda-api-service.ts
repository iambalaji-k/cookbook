import { CreateFoodInput } from '../validation/nutrition-schema';

/**
 * USDA FoodData Central (FDC) API Integration
 * API Guide: https://fdc.nal.usda.gov/api-guide.html
 */
interface USDANutrient {
  nutrientNumber?: string | number;
  nutrientId?: string | number;
  value?: number;
  amount?: number;
}

interface USDAFood {
  fdcId?: number;
  description?: string;
  additionalDescriptions?: string;
  foodNutrients?: USDANutrient[];
}

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

    return data.foods.map((food: USDAFood) => mapUSDAFoodToRecord(food));
  } catch (error) {
    console.error('Error querying USDA FoodData Central API:', error);
    throw error;
  }
}

/**
 * Maps USDA FDC Food item JSON response to our standard 100g CreateFoodInput format.
 */
function mapUSDAFoodToRecord(food: USDAFood): CreateFoodInput {
  const nutrients: Record<string, number> = {};

  if (food.foodNutrients && Array.isArray(food.foodNutrients)) {
    food.foodNutrients.forEach((n: USDANutrient) => {
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
  const vitB1 = nutrients['1165'] ?? nutrients['404'] ?? 0;
  const vitB2 = nutrients['1166'] ?? nutrients['405'] ?? 0;
  const vitB3 = nutrients['1167'] ?? nutrients['406'] ?? 0;
  const vitB5 = nutrients['1170'] ?? nutrients['410'] ?? 0;
  const vitB6 = nutrients['1175'] ?? nutrients['415'] ?? 0;
  const vitB7 = nutrients['1176'] ?? nutrients['416'] ?? 0;
  const vitB9 = nutrients['1187'] ?? nutrients['417'] ?? 0;
  const vitB12 = nutrients['1178'] ?? nutrients['418'] ?? 0;
  const vitE = nutrients['1109'] ?? nutrients['323'] ?? 0;
  const vitK = nutrients['1185'] ?? nutrients['430'] ?? 0;
  const magnesium = nutrients['1090'] ?? nutrients['304'] ?? 0;
  const zinc = nutrients['1095'] ?? nutrients['309'] ?? 0;
  const copper = nutrients['1098'] ?? nutrients['312'] ?? 0;
  const selenium = nutrients['1103'] ?? nutrients['317'] ?? 0;
  const manganese = nutrients['1101'] ?? nutrients['315'] ?? 0;
  const phosphorus = nutrients['1091'] ?? nutrients['305'] ?? 0;
  const omega3 = nutrients['1404'] ?? nutrients['851'] ?? 0;
  const omega6 = nutrients['1406'] ?? nutrients['853'] ?? 0;
  const water = nutrients['1051'] ?? nutrients['255'] ?? 0;

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
    vitaminB1: Math.round(vitB1 * 10) / 10,
    vitaminB2: Math.round(vitB2 * 10) / 10,
    vitaminB3: Math.round(vitB3 * 10) / 10,
    vitaminB5: Math.round(vitB5 * 10) / 10,
    vitaminB6: Math.round(vitB6 * 10) / 10,
    vitaminB7: Math.round(vitB7 * 10) / 10,
    vitaminB9: Math.round(vitB9 * 10) / 10,
    vitaminB12: Math.round(vitB12 * 10) / 10,
    vitaminC: Math.round(vitC * 10) / 10,
    vitaminD: Math.round(vitD * 10) / 10,
    vitaminE: Math.round(vitE * 10) / 10,
    vitaminK: Math.round(vitK * 10) / 10,
    calcium: Math.round(calcium * 10) / 10,
    iron: Math.round(iron * 10) / 10,
    magnesium: Math.round(magnesium * 10) / 10,
    potassium: Math.round(potassium * 10) / 10,
    sodium: Math.round(sodium * 10) / 10,
    zinc: Math.round(zinc * 10) / 10,
    copper: Math.round(copper * 10) / 10,
    selenium: Math.round(selenium * 10) / 10,
    manganese: Math.round(manganese * 10) / 10,
    phosphorus: Math.round(phosphorus * 10) / 10,
    cholesterol: Math.round(cholesterol * 10) / 10,
    omega3: Math.round(omega3 * 10) / 10,
    omega6: Math.round(omega6 * 10) / 10,
    water: Math.round(water * 10) / 10,
    sourceReference: `USDA FDC ID: ${food.fdcId || 'N/A'} (Foundation/SR Legacy)`,
  };
}
