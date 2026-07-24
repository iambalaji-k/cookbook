# Database ER Diagram & Architecture Documentation

## Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    CONTENT_ENTITIES ||--o{ REVISIONS : "has history"
    CONTENT_ENTITIES ||--o{ INGREDIENTS : "contains"
    CONTENT_ENTITIES ||--o{ INSTRUCTIONS : "has steps"
    CONTENT_ENTITIES ||--o{ IMAGES : "has gallery"
    CONTENT_ENTITIES ||--o{ TAGS : "categorized by"
    RAW_IMPORTS ||--o{ AI_DRAFTS : "ingested into"
    CONTENT_ENTITIES ||--o{ AI_DRAFTS : "targets mutation"

    CONTENT_ENTITIES {
        string id PK "UUID"
        string content_type "recipe|technique|guide|sauce|tip"
        string title
        string slug UK
        string summary
        string status "draft|published|archived"
        integer servings
        integer prep_time_minutes
        integer cook_time_minutes
        string cuisine
        string difficulty
        string image_url
        string created_at
        string updated_at
    }

    INGREDIENTS {
        string id PK "UUID"
        string entity_id FK
        string item_name
        real amount
        string unit
        string notes
        integer sort_order
    }

    INSTRUCTIONS {
        string id PK "UUID"
        string entity_id FK
        integer step_number
        string instruction_text
        integer timer_minutes
    }

    IMAGES {
        string id PK "UUID"
        string entity_id FK
        string image_url
        string caption
        boolean is_primary
    }

    TAGS {
        string id PK "UUID"
        string entity_id FK
        string tag_name
    }

    REVISIONS {
        string id PK "UUID"
        string entity_id FK
        string entity_type
        integer revision_number
        string snapshot_json
        string change_summary
        string approved_by
        string approved_at
        string created_at
    }

    RAW_IMPORTS {
        string id PK "UUID"
        string source_type "url|ocr_image|pdf|plain_text|transcript"
        string source_url
        string raw_payload
        string metadata_json
        string status "pending|processed|failed"
        string created_at
    }

    AI_DRAFTS {
        string id PK "UUID"
        string raw_import_id FK
        string entity_id FK
        string target_content_type
        string proposed_data_json
        string reason
        string provider
        string model
        integer confidence
        integer token_usage
        integer latency_ms
        string prompt_version
        string created_by
        string status "pending|approved|rejected"
        string rejection_reason
        string created_at
        string updated_at
    }

    SYSTEM_SETTINGS {
        string id PK "system"
        string theme
        string unit_system
        boolean pwa_enabled
        string default_language
        string search_mode
        string updated_at
    }

    AI_PROVIDER_SETTINGS {
        string id PK "default"
        string provider
        string base_url
        string api_key
        string model
        string temperature
        string prompt_version
        string updated_at
    }
```

---

## Data Schema Summary

1. **`content_entities`**: Core polymorphic table for Recipes, Techniques, Ingredient Guides, Sauces, Spice Blends, and Kitchen Tips. Uses UUID primary keys and strict unique slugs.
2. **`ingredients` & `instructions`**: Relational sub-tables for structured recipe components.
3. **`images` & `tags`**: Gallery images & categorizations per content entity.
4. **`revisions`**: Immutable audit history log tracking version numbers, change summaries, and snapshot states upon approval.
5. **`raw_imports`**: Preserved raw source payloads (URLs, raw OCR output, plain text dumps) enabling future prompt re-processing.
6. **`ai_drafts`**: Mandatory staging table for AI-generated proposals featuring confidence metrics, token usage, latency tracking, prompt versioning, and rationale summaries.
7. **`system_settings`**: General app preferences (theme, metric/imperial, PWA toggles).
8. **`ai_provider_settings`**: Provider-agnostic AI Gateway configurations (OpenAI, DeepSeek, Groq, Ollama).
