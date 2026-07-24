export interface ConvertedIngredient {
  amount: number | null;
  unit: string | null;
  displayString: string;
}

/**
 * Normalizes unit string for lookup.
 */
function normalizeUnit(unit?: string | null): string {
  if (!unit) return '';
  return unit.trim().toLowerCase().replace(/\.$/, '');
}

/**
 * Converts ingredient amount and unit between Metric and Imperial systems.
 */
export function convertIngredientUnit(
  amount: number | null,
  unit: string | null,
  targetSystem: 'metric' | 'imperial' = 'metric'
): ConvertedIngredient {
  if (amount === null || amount === undefined || !unit) {
    return {
      amount,
      unit,
      displayString: amount !== null ? `${amount} ${unit || ''}`.trim() : (unit || ''),
    };
  }

  const normalized = normalizeUnit(unit);

  if (targetSystem === 'metric') {
    // Imperial -> Metric conversions
    switch (normalized) {
      // Weight
      case 'oz':
      case 'ounce':
      case 'ounces': {
        const grams = Math.round(amount * 28.3495);
        if (grams >= 1000) {
          const kg = Math.round((grams / 1000) * 100) / 100;
          return { amount: kg, unit: 'kg', displayString: `${kg} kg` };
        }
        return { amount: grams, unit: 'g', displayString: `${grams} g` };
      }
      case 'lb':
      case 'lbs':
      case 'pound':
      case 'pounds': {
        const grams = Math.round(amount * 453.592);
        if (grams >= 1000) {
          const kg = Math.round((grams / 1000) * 100) / 100;
          return { amount: kg, unit: 'kg', displayString: `${kg} kg` };
        }
        return { amount: grams, unit: 'g', displayString: `${grams} g` };
      }

      // Volume
      case 'cup':
      case 'cups': {
        const ml = Math.round(amount * 236.588);
        if (ml >= 1000) {
          const l = Math.round((ml / 1000) * 100) / 100;
          return { amount: l, unit: 'l', displayString: `${l} L` };
        }
        return { amount: ml, unit: 'ml', displayString: `${ml} ml` };
      }
      case 'tbsp':
      case 'tablespoon':
      case 'tablespoons': {
        const ml = Math.round(amount * 14.7868);
        return { amount: ml, unit: 'ml', displayString: `${ml} ml` };
      }
      case 'tsp':
      case 'teaspoon':
      case 'teaspoons': {
        const ml = Math.round(amount * 4.92892);
        return { amount: ml, unit: 'ml', displayString: `${ml} ml` };
      }
      case 'fl oz':
      case 'fluid oz':
      case 'fluid ounce':
      case 'fluid ounces': {
        const ml = Math.round(amount * 29.5735);
        return { amount: ml, unit: 'ml', displayString: `${ml} ml` };
      }

      // Length
      case 'in':
      case 'inch':
      case 'inches': {
        const cm = Math.round(amount * 2.54 * 10) / 10;
        return { amount: cm, unit: 'cm', displayString: `${cm} cm` };
      }

      // Temperature
      case '°f':
      case 'f':
      case 'fahrenheit': {
        const celsius = Math.round(((amount - 32) * 5) / 9);
        return { amount: celsius, unit: '°C', displayString: `${celsius}°C` };
      }

      default:
        return { amount, unit, displayString: `${amount} ${unit}`.trim() };
    }
  } else {
    // Metric -> Imperial conversions
    switch (normalized) {
      // Weight
      case 'g':
      case 'gram':
      case 'grams': {
        const oz = Math.round((amount / 28.3495) * 10) / 10;
        return { amount: oz, unit: 'oz', displayString: `${oz} oz` };
      }
      case 'kg':
      case 'kilogram':
      case 'kilograms': {
        const lbs = Math.round((amount * 2.20462) * 10) / 10;
        return { amount: lbs, unit: 'lbs', displayString: `${lbs} lbs` };
      }

      // Volume
      case 'ml':
      case 'milliliter':
      case 'milliliters': {
        if (amount >= 240) {
          const cups = Math.round((amount / 236.588) * 100) / 100;
          return { amount: cups, unit: 'cups', displayString: `${cups} cups` };
        }
        if (amount >= 15) {
          const tbsp = Math.round((amount / 14.7868) * 10) / 10;
          return { amount: tbsp, unit: 'tbsp', displayString: `${tbsp} tbsp` };
        }
        const tsp = Math.round((amount / 4.92892) * 10) / 10;
        return { amount: tsp, unit: 'tsp', displayString: `${tsp} tsp` };
      }
      case 'l':
      case 'liter':
      case 'liters': {
        const cups = Math.round((amount * 4.22675) * 10) / 10;
        return { amount: cups, unit: 'cups', displayString: `${cups} cups` };
      }

      // Length
      case 'cm':
      case 'centimeter':
      case 'centimeters': {
        const inches = Math.round((amount / 2.54) * 10) / 10;
        return { amount: inches, unit: 'in', displayString: `${inches} in` };
      }

      // Temperature
      case '°c':
      case 'c':
      case 'celsius': {
        const fahrenheit = Math.round((amount * 9) / 5 + 32);
        return { amount: fahrenheit, unit: '°F', displayString: `${fahrenheit}°F` };
      }

      default:
        return { amount, unit, displayString: `${amount} ${unit}`.trim() };
    }
  }
}
