import { PhysicalConversionParameters } from '../types/nutrition.types';

/**
 * Normalizes unit strings for robust matching.
 */
export function normalizeUnitString(unit: string | null | undefined): string {
  if (!unit) return '';
  return unit
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .replace(/s$/, ''); // trim, lowercase, strip dots, remove trailing 's'
}

/**
 * Standard default weight in grams for common countable item units (fallback when food record doesn't specify pieceWeightG).
 */
const DEFAULT_PIECE_WEIGHTS: Record<string, number> = {
  clove: 3,        // 1 clove garlic = ~3g
  head: 150,       // 1 head garlic/lettuce = ~150g
  bunch: 100,      // 1 bunch herbs/spinach = ~100g
  pinch: 0.5,      // 1 pinch salt/spice = ~0.5g
  dash: 0.8,       // 1 dash = ~0.8g
  can: 400,        // 1 standard can = ~400g
  slice: 30,       // 1 slice bread/cheese = ~30g
  stalk: 40,       // 1 celery stalk = ~40g
  sprig: 2,        // 1 sprig thyme/rosemary = ~2g
  leaf: 1,         // 1 bay leaf/basil leaf = ~1g
  piece: 50,       // 1 generic piece = ~50g
  item: 50,
};

/**
 * Converts a given quantity and unit to mass in grams (g).
 * Uses physical parameters from the target food record (density, cup weight, piece weight) when available.
 */
export function convertQuantityToGrams(
  amount: number | null | undefined,
  unit: string | null | undefined,
  foodParams?: PhysicalConversionParameters | null
): { grams: number; isEstimated: boolean; warning?: string } {
  const qty = amount && amount > 0 ? amount : 1;
  const normUnit = normalizeUnitString(unit);

  // 1. If unit is empty / unspecified -> assume piece count or grams
  if (!normUnit) {
    if (foodParams?.pieceWeightG) {
      return { grams: qty * foodParams.pieceWeightG, isEstimated: false };
    }
    return { grams: qty, isEstimated: true, warning: 'Unspecified unit; assumed grams.' };
  }

  // 2. Direct Mass Conversions
  switch (normUnit) {
    case 'g':
    case 'gram':
      return { grams: qty, isEstimated: false };
    case 'kg':
    case 'kilogram':
      return { grams: qty * 1000, isEstimated: false };
    case 'oz':
    case 'ounce':
      return { grams: qty * 28.3495, isEstimated: false };
    case 'lb':
    case 'pound':
      return { grams: qty * 453.592, isEstimated: false };
  }

  // 3. Volume Conversions (Using food-specific density / cup/tbsp weights)
  const density = foodParams?.densityGPerMl || 1.0; // fallback liquid density 1.0 g/ml

  if (normUnit === 'cup') {
    if (foodParams?.cupWeightG) {
      return { grams: qty * foodParams.cupWeightG, isEstimated: false };
    }
    // 1 US cup = 236.588 ml
    return { grams: qty * 236.588 * density, isEstimated: !foodParams?.densityGPerMl };
  }

  if (normUnit === 'tbsp' || normUnit === 'tablespoon') {
    if (foodParams?.tbspWeightG) {
      return { grams: qty * foodParams.tbspWeightG, isEstimated: false };
    }
    // 1 tbsp = 14.787 ml
    return { grams: qty * 14.787 * density, isEstimated: !foodParams?.densityGPerMl };
  }

  if (normUnit === 'tsp' || normUnit === 'teaspoon') {
    // 1 tsp = 4.929 ml
    return { grams: qty * 4.929 * density, isEstimated: !foodParams?.densityGPerMl };
  }

  if (normUnit === 'ml' || normUnit === 'milliliter') {
    return { grams: qty * density, isEstimated: !foodParams?.densityGPerMl };
  }

  if (normUnit === 'l' || normUnit === 'liter') {
    return { grams: qty * 1000 * density, isEstimated: !foodParams?.densityGPerMl };
  }

  if (normUnit === 'fl oz' || normUnit === 'fluid ounce') {
    // 1 fl oz = 29.5735 ml
    return { grams: qty * 29.5735 * density, isEstimated: !foodParams?.densityGPerMl };
  }

  if (normUnit === 'pt' || normUnit === 'pint') {
    return { grams: qty * 473.176 * density, isEstimated: !foodParams?.densityGPerMl };
  }

  if (normUnit === 'qt' || normUnit === 'quart') {
    return { grams: qty * 946.353 * density, isEstimated: !foodParams?.densityGPerMl };
  }

  // 4. Count / Piece Unit Conversions
  if (foodParams?.pieceWeightG) {
    return { grams: qty * foodParams.pieceWeightG, isEstimated: false };
  }

  if (DEFAULT_PIECE_WEIGHTS[normUnit]) {
    return { grams: qty * DEFAULT_PIECE_WEIGHTS[normUnit], isEstimated: true };
  }

  // 5. Fallback Default
  return { grams: qty, isEstimated: true, warning: `Unrecognized unit "${unit}"; treated as grams.` };
}
