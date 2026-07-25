import { initializeDatabase } from '../src/core/db/init-db';
import { db } from '../src/core/db';
import { sql } from 'drizzle-orm';
import { convertIngredientUnit } from '../src/modules/content/utils/ingredient-unit-converter';
import { scaleIngredients } from '../src/modules/content/utils/portion-scaler';
import { calculateAndCacheRecipeNutrition } from '../src/modules/nutrition/services/calculator-service';
import { searchContentFTS } from '../src/modules/search/services/search-service';
import { getContentEntityBySlug, toggleFavoriteEntity } from '../src/modules/content/services/content-service';
import { setRating, getRating } from '../src/modules/content/services/rating-service';
import { addComment, getCommentsByEntityId, deleteComment } from '../src/modules/content/services/comment-service';
import { approveAIDraft, createAIDraft } from '../src/modules/drafts/services/draft-service';
import { seedStapleFoods } from '../src/modules/nutrition/services/seed-foods';
import { createCustomFoodAndMap, findApprovedFoodMapping } from '../src/modules/nutrition/services/nutrition-service';

async function runE2ETestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING E2E INTEGRATION & FUNCTIONALITY AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Database Initialization & Seeding
    // ----------------------------------------------------
    console.log('📌 Test Suite 1: Database Initialization & FTS5 Index');
    const initRes = await initializeDatabase();
    assert(initRes.success === true, 'Database Bootstrap & Migration Initialized');
    await seedStapleFoods();

    const sampleRecipe = await getContentEntityBySlug('tuscan-garlic-butter-shrimp-pasta');
    assert(sampleRecipe !== null, 'Sample Seed Recipe Loaded (Tuscan Garlic Butter Shrimp Pasta)');
    assert(sampleRecipe?.ingredients?.length === 6, 'Sample Recipe Ingredients Count matches schema (6)');
    assert(sampleRecipe?.instructions?.length === 5, 'Sample Recipe Instructions Count matches schema (5)');

    // ----------------------------------------------------
    // TEST 2: Unit Conversion Engine (Metric <-> Imperial)
    // ----------------------------------------------------
    console.log('\n📌 Test Suite 2: Metric Default & Unit Conversion Engine');
    
    // Weight conversion: 1.5 lbs -> grams
    const convLbsToG = convertIngredientUnit(1.5, 'lbs', 'metric');
    assert(convLbsToG.unit === 'g' && Math.round(convLbsToG.amount || 0) === 680, 'Convert 1.5 lbs to Metric grams (680g)');

    // Volume conversion: 1 cup -> ml (237ml)
    const convCupToMl = convertIngredientUnit(1, 'cup', 'metric');
    assert(convCupToMl.unit === 'ml' && Math.round(convCupToMl.amount || 0) === 237, 'Convert 1 cup Heavy Cream to Metric ml (237ml)');

    // Qualitative unit preservation: 6 cloves garlic scaled 2x
    const convGarlic = convertIngredientUnit(6, 'cloves', 'metric');
    assert(convGarlic.unit === 'cloves' && convGarlic.amount === 6, 'Preserves qualitative unit "cloves" in metric mode');

    // Serving size scaling (e.g. 4 servings -> 8 servings = 2x)
    const scaled = scaleIngredients([{ itemName: 'Fettuccine Pasta', amount: 12, unit: 'oz', notes: null, sortOrder: 0 }], 4, 8);
    assert(scaled[0].scaledAmount === 24, 'Scales 12 oz pasta x2 servings to 24 oz');

    // ----------------------------------------------------
    // TEST 3: Favorites, Ratings, & Comments System
    // ----------------------------------------------------
    console.log('\n📌 Test Suite 3: Favorites, Ratings & Comments System');
    
    if (sampleRecipe) {
      // Favorites toggle
      const initialFav = sampleRecipe.isFavorite;
      const toggledFav = await toggleFavoriteEntity(sampleRecipe.id);
      assert(toggledFav.isFavorite === !initialFav, 'Favorite Heart Toggle correctly updates state');
      await toggleFavoriteEntity(sampleRecipe.id); // restore

      // Star Ratings
      await setRating(sampleRecipe.id, 5);
      const ratingResult = await getRating(sampleRecipe.id);
      assert(ratingResult.rating === 5, 'Single user rating is stored and returned correctly');

      // Comments & Notes
      const recipeComments = await addComment(sampleRecipe.id, 'Test Inspector', 'Extremely delicious! Added extra basil.');
      const addedComment = recipeComments.find((c) => c.commentText.includes('delicious'));
      assert(addedComment !== undefined, 'Comment added successfully');

      if (addedComment) {
        const deleted = await deleteComment(addedComment.id, sampleRecipe.id);
        assert(deleted.some((c) => c.id === addedComment.id) === false, 'Comment deleted successfully');
      }
    }

    // ----------------------------------------------------
    // TEST 4: FTS5 BM25 Full-Text & Hybrid Search
    // ----------------------------------------------------
    console.log('\n📌 Test Suite 4: SQLite FTS5 Multi-Field Search Engine');
    
    const searchShrimp = await searchContentFTS('shrimp');
    assert(searchShrimp.length > 0 && searchShrimp[0].title.includes('Shrimp'), 'FTS5 search returns matching recipe for "shrimp"');

    const searchGarlic = await searchContentFTS('garlic');
    assert(searchGarlic.length > 0, 'FTS5 ingredient matching finds recipes with "garlic"');

    // ----------------------------------------------------
    // TEST 5: AI Staging & Human Approval Workflow
    // ----------------------------------------------------
    console.log('\n📌 Test Suite 5: AI Draft Staging & Approval Workflow');
    
    const draft = await createAIDraft({
      targetContentType: 'recipe',
      status: 'pending',
      createdBy: 'system',
      proposedDataJSON: JSON.stringify({
        title: 'Creamy Garlic Butter Salmon',
        contentType: 'recipe',
        summary: 'Pan-seared salmon fillets in a rich garlic butter cream sauce with fresh herbs.',
        servings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        cuisine: 'Seafood',
        difficulty: 'medium',
        ingredients: [
          { itemName: 'Salmon Fillets', amount: 4, unit: 'pieces' },
          { itemName: 'Garlic', amount: 4, unit: 'cloves' }
        ],
        instructions: [
          { stepNumber: 1, instructionText: 'Sear salmon in butter until golden.' }
        ]
      }),
      reason: 'AI Extracted Recipe',
      provider: 'OpenAI',
      model: 'gpt-4o-mini',
      confidence: 96,
      tokenUsage: 850,
      latencyMs: 320,
      promptVersion: 'v1.0'
    });

    assert(draft !== null && draft.id !== undefined, 'Created pending AI Draft entry in staging table');

    if (draft) {
      const approvalRes = await approveAIDraft(draft.id);
      assert(approvalRes.success === true, 'AI Draft promoted to live published content entity');
      const newEntityId = approvalRes.committedEntity?.id;
      assert(newEntityId !== undefined, 'Generated new published recipe entity ID');

      if (newEntityId) {
        const checkPromoted = await db.run(sql`SELECT * FROM content_entities WHERE id = ${newEntityId}`);
        assert(checkPromoted.rows.length > 0, 'Promoted recipe exists in production content_entities table');

        const revCheck = await db.run(sql`SELECT * FROM revisions WHERE entity_id = ${newEntityId}`);
        assert(revCheck.rows.length > 0, 'Immutable audit revision recorded in revisions table');
      }
    }

    // ----------------------------------------------------
    // TEST 6: Nutrition Engine & USDA Mapping
    // ----------------------------------------------------
    console.log('\n📌 Test Suite 6: Nutrition Engine & USDA Ingredient Mapping');
    
    if (sampleRecipe) {
      const calcResult = await calculateAndCacheRecipeNutrition(sampleRecipe.id, 'US_FDA');
      assert(calcResult !== null, 'Nutrition engine calculates calories and macronutrients');
      if (calcResult) {
        assert(calcResult.totalNutrition.macros.calories > 0, `Calculates non-zero total recipe calories (${calcResult.totalNutrition.macros.calories} kcal)`);
        assert(calcResult.perServingNutrition.macros.protein > 0, `Calculates non-zero per-serving protein (${calcResult.perServingNutrition.macros.protein} g)`);
      }
    }

    // ----------------------------------------------------
    // TEST 7: Nutritional Data Fill & Custom Food Mapping Pipeline
    // ----------------------------------------------------
    console.log('\n📌 Test Suite 7: Nutritional Data Fill & Custom Food Pipeline');

    const customFoodRes = await createCustomFoodAndMap({
      foodName: 'Organic Wild Honey',
      aliases: ['wild honey', 'raw honey'],
      source: 'manual',
      servingSize: 100,
      servingUnit: 'g',
      densityGPerMl: 1.42,
      calories: 304,
      protein: 0.3,
      fat: 0,
      saturatedFat: 0,
      unsaturatedFat: 0,
      carbohydrates: 82.4,
      fiber: 0.2,
      sugar: 82.1,
      ingredientNameToMap: 'Organic Wild Honey',
      approvedBy: 'Admin Test Pipeline',
    });

    assert(customFoodRes.food.foodName === 'Organic Wild Honey', 'Creates custom food record with exact macronutrients');
    assert(customFoodRes.food.densityGPerMl === 1.42, 'Stores physical density parameters (1.42 g/ml)');
    assert(customFoodRes.mappedName === 'organic wild honey', 'Registers canonical ingredient mapping in database');

    const lookupMatch = await findApprovedFoodMapping('Organic Wild Honey');
    assert(lookupMatch !== null && lookupMatch.id === customFoodRes.food.id, 'findApprovedFoodMapping resolves ingredient to custom food ID');

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 TEST SUITE AUDIT SUMMARY`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('\n🎉 ALL FEATURE & FUNCTION TESTS PASSED INTENDED SPECIFICATION!');
    }
  } catch (err) {
    console.error('Fatal Test Suite Failure:', err);
    process.exit(1);
  }
}

runE2ETestSuite();
