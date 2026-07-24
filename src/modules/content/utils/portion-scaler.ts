export interface ScaledIngredient {
  id?: string;
  itemName: string;
  originalAmount: number | null;
  scaledAmount: number | null;
  unit: string | null;
  notes: string | null;
  sortOrder: number;
}

/**
 * Dynamically scales ingredient amounts based on original and target serving counts.
 */
export function scaleIngredients(
  ingredients: Array<{
    id?: string;
    itemName: string;
    amount: number | null;
    unit: string | null;
    notes: string | null;
    sortOrder: number;
  }>,
  originalServings: number,
  targetServings: number
): ScaledIngredient[] {
  if (originalServings <= 0 || targetServings <= 0) {
    return ingredients.map((ing) => ({
      ...ing,
      originalAmount: ing.amount,
      scaledAmount: ing.amount,
    }));
  }

  const factor = targetServings / originalServings;

  return ingredients.map((ing) => {
    let scaled: number | null = null;
    if (ing.amount !== null && ing.amount !== undefined) {
      scaled = Math.round(ing.amount * factor * 100) / 100;
    }

    return {
      id: ing.id,
      itemName: ing.itemName,
      originalAmount: ing.amount,
      scaledAmount: scaled,
      unit: ing.unit,
      notes: ing.notes,
      sortOrder: ing.sortOrder,
    };
  });
}

export function scaleIngredientPortion(
  amount: number | null,
  originalServings: number,
  targetServings: number
): number | null {
  if (amount === null || amount === undefined || originalServings <= 0 || targetServings <= 0) return amount;
  const factor = targetServings / originalServings;
  return Math.round(amount * factor * 100) / 100;
}
