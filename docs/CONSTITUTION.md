# Project Constitution

> **Immutable Governance Rules for AI Family Cookbook & Culinary Knowledge Base**

---

### 1. Mandatory Human Approval
AI never issues direct database mutations (`INSERT`, `UPDATE`, `DELETE`) on production entity tables. Every AI feature produces an `ai_draft` for explicit administrator review and approval.

### 2. Provider-Agnostic AI
AI operations use a uniform OpenAI-compatible abstraction (`/v1/chat/completions`) supporting configurable endpoints, keys, models, and custom providers (OpenAI, DeepSeek, Groq, OpenRouter, Ollama, LM Studio).

### 3. Deployable Milestones
Every milestone commit must leave the application fully functional, typed, error-free, and deployable to production (Vercel).

### 4. Structured Data First
Rich, strongly typed schemas and relational structures are preferred over unparsed free-form text blobs.

### 5. No Architectural Ambiguity
Major architectural decisions (schema changes, auth models, framework additions) must be explained and approved prior to execution.

### 6. No Silent Data Overwrites
Approved changes snapshot the existing record into `revisions` before updating production entity records, keeping a complete audit trail.

### 7. Modular Architecture
Features are organized as self-contained domain modules owning their UI, schemas, services, and routes.

### 8. Universal Zod Validation
Every API route, server action, form submission, and AI payload must be validated through Zod schemas.

### 9. Migration-Driven Schema Evolution
All database schema changes are managed via explicit, versioned Drizzle migrations and modular schema definitions.

### 10. Transparent AI Rationale
AI-generated drafts must include an explanation/summary of why changes or extractions were proposed alongside confidence scores and token usage.
