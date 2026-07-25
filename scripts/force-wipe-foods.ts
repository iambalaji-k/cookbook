import { db } from '../src/core/db';
import { sql } from 'drizzle-orm';
import { nutritionFoods } from '../src/core/db/schema';

async function forceWipe() {
  console.log('Fetching all rows in nutrition_foods directly...');
  const rows = await db.select().from(nutritionFoods);
  console.log(`Found ${rows.length} rows in nutrition_foods table.`);
  
  if (rows.length > 0) {
    console.log('Sample row ID:', rows[0].id, rows[0].foodName);
    console.log('Deleting all rows from nutrition_foods...');
    const result = await db.delete(nutritionFoods);
    console.log('Delete result:', result);
  }

  const remaining = await db.select().from(nutritionFoods);
  console.log(`Remaining rows in nutrition_foods: ${remaining.length}`);
}

forceWipe().catch(console.error);
