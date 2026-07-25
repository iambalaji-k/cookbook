import { FullNutritionProfile, DailyValuePercentages } from '../types/nutrition.types';

export type DVProfile = 'US_FDA' | 'EFSA' | 'WHO' | 'ICMR_INDIA';

export interface RecommendedDailyAllowances {
  calories: number;        // kcal
  protein: number;         // g
  fat: number;             // g
  saturatedFat: number;    // g
  carbohydrates: number;   // g
  fiber: number;           // g
  addedSugar?: number;     // g
  vitaminA: number;        // mcg RAE
  vitaminC: number;        // mg
  vitaminD: number;        // mcg
  calcium: number;         // mg
  iron: number;            // mg
  potassium: number;       // mg
  sodium: number;          // mg
  magnesium: number;       // mg
  zinc: number;            // mg
}

export const DAILY_VALUE_PROFILES: Record<DVProfile, RecommendedDailyAllowances> = {
  US_FDA: {
    calories: 2000,
    protein: 50,
    fat: 78,
    saturatedFat: 20,
    carbohydrates: 275,
    fiber: 28,
    addedSugar: 50,
    vitaminA: 900,
    vitaminC: 90,
    vitaminD: 20,
    calcium: 1300,
    iron: 18,
    potassium: 4700,
    sodium: 2300,
    magnesium: 420,
    zinc: 11,
  },
  EFSA: {
    calories: 2000,
    protein: 50,
    fat: 70,
    saturatedFat: 20,
    carbohydrates: 260,
    fiber: 25,
    vitaminA: 800,
    vitaminC: 80,
    vitaminD: 15,
    calcium: 1000,
    iron: 14,
    potassium: 3500,
    sodium: 2000,
    magnesium: 350,
    zinc: 10,
  },
  WHO: {
    calories: 2000,
    protein: 50,
    fat: 65,
    saturatedFat: 20,
    carbohydrates: 275,
    fiber: 25,
    vitaminA: 800,
    vitaminC: 75,
    vitaminD: 15,
    calcium: 1000,
    iron: 14,
    potassium: 3510,
    sodium: 2000,
    magnesium: 300,
    zinc: 10,
  },
  ICMR_INDIA: {
    calories: 2110,
    protein: 54,
    fat: 67,
    saturatedFat: 20,
    carbohydrates: 275,
    fiber: 30,
    vitaminA: 1000,
    vitaminC: 80,
    vitaminD: 15,
    calcium: 1000,
    iron: 19,
    potassium: 3500,
    sodium: 2000,
    magnesium: 440,
    zinc: 13.2,
  },
};

/**
 * Calculates Daily Value Percentages (% DV) for a given nutrition profile.
 */
export function calculateDailyValuePercentages(
  profile: FullNutritionProfile,
  dvProfileKey: DVProfile = 'US_FDA'
): DailyValuePercentages {
  const rda = DAILY_VALUE_PROFILES[dvProfileKey] || DAILY_VALUE_PROFILES.US_FDA;

  const calculatePercent = (val: number, ref: number) => {
    if (!ref || ref <= 0) return 0;
    return Math.round((val / ref) * 100);
  };

  return {
    calories: calculatePercent(profile?.macros?.calories || 0, rda.calories),
    protein: calculatePercent(profile?.macros?.protein || 0, rda.protein),
    fat: calculatePercent(profile?.macros?.fat || 0, rda.fat),
    saturatedFat: calculatePercent(profile?.macros?.saturatedFat || 0, rda.saturatedFat),
    carbohydrates: calculatePercent(profile?.macros?.carbohydrates || 0, rda.carbohydrates),
    fiber: calculatePercent(profile?.macros?.fiber || 0, rda.fiber),
    sugar: calculatePercent(profile?.macros?.sugar || 0, rda.addedSugar || 50),
    vitaminA: calculatePercent(profile?.vitamins?.vitaminA || 0, rda.vitaminA),
    vitaminC: calculatePercent(profile?.vitamins?.vitaminC || 0, rda.vitaminC),
    vitaminD: calculatePercent(profile?.vitamins?.vitaminD || 0, rda.vitaminD),
    calcium: calculatePercent(profile?.minerals?.calcium || 0, rda.calcium),
    iron: calculatePercent(profile?.minerals?.iron || 0, rda.iron),
    potassium: calculatePercent(profile?.minerals?.potassium || 0, rda.potassium),
    sodium: calculatePercent(profile?.minerals?.sodium || 0, rda.sodium),
    magnesium: calculatePercent(profile?.minerals?.magnesium || 0, rda.magnesium),
    zinc: calculatePercent(profile?.minerals?.zinc || 0, rda.zinc),
  };
}
