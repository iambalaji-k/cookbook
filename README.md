# 🍳 Culinary AI Cookbook & Knowledge Base

An intelligent, structured-data-first family cookbook application built with **Next.js 16 (Turbopack)**, **TypeScript**, **Tailwind CSS**, and **Turso / Drizzle ORM (SQLite)**. Features an AI Gateway staging pipeline with human-in-the-loop approval, metric/imperial unit conversion engine, AI execution telemetry, recipe ratings, favorites, and community comments.

---

## 🌟 Key Features & Capabilities

### 📏 1. Metric Default & Unit Conversion Engine
- **Metric System by Default**: Configured out of the box to display grams (`g`), kilograms (`kg`), milliliters (`ml`), liters (`L`), centimeters (`cm`), and degrees Celsius (`°C`).
- **Interactive Unit Switcher**: Toggle between **Metric** and **Imperial** directly inside the Ingredients list header on any recipe view.
- **Smart Unit Converter**: Converts volume, weight, length, and temperature automatically, while preserving qualitative units (`cloves`, `pinch`, `dash`, `sprigs`) and scaling them dynamically with serving size adjustments.
- **Global App Preferences**: Manually adjust default unit system preferences in Settings with live SQLite synchronization.

### 🤖 2. AI Execution Telemetry & Gateway Provenance
- Displays comprehensive AI generation metadata badges for AI-assisted recipes and draft proposals:
  - **AI Provider**: `OpenAI`, `DeepSeek`, `Ollama`, etc.
  - **AI Model**: e.g., `gpt-4o-mini`
  - **Latency**: Generation speed in milliseconds (e.g. `420 ms`)
  - **Token Usage**: Token count breakdown (e.g. `1,250 tokens`)
  - **Confidence Score**: Percentage confidence rating with color indicators
  - **Prompt Versioning**: e.g. `v1.0`
  - **Timestamp**: Precise generation date & time
  - **Reasoning Summary**: Collapsible AI rationale and extraction explanation

### ❤️ 3. Favorites System
- **One-Click Heart Button**: Mark any recipe as a favorite from recipe grid cards, cover banners, or detail pages.
- **Favorites Filter**: Filter your library instantly using the **"Favorites ❤️"** tab on the content library page.

### ⭐ 4. Interactive 5-Star Ratings
- **Rate Any Recipe**: Interactive 1-to-5 star rating component with real-time score updates and vote count tracking.

### 💬 5. Recipe Comments & Culinary Notes
- **Community Feedback**: Add, view, and manage notes, tips, or ingredient substitution ideas for any recipe with relative time formatting and deletion options.

### 🍳 6. Hands-Free Kitchen Cooking Mode
- **Step-by-Step Focus**: Large-typography cooking mode with active step timers and progress tracking.
- **Screen Wake Lock API**: Prevents your device screen from turning off while cooking.

### 🛡️ 7. AI Staging Pipeline & Human Approval Workflow
- **AI Never Overwrites Live Data**: All raw web scrapes or AI extractions enter `ai_drafts` as staged proposals.
- **Side-by-Side Diff Viewer**: Administrators compare AI proposals against live database entries before approving or tweaking.
- **Immutable Revision Audit History**: Every edit creates an immutable snapshot in `revisions`.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Vanilla CSS + Tailwind CSS (Glassmorphism & Vibrant Dark Theme) |
| **Database** | Turso Serverless SQLite / Local SQLite via Drizzle ORM |
| **Search Engine** | SQLite FTS5 Full-Text Search Virtual Table |
| **Icons** | Lucide React |

---

## 📂 Project Architecture

```
cookbook/
├── src/
│   ├── app/                         # Next.js App Router Page Routes & API Endpoints
│   │   ├── (dashboard)/             # Main Dashboard Layout & Sub-pages
│   │   │   ├── content/             # Recipe Library, Details, Edit, Cooking Mode
│   │   │   ├── drafts/              # AI Staging Proposals & Diff Review
│   │   │   ├── imports/             # Raw URL Scrapers & Import Logs
│   │   │   ├── search/              # SQLite FTS5 Multi-Field Search
│   │   │   └── settings/            # AI Gateway & System Unit Preferences
│   │   └── api/                     # REST API Endpoints (Content, Favorites, Ratings, Comments, Settings)
│   ├── components/                  # Reusable UI & Layout Components
│   │   └── layout/                  # Unified Header & Navigation Sidebar
│   ├── core/                        # Database Schemas & Initializers
│   │   └── db/
│   │       ├── schema/              # Drizzle ORM Schemas (content, drafts, ratings, comments, settings)
│   │       └── init-db.ts           # DDL Migrations & Seed Bootstrap
│   └── modules/                     # Feature Modules & Utility Services
│       ├── ai/                      # AI Telemetry & Settings Components
│       ├── content/                 # Content Viewer, Card, Ratings, Comments & Unit Converter
│       └── drafts/                  # Side-by-Side Diff Viewer & Proposal Review
├── public/                          # Static Assets & PWA Manifest
├── drizzle.config.ts                # Drizzle ORM Configuration
├── next.config.ts                   # Next.js Configuration
└── package.json                     # Dependencies & npm Scripts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm installed on your system.

### Installation

1. **Clone the repository and install dependencies**:
   ```bash
   git clone https://github.com/your-username/cookbook.git
   cd cookbook
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(Optional: Add `OPENAI_API_KEY` or `TURSO_DATABASE_URL` if connecting to cloud providers. Defaults to local SQLite file `local.db` if omitted).*

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. The database and sample recipes will initialize automatically!

4. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 📡 API Endpoint Overview

- `GET /api/content` - List content entities (filters: `contentType`, `query`, `favoritesOnly`)
- `PATCH /api/content/[id]/favorite` - Toggle recipe favorite heart status
- `GET / POST /api/content/[id]/ratings` - Fetch and submit 1-5 star ratings
- `GET / POST /api/content/[id]/comments` - Fetch and post comments
- `DELETE /api/content/[id]/comments/[commentId]` - Remove a comment
- `PATCH /api/settings/system` - Update global unit system defaults (Metric / Imperial) and preferences

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
