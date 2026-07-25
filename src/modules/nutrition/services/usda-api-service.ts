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

  const r1 = (n: number) => Math.round(n * 10) / 10;
  const r3 = (n: number) => Math.round(n * 1000) / 1000;

  return {
    foodName: food.description || 'USDA Food',
    aliases: food.additionalDescriptions ? [food.additionalDescriptions] : [],
    source: 'usda',
    servingSize: 100,
    servingUnit: 'g',
    densityGPerMl: 1.0,
    calories: r1(calories),
    protein: r1(protein),
    fat: r1(fat),
    saturatedFat: r1(saturatedFat),
    unsaturatedFat: Math.max(0, r1(fat - saturatedFat)),
    carbohydrates: r1(carbs),
    fiber: r1(fiber),
    sugar: r1(sugar),
    vitaminA: r3(vitA),
    vitaminB1: r3(vitB1),
    vitaminB2: r3(vitB2),
    vitaminB3: r3(vitB3),
    vitaminB5: r3(vitB5),
    vitaminB6: r3(vitB6),
    vitaminB7: r3(vitB7),
    vitaminB9: r3(vitB9),
    vitaminB12: r3(vitB12),
    vitaminC: r1(vitC),
    vitaminD: r3(vitD),
    vitaminE: r3(vitE),
    vitaminK: r3(vitK),
    calcium: r1(calcium),
    iron: r3(iron),
    magnesium: r1(magnesium),
    potassium: r1(potassium),
    sodium: r1(sodium),
    zinc: r3(zinc),
    copper: r3(copper),
    selenium: r3(selenium),
    manganese: r3(manganese),
    phosphorus: r1(phosphorus),
    cholesterol: r1(cholesterol),
    omega3: r3(omega3),
    omega6: r3(omega6),
    water: r1(water),
    sourceReference: `USDA FDC ID: ${food.fdcId || 'N/A'} (Foundation/SR Legacy)`,
  };
}
