export interface MacroNutrients {
  calories: number;        // kcal
  protein: number;         // g
  fat: number;             // g
  saturatedFat: number;    // g
  unsaturatedFat: number;  // g
  carbohydrates: number;   // g
  fiber: number;           // g
  sugar: number;           // g
}

export interface VitaminNutrients {
  vitaminA: number;   // mcg RAE
  vitaminB1: number;  // mg
  vitaminB2: number;  // mg
  vitaminB3: number;  // mg
  vitaminB5: number;  // mg
  vitaminB6: number;  // mg
  vitaminB7: number;  // mcg
  vitaminB9: number;  // mcg
  vitaminB12: number; // mcg
  vitaminC: number;   // mg
  vitaminD: number;   // mcg
  vitaminE: number;   // mg
  vitaminK: number;   // mcg
}

export interface MineralNutrients {
  calcium: number;    // mg
  iron: number;       // mg
  magnesium: number;  // mg
  potassium: number;  // mg
  sodium: number;     // mg
  zinc: number;       // mg
  copper: number;     // mg
  selenium: number;   // mcg
  manganese: number;  // mg
  phosphorus: number; // mg
}

export interface OtherNutrients {
  cholesterol: number; // mg
  omega3: number;      // g
  omega6: number;      // g
  water: number;       // g
}

export interface FullNutritionProfile {
  macros: MacroNutrients;
  vitamins: VitaminNutrients;
  minerals: MineralNutrients;
  other: OtherNutrients;
}

export interface DailyValuePercentages {
  calories?: number;
  protein?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  fiber?: number;
  sugar?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  sodium?: number;
  magnesium?: number;
  zinc?: number;
}

export interface PhysicalConversionParameters {
  densityGPerMl?: number;
  pieceWeightG?: number;
  cupWeightG?: number;
  tbspWeightG?: number;
}

export interface NutritionFoodRecord extends FullNutritionProfile, PhysicalConversionParameters {
  id: string;
  foodName: string;
  aliases?: string[] | null;
  source: string;
  servingSize: number;
  servingUnit: string;
  sourceReference?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalMappingRecord {
  id: string;
  normalizedIngredientName: string;
  nutritionFoodId: string;
  confidenceScore: number;
  mappingMethod: 'manual' | 'ai_suggested' | 'auto_exact';
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeNutritionCalculationResult {
  recipeId: string;
  servings: number;
  nutritionCoveragePercent: number;
  mappedIngredientCount: number;
  totalIngredientCount: number;
  unmappedIngredients: string[];
  totalNutrition: FullNutritionProfile;
  perServingNutrition: FullNutritionProfile;
  dailyValuePercentages: DailyValuePercentages;
  calculatedAt: string;
  calculationVersion: string;
}
