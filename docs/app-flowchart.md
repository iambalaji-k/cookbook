# 🍳 Culinary AI Cookbook — Complete Process Flowchart

## Overview

A Next.js 16 family cookbook application with an AI staging pipeline, nutrition engine, unit conversion, and kitchen cooking mode. All data is stored in SQLite/Turso via Drizzle ORM.

---

## 1. Application Architecture & Startup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 16 App Router                     │
│                           (Turbopack)                            │
├─────────────────────────────────────────────────────────────────┤
│  Root Layout (src/app/layout.tsx)                               │
│  ├── <Header /> — Top bar with AI Gateway status                │
│  ├── <Sidebar /> — Nav: Dashboard, Content, Nutrition,          │
│  │                 Imports, Drafts, Search, Settings            │
│  └── <main> — Dashboard pages render here                       │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Initialization                        │
│                   (src/core/db/init-db.ts)                        │
└─────────────────────────────────────────────────────────────────┘
          │
          ├── 1. CREATE TABLE IF NOT EXISTS — 14 tables
          │   (content_entities, ingredients, instructions, images,
          │    tags, revisions, raw_imports, ai_drafts, ratings,
          │    comments, system_settings, ai_provider_settings,
          │    nutrition_foods, canonical_ingredient_nutrition_map,
          │    ingredient_synonyms, recipe_nutrition_cache)
          │
          ├── 2. ALTER TABLE migrations (graceful column adds)
          │
          ├── 3. CREATE VIRTUAL TABLE content_fts (FTS5)
          │
          ├── 4. Bootstrap system_settings (dark, metric, PWA, fts5)
          │
          ├── 5. Bootstrap ai_provider_settings (openai, gpt-4o-mini)
          │
          ├── 6. Seed 15 staple foods + canonical mappings + synonyms
          │
          ├── 7. Seed sample recipe (Tuscan Garlic Butter Shrimp Pasta)
          │   ├── 6 ingredients, 5 instructions, 4 tags
          │   ├── 1 rating (5★), 2 comments
          │   └── FTS index sync
          │
          └── 8. Backfill AI metadata for existing recipes
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Dashboard Page (/)                          │
│  Calls initializeDatabase() on every request                    │
│  Shows stats: content count, drafts, imports, revisions         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema (Entity-Relationship)

```
content_entities (POLYMORPHIC BASE)
├── id (PK, UUID)
├── content_type: recipe|technique|ingredient_guide|sauce|spice_blend|kitchen_tip
├── title, slug (UNIQUE), summary, status
├── servings, prep_time_minutes, cook_time_minutes
├── cuisine, difficulty, image_url
├── is_favorite (BOOLEAN)
├── AI METADATA: ai_provider, ai_model, ai_latency_ms, ai_token_usage,
│   ai_confidence, ai_prompt_version, ai_reasoning_summary, ai_timestamp
├── created_at, updated_at
│
├── 1:N ── ingredients
│   ├── id (PK), entity_id (FK CASCADE)
│   ├── item_name, amount (REAL), unit, notes, sort_order
│
├── 1:N ── instructions
│   ├── id (PK), entity_id (FK CASCADE)
│   ├── step_number, instruction_text, timer_minutes
│
├── 1:N ── images
│   ├── id (PK), entity_id (FK CASCADE)
│   ├── image_url, caption, is_primary (BOOLEAN)
│
├── 1:N ── tags
│   ├── id (PK), entity_id (FK CASCADE)
│   ├── tag_name
│
├── 1:N ── revisions (IMMUTABLE AUDIT TRAIL)
│   ├── id (PK), entity_id (FK CASCADE)
│   ├── entity_type, revision_number, snapshot_json (FULL ENTITY)
│   ├── change_summary, approved_by, approved_at, created_at
│
├── 1:N ── ratings
│   ├── id (PK), entity_id (FK CASCADE)
│   ├── rating (1-5), user_identifier, created_at
│
└── 1:N ── comments
    ├── id (PK), entity_id (FK CASCADE)
    ├── author, comment_text, created_at

raw_imports
├── id (PK), source_type: url|ocr_image|pdf|plain_text|transcript
├── source_url, raw_payload (TEXT), metadata_json, status
└── created_at

ai_drafts (STAGING TABLE)
├── id (PK), raw_import_id (FK), entity_id (FK, nullable)
├── target_content_type, proposed_data_json (TEXT)
├── reason, provider, model, confidence (0-100)
├── token_usage, latency_ms, prompt_version
├── created_by, status: pending|approved|rejected
├── rejection_reason, created_at, updated_at

system_settings
├── theme: dark|light, unit_system: metric|imperial
├── pwa_enabled, default_language, search_mode: fts5|hybrid
└── updated_at

ai_provider_settings
├── provider, base_url, api_key, model, temperature
├── prompt_version, updated_at

nutrition_foods (MASTER FOOD DB — per 100g)
├── 50+ columns: macros, 13 vitamins, 10 minerals, other nutrients
├── density_g_per_ml, piece_weight_g, cup_weight_g, tbsp_weight_g
└── source: usda|ifct|manual|ai_search

canonical_ingredient_nutrition_map
├── normalized_ingredient_name (UNIQUE), nutrition_food_id (FK)
├── confidence_score, mapping_method: manual|ai_suggested|auto_exact
├── approved_by, approved_at

ingredient_synonyms
├── variant_name (UNIQUE), canonical_name

recipe_nutrition_cache
├── recipe_id (UNIQUE FK), indexed macro columns per serving
├── nutrition_coverage_percent, mapped/total ingredient counts
├── unmapped_ingredients (JSON), total/per_serving profiles (JSON)
└── calculated_at, calculation_version

content_fts (FTS5 VIRTUAL TABLE)
├── entity_id (UNINDEXED), title, summary, cuisine
├── ingredients_text, instructions_text, tags_text
```

---

## 3. Content Management Flow (CRUD)

```
                    ┌─────────────────────────┐
                    │     Content Library     │
                    │     GET /api/content    │
                    │  ?type=recipe&favorites │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────┐
                    │  getContentEntities  │
                    │  (Drizzle ORM)       │
                    │  Filters: contentType,│
                    │  query (LIKE),       │
                    │  favoritesOnly       │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Content Grid UI    │
                    │  (ContentCard.tsx)   │
                    │  - Favorite heart   │
                    │  - Rating stars     │
                    │  - Tags             │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │ View Detail │    │ Edit        │    │ Delete      │
  │ GET /api/   │    │ PUT /api/   │    │ DELETE /api │
  │ content/{id}│    │ content/{id}│    │ /content/{id}│
  └──────┬──────┘    └──────┬──────┘    └─────────────┘
         │                  │
         ▼                  ▼
  getContentEntityById()  updateContentEntity()
  - Populates:            - Saves IMMUTABLE snapshot
    ingredients,          to revisions table FIRST
    instructions,         - Updates base entity
    images, tags,         - Replaces sub-tables
    revisions               (delete + re-insert)
  - Returns full entity   - Re-syncs FTS index
  - Used by: detail view,
    cooking mode, nutrition

  ┌─────────────────────────────────────────┐
  │           Create New Content            │
  │  POST /api/content                     │
  └─────────────────────────────────────────┘
          │
          ▼
  createContentEntity()
  ├── 1. Zod validate input (createContentEntitySchema)
  ├── 2. Generate UUID + slug
  ├── 3. Insert base entity (content_entities)
  ├── 4. Insert ingredients (with sort_order)
  ├── 5. Insert instructions (with step_number)
  ├── 6. Insert images (with is_primary flag)
  ├── 7. Insert tags
  ├── 8. Sync to FTS index
  └── 9. Return full entity via getContentEntityById()
```

---

## 4. AI Staging Pipeline (Human-in-the-Loop)

```
This is the CORE differentiator: AI NEVER writes directly to content_entities.

┌──────────────────────────────────────────────────────────────────────────┐
│                    RAW IMPORT FLOW                                       │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  1. User saves source material to Raw Imports                            │
│     POST /api/imports                                                    │
│     - source_type: url | ocr_image | pdf | plain_text | transcript       │
│     - raw_payload: unadulterated source text                             │
│     - status: pending                                                    │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  2. (Optional) Web Scraper                                               │
│     POST /api/imports/scrape                                            │
│     - Fetches HTML from recipe URL                                       │
│     - Extracts JSON-LD schema.org/Recipe if present                     │
│     - Strips HTML tags, nav, footer, script, style                       │
│     - Returns raw payload for manual save                                │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  3. AI Gateway Pipeline                                                  │
│     (src/modules/ai/gateway.ts)                                          │
│     Triggered by: AI extraction from raw import text                     │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  AI GATEWAY PIPELINE (3 stages, with retries)                           │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: Provider Adapter                                              │
│  (src/modules/ai/adapter.ts)                                              │
│  - Reads ai_provider_settings from DB                                    │
│  - Falls back to OPENAI_API_KEY env var                                  │
│  - POST /chat/completions to OpenAI-compatible endpoint                 │
│  - response_format: { type: "json_object" }                              │
│  - Fallback: retry without response_format (older Ollama)               │
│  - Returns: rawResponseText, tokenUsage                                  │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: JSON Repair & Normalizer                                      │
│  (src/modules/ai/middleware/json-repair.ts)                               │
│  - Strips markdown code fences (```json ... ```)                         │
│  - Extracts first JSON object/array from conversational filler           │
│  - Fixes trailing commas before } and ]                                  │
│  - Escapes control characters in JSON strings                            │
│  - Parses to JavaScript object                                           │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: Zod Schema Validation                                         │
│  - Validates parsed JSON against z.ZodSchema<T>                         │
│  - On failure: appends error correction context to messages              │
│  - Retries up to maxRetries (default: 2)                                 │
│  - On success: returns validated data                                    │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: Audit & Metrics Logger                                        │
│  (src/modules/ai/middleware/audit-logger.ts)                               │
│  - estimateTokens(): text.length / 4                                     │
│  - calculateConfidenceScore(): 100 - (40 if invalid) - (15 * retries)   │
│  - Returns: AIExecutionAudit { provider, model, promptVersion,            │
│    latencyMs, tokenUsage, confidence, parsedSuccessfully }                │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  AI Gateway Result: { data, rawText, audit }                              │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  4. Create AI Draft (STAGING)                                            │
│  POST /api/drafts                                                        │
│  createAIDraft()                                                         │
│  - Stores proposed_data_json in ai_drafts table                          │
│  - status: pending                                                       │
│  - Links to raw_import_id and entity_id (if updating existing)           │
│  - Stores AI metadata: provider, model, confidence, tokens, latency     │
│  - NEVER touches content_entities                                        │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  5. Human Review — Side-by-Side Diff Viewer                              │
│  GET /drafts/[id]                                                        │
│  getAIDraftById()                                                        │
│  - Fetches draft + source import + target entity                         │
│  - Parses proposed_data_json                                             │
│  - Renders DiffViewer.tsx:                                               │
│    LEFT:  Original Database Entity (or "Not Created Yet")                │
│    RIGHT: Proposed AI Mutation Payload                                   │
│    - Shows title, summary, servings, times, tags                         │
│    - Shows ingredients table with amounts/units/notes                    │
│    - Shows instructions with step timers                                 │
└──────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  6. Human Approval Workflow                                              │
│  (src/modules/drafts/services/draft-service.ts)                           │
└──────────────────────────────────────────────────────────────────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐ ┌───────────┐
│ APPROVE │ │ REJECT    │
└────┬────┘ └─────┬─────┘
     │            │
     ▼            ▼
approveAIDraft()  rejectAIDraft()
│                 │
│ If entityId:    │ Sets status: rejected
│   updateContent-│ Sets rejection_reason
│   Entity()      │ Updates draft
│   (snapshots    │
│   to revisions) │
│ If no entityId: │
│   createContent-│
│   Entity()      │
│                 │
│ Commits AI      │
│ metadata to     │
│ content_entities│
│                 │
│ Sets draft      │
│ status: approved│
│                 │
│ Marks raw       │
│ import as       │
│ processed       │
│                 │
│ Returns:        │
│ committedEntity │
│ + updated draft │
```

---

## 5. Search Flow (FTS5 + Hybrid)

```
                    ┌─────────────────────────┐
                    │     Search Page         │
                    │     GET /search         │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   FTS5 Multi-Field    │
                    │   Search              │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ searchContentFTS()   │
                    │ (search-service.ts)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ 1. Sanitize query:   │
                    │    - Strip non-word  │
                    │    - Append * for     │
                    │      prefix matching  │
                    │    - Join with spaces │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ 2. Try FTS5 BM25:    │
                    │    SELECT entity_id, │
                    │      title, summary, │
                    │      bm25(rank),     │
                    │      snippet()       │
                    │    FROM content_fts  │
                    │    WHERE MATCH ?      │
                    │    ORDER BY rank ASC │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ 3. For each result:  │
                    │    getContentEntity- │
                    │    ById() to get    │
                    │    full entity      │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ 4. If FTS fails or   │
                    │    no results:       │
                    │    Fallback to LIKE  │
                    │    across title,     │
                    │    summary, cuisine, │
                    │    ingredients,     │
                    │    instructions,    │
                    │    tags              │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────────┐
                    │  Search Results Grid     │
                    │  (ContentCard)           │
                    └─────────────────────────┘


                    ┌─────────────────────────┐
                    │     Hybrid Search        │
                    │  POST /api/search/hybrid │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────┐
                    │ executeHybridSearch()│
                    │ (hybrid-search.ts)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ 1. AI NL Interpretation│
                    │    interpretNatural-  │
                    │    LanguageQuery()    │
                    │    - Uses AI Gateway   │
                    │    - Extracts keywords,│
                    │      maxTime, cuisine, │
                    │      difficulty       │
                    │    - Fallback: regex   │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ 2. FTS5 search with   │
                    │    extracted keywords│
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ 3. Structured filter: │
                    │    - maxTotalTime    │
                    │    - cuisine regex   │
                    │    - difficulty enum │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────────┐
                    │  Filtered Results with  │
                    │  totalTimeMinutes       │
                    └─────────────────────────┘
```

---

## 6. Nutrition Engine Flow

```
                    ┌─────────────────────────┐
                    │  Recipe Detail Page     │
                    │  (Nutrition tab)        │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────┐
                    │ GET /api/nutrition/ │
                    │ recipes/{id}         │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ getRecipeNutrition() │
                    │ (calculator-service) │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ 1. Check cache:      │
                    │    recipe_nutrition_ │
                    │    cache table       │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ Cache HIT?           │
                    └────┬───────────┬────┘
                         │           │
                        YES          NO
                         │           │
                         ▼           ▼
              ┌─────────────────┐ ┌──────────────────────┐
              │ Return cached   │ │ calculateAndCache-   │
              │ nutrition data  │ │ RecipeNutrition()    │
              └─────────────────┘ └──────────┬───────────┘
                                             │
                                    ┌────────┴────────┐
                                    │ 1. Fetch recipe  │
                                    │    entity +      │
                                    │    ingredients    │
                                    └────────┬────────┘
                                             │
                                    ┌────────┴────────┐
                                    │ 2. For each      │
                                    │    ingredient:    │
                                    └────────┬────────┘
                                             │
                                    ┌────────┴────────┐
                                    │ findApprovedFood-│
                                    │ Mapping()         │
                                    │ (nutrition-       │
                                    │  service.ts)       │
                                    └────────┬────────┘
                                             │
                                    ┌────────┴────────┐
                                    │ 1. Normalize name│
                                    │ 2. Check          │
                                    │    canonical_map  │
                                    │ 3. Check synonyms │
                                    │ 4. Partial match  │
                                    └────────┬────────┘
                                             │
                                    ┌────────┴────────┐
                                    │ Found?           │
                                    └────┬───────┬────┘
                                         │       │
                                        YES      NO
                                         │       │
                                         ▼       ▼
                              ┌─────────────┐ ┌──────────────┐
                              │ Get food    │ │ Add to       │
                              │ record from │ │ unmapped     │
                              │ nutrition_  │ │ ingredients  │
                              │ foods       │ │ list         │
                              └──────┬──────┘ └──────────────┘
                                     │
                              ┌──────┴──────┐
                              │ convert-    │
                              │ QuantityTo- │
                              │ Grams()      │
                              │ (utils)      │
                              │ - Uses food's│
                              │   density,   │
                              │   piece/cup/ │
                              │   tbsp weights│
                              └──────┬──────┘
                                     │
                              ┌──────┴──────┐
                              │ Accumulate   │
                              │ nutrition:   │
                              │ macros,      │
                              │ vitamins,    │
                              │ minerals,    │
                              │ other        │
                              │ (per 100g *  │
                              │  grams/100)  │
                              └──────┬──────┘
                                     │
                              ┌──────┴──────┐
                              │ Calculate:   │
                              │ - coverage % │
                              │ - per serving│
                              │ - % DV       │
                              │ - round to   │
                              │   0.1        │
                              └──────┬──────┘
                                     │
                              ┌──────┴──────┐
                              │ UPSERT cache │
                              │ (ON CONFLICT)│
                              └──────┬──────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │ Return full │
                              │ nutrition   │
                              │ result      │
                              └─────────────┘


                    ┌─────────────────────────┐
                    │  Nutrition Food Search  │
                    │  GET /api/nutrition/    │
                    │  foods?q=...            │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────┐
                    │ searchNutritionFoods()│
                    │ - LIKE food_name or   │
                    │   aliases             │
                    └──────────┬──────────┘


                    ┌─────────────────────────┐
                    │  Create Custom Food     │
                    │  POST /api/nutrition/   │
                    │  foods                  │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────┐
                    │ createCustomFood-    │
                    │ AndMap()             │
                    │ 1. Insert into       │
                    │    nutrition_foods   │
                    │ 2. Insert into       │
                    │    canonical_map     │
                    │ 3. Auto-approve      │
                    │ 4. If recipeId given,│
                    │    trigger recalc    │
                    └──────────┬──────────┘


                    ┌─────────────────────────┐
                    │  USDA FoodData Central  │
                    │  POST /api/nutrition/   │
                    │  usda-search            │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────┐
                    │ searchUSDAFoodData-  │
                    │ Central()            │
                    │ - Fetches from       │
                    │   api.nal.usda.gov   │
                    │ - Maps FDC nutrient  │
                    │   numbers to our     │
                    │   schema             │
                    └──────────┬──────────┘


                    ┌─────────────────────────┐
                    │  AI Nutrition Autofill  │
                    │  POST /api/nutrition/   │
                    │  ai-search-nutrition    │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────┐
                    │ fetchNutritionData-  │
                    │ ViaAISearch()        │
                    │ - Uses AI Gateway    │
                    │ - System prompt:     │
                    │   "food scientist"   │
                    │ - Zod schema for     │
                    │   nutrition fields   │
                    │ - Fallback: baseline │
                    │   template           │
                    └──────────┬──────────┘
```

---

## 7. User Interaction Features Flow

```
                    ┌─────────────────────────────────────┐
                    │        FAVORITES SYSTEM             │
                    └─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Content Grid (ContentCard)         │
│  - Heart button on each card        │
│  - PATCH /api/content/{id}/favorite │
│  - toggleFavoriteEntity()           │
│  - Toggles is_favorite boolean      │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Favorites Filter                   │
│  - "Favorites ❤️" tab on library    │
│  - GET /api/content?favoritesOnly=1 │
│  - getContentEntities({             │
│    favoritesOnly: true })           │
└─────────────────────────────────────┘


                    ┌─────────────────────────────────────┐
                    │        RATINGS SYSTEM               │
                    └─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Recipe Detail Page                 │
│  - StarRating.tsx component         │
│  - Interactive 1-5 star selector    │
│  - Real-time score + vote count     │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  GET /api/content/{id}/ratings      │
│  - getRatingSummary()               │
│  - Calculates AVG(rating) + COUNT   │
│  - Returns: { averageRating,        │
│    totalRatings }                   │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  POST /api/content/{id}/ratings     │
│  - addOrUpdateRating()              │
│  - If user rated before: UPDATE     │
│  - If new: INSERT                   │
│  - User identifier defaults to      │
│    "guest"                          │
└─────────────────────────────────────┘


                    ┌─────────────────────────────────────┐
                    │        COMMENTS SYSTEM              │
                    └─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  RecipeCommentsSection.tsx          │
│  - Add comment form                 │
│  - List comments (newest first)     │
│  - Relative time formatting         │
│  - Delete button per comment        │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  GET /api/content/{id}/comments     │
│  - getCommentsByEntityId()          │
│  - ORDER BY created_at DESC         │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  POST /api/content/{id}/comments    │
│  - addComment()                     │
│  - Author defaults to "Anonymous   │
│    Chef" if empty                   │
│  - Returns updated comment list     │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  DELETE /api/content/{id}/comments/ │
│  {commentId}                        │
│  - deleteComment()                  │
│  - Returns updated list             │
└─────────────────────────────────────┘


                    ┌─────────────────────────────────────┐
                    │     UNIT CONVERSION ENGINE          │
                    └─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  System Settings                    │
│  - PATCH /api/settings/system       │
│  - unit_system: metric|imperial     │
│  - Stored in system_settings table  │
│  - Live SQLite sync                 │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Recipe Detail Page                 │
│  - Unit switcher in Ingredients     │
│    header (toggle Metric/Imperial)  │
│  - convertIngredientUnit()          │
│  - Smart converter:                 │
│    - Volume: ml↔cups, tbsp↔tsp      │
│    - Weight: g↔oz, kg↔lbs           │
│    - Length: cm↔inches              │
│    - Temp: °C↔°F                    │
│    - Preserves qualitative units:   │
│      cloves, pinch, dash, sprigs    │
│    - Scales with serving size       │
└─────────────────────────────────────┘


                    ┌─────────────────────────────────────┐
                    │    KITCHEN COOKING MODE             │
                    └─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  KitchenCookView.tsx                │
│  - Large typography focus           │
│  - Step-by-step navigation          │
│  - Active step timers               │
│  - Progress bar                     │
│  - Keyboard shortcuts:              │
│    ← → (prev/next step)             │
│    Space (pause/resume timer)       │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Screen Wake Lock API               │
│  - wakeLockController               │
│  - Prevents screen sleep            │
│  - Re-acquires on visibility change │
│  - Toggle button in header          │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Ingredients Quick Drawer           │
│  - Slide-out panel from right       │
│  - Shows all ingredients with       │
│    converted units                  │
          │
          ▼
┌─────────────────────────────────────┐
│  Timer System                       │
│  - Per-step timer_minutes           │
│  - Start/Pause/Reset controls       │
│  - Auto-syncs when step changes     │
│  - Visual: green=running,           │
│    red=pulse at 0                   │
└─────────────────────────────────────┘


                    ┌─────────────────────────────────────┐
                    │      AI TELEMETRY DISPLAY           │
                    └─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  AIStatsCard.tsx                    │
│  - Provider badge (OpenAI, etc.)    │
│  - Model name (gpt-4o-mini)         │
│  - Latency (ms)                     │
│  - Token usage                      │
│  - Confidence score (color-coded)   │
│  - Prompt version (v1.0)            │
│  - Timestamp                        │
│  - Collapsible reasoning summary    │
└─────────────────────────────────────┘


                    ┌─────────────────────────────────────┐
                    │       SYSTEM HEALTH CHECK           │
                    └─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  GET /api/health                    │
│  - Initializes database             │
│  - Returns:                         │
│    - DB connection type             │
│    - Counts: entities, revisions,   │
│      imports, drafts                │
│    - AI gateway config              │
│    - 10 milestone statuses          │
│    - Latency diagnostics            │
└─────────────────────────────────────┘
```

---

## 8. API Endpoint Map

```
/api/content
  GET    /api/content                     List entities (filters: type, search, favorites)
  POST   /api/content                     Create new content entity
  GET    /api/content/{id}                Get entity by ID or slug
  PUT    /api/content/{id}                Update entity (snapshots to revisions)
  DELETE /api/content/{id}                Delete entity (cascade)
  PATCH  /api/content/{id}/favorite       Toggle favorite

/api/content/{id}/ratings
  GET    /api/content/{id}/ratings        Get rating summary (avg + count)
  POST   /api/content/{id}/ratings        Submit rating (1-5 stars)

/api/content/{id}/comments
  GET    /api/content/{id}/comments       List comments (newest first)
  POST   /api/content/{id}/comments       Add comment
  DELETE /api/content/{id}/comments/{commentId}  Delete comment

/api/imports
  GET    /api/imports                     List raw imports (filter: status)
  POST   /api/imports                     Create raw import
  GET    /api/imports/{id}                Get raw import
  DELETE /api/imports/{id}                Delete raw import
  POST   /api/imports/scrape              Scrape URL → raw payload

/api/drafts
  GET    /api/drafts                      List AI drafts (filter: status)
  POST   /api/drafts                      Create AI draft (staging)
  GET    /api/drafts/{id}                 Get draft with source + target

/api/search/hybrid
  POST   /api/search/hybrid               NL query → structured search

/api/settings/system
  GET    /api/settings/system             Get system settings
  PATCH  /api/settings/system             Update unit system, PWA, search mode

/api/ai/config
  GET    /api/ai/config                   Get AI provider config
  PUT    /api/ai/config                   Update AI provider settings

/api/ai/test
  POST   /api/ai/test                     Test AI Gateway connection

/api/nutrition/foods
  GET    /api/nutrition/foods?q=...       Search nutrition foods
  POST   /api/nutrition/foods             Create custom food + mapping

/api/nutrition/recipes/{id}
  GET    /api/nutrition/recipes/{id}      Get cached or calculate nutrition
  POST   /api/nutrition/recipes/{id}      Force recalculation

/api/nutrition/usda-search
  POST   /api/nutrition/usda-search       Search USDA FoodData Central

/api/nutrition/ai-search-nutrition
  POST   /api/nutrition/ai-search-nutrition  AI-powered nutrition autofill

/api/health
  GET    /api/health                     System health + diagnostics
```

---

## 9. Data Flow Summary (End-to-End)

```
USER ACTION: "Import a recipe from a URL"
  │
  1. User pastes URL → POST /api/imports/scrape
  │   → Scraper fetches HTML, extracts JSON-LD + body text
  │
  2. User saves to imports → POST /api/imports
  │   → Raw payload stored in raw_imports (status: pending)
  │
  3. AI Gateway processes raw text
  │   → Adapter: sends to OpenAI-compatible endpoint
  │   → JSON Repair: cleans LLM output
  │   → Zod Validation: validates against recipe schema
  │   → Audit Logger: captures metrics
  │
  4. AI draft created → POST /api/drafts
  │   → Stored in ai_drafts (status: pending)
  │   → NEVER touches content_entities
  │
  5. Admin reviews → GET /drafts/{id}
  │   → DiffViewer shows side-by-side comparison
  │
  6. Admin approves → approveAIDraft()
  │   → createContentEntity() or updateContentEntity()
  │   → Revisions snapshot saved
  │   → FTS index updated
  │   → Raw import marked as processed
  │   → Draft status → approved
  │
  7. Recipe appears in library → GET /api/content
  │   → User can view, favorite, rate, comment
  │   → Can enter Kitchen Cook Mode
  │   → Can view nutrition breakdown
  │   → Can search via FTS5 or Hybrid Search

USER ACTION: "Search for quick Italian recipes"
  │
  1. User types in search bar
  │
  2. Hybrid Search → POST /api/search/hybrid
  │   → AI interprets: "quick Italian" → keywords, cuisine
  │   → FTS5 searches content_fts index
  │   → Filters by cuisine + total time
  │
  3. Results displayed with snippets and match scores
  │
  4. User clicks result → Recipe detail page
```
