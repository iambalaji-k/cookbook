/**
 * Specialized Recipe Extractor System Prompt & Few-Shot Template
 */
export const RECIPE_EXTRACTOR_SYSTEM_PROMPT = `You are a world-class culinary data architect and recipe parser.
Your task is to convert unadulterated raw text (recipe blog post, OCR scan, web dump) into a cleanly structured JSON object.

CRITICAL FIELD STRUCTURING RULES:
1. INGREDIENTS MUST BE SEPARATED INTO STRICT FIELDS:
   - "amount": NUMERIC VALUE ONLY (e.g. 2, 0.5, 1.5, 12). MUST NOT BE NULL if a quantity is mentioned. NEVER put numbers inside "itemName".
   - "unit": MEASUREMENT UNIT ONLY (e.g. "cup", "cups", "tbsp", "tsp", "lb", "lbs", "oz", "g", "cloves", "pinch"). If items are counted whole (e.g. 2 eggs), set "unit" to "".
   - "itemName": PURE INGREDIENT NAME ONLY (e.g. "Heavy Cream", "Garlic", "Fettuccine Pasta", "Olive Oil"). DO NOT INCLUDE QUANTITIES OR UNITS IN "itemName".
   - "notes": PREPARATION INSTRUCTION ONLY (e.g. "minced", "diced", "chopped", "room temperature").

2. TIMINGS & METRICS MUST BE NUMERIC IN MINUTES:
   - "prepTimeMinutes": INTEGER IN MINUTES (e.g. 15). Infer from text if not stated (e.g., chopping/marinating = 15).
   - "cookTimeMinutes": INTEGER IN MINUTES (e.g. 25). Infer from cooking steps if not explicitly stated.
   - "servings": INTEGER PORTIONS (e.g. 4). Default to 4 if unspecified.

3. INSTRUCTIONS MUST BE SEQUENTIAL:
   - Each instruction step MUST include "stepNumber" (1, 2, 3...) and clear "instructionText".

EXPECTED JSON SCHEMA FORMAT EXAMPLE:
{
  "title": "Tuscan Garlic Butter Shrimp",
  "contentType": "recipe",
  "summary": "Succulent shrimp sautéed in rich garlic butter with sun-dried tomatoes and spinach.",
  "servings": 4,
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 15,
  "cuisine": "Italian",
  "difficulty": "easy",
  "ingredients": [
    { "amount": 1.5, "unit": "lbs", "itemName": "Large Shrimp", "notes": "peeled and deveined" },
    { "amount": 6, "unit": "cloves", "itemName": "Garlic", "notes": "minced finely" },
    { "amount": 1, "unit": "cup", "itemName": "Heavy Cream", "notes": "" }
  ],
  "instructions": [
    { "stepNumber": 1, "instructionText": "Bring a large pot of salted water to a boil.", "timerMinutes": 10 },
    { "stepNumber": 2, "instructionText": "Melt butter in a large skillet over medium-high heat.", "timerMinutes": 2 }
  ],
  "tags": ["Italian", "Seafood", "Quick Dinner"]
}

Return ONLY the valid JSON object without markdown fences or extra commentary.`;

/**
 * Regex helper to clean & split any merged ingredient string if LLM returns merged text
 * e.g. "2 1/2 cups heavy cream, minced" -> amount: 2.5, unit: "cups", itemName: "heavy cream", notes: "minced"
 */
export function normalizeIngredientObject(raw: any) {
  if (typeof raw === 'string') {
    return parseMergedIngredientString(raw);
  }

  let itemName = String(raw.itemName || '').trim();
  let amount = raw.amount !== undefined && raw.amount !== null ? Number(raw.amount) : null;
  let unit = String(raw.unit || '').trim();
  let notes = String(raw.notes || '').trim();

  // If amount or unit is missing or numbers are stuck in itemName, attempt regex parsing
  if ((!amount || !unit) && itemName && /\d/.test(itemName)) {
    const parsed = parseMergedIngredientString(itemName);
    if (parsed.amount) amount = parsed.amount;
    if (parsed.unit) unit = parsed.unit;
    if (parsed.itemName) itemName = parsed.itemName;
    if (parsed.notes && !notes) notes = parsed.notes;
  }

  return {
    itemName: itemName || 'Ingredient',
    amount: amount || null,
    unit: unit || '',
    notes: notes || '',
  };
}

function parseMergedIngredientString(str: string) {
  let text = str.trim();
  let notes = '';

  // Extract notes in parentheses or after comma
  if (text.includes(',')) {
    const parts = text.split(',');
    text = parts[0].trim();
    notes = parts.slice(1).join(',').trim();
  }

  // Regex for leading quantities & units (e.g. "1.5 cups", "2 tbsp", "1/2 tsp", "5")
  const match = text.match(/^([\d\/\.\s]+)?\s*(tbsp|tsp|cup|cups|oz|lb|lbs|g|kg|ml|clove|cloves|pinch|dash|slice|slices|can|cans)?\s*(.*)$/i);

  if (match) {
    const rawQty = (match[1] || '').trim();
    const rawUnit = (match[2] || '').trim();
    const rawItem = (match[3] || '').trim();

    let amount: number | null = null;
    if (rawQty) {
      if (rawQty.includes('/')) {
        const [num, den] = rawQty.split('/').map(Number);
        amount = den ? num / den : Number(num);
      } else {
        amount = Number(rawQty) || null;
      }
    }

    return {
      amount,
      unit: rawUnit,
      itemName: rawItem || text,
      notes,
    };
  }

  return { amount: null, unit: '', itemName: text, notes };
}
