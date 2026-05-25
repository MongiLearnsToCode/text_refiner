# Finer Text

A full-stack web application that transforms messy, unstructured text into clean, professional writing using AI. Also features a **Developer Mode** that converts rough ideas into structured prompts for AI coding agents (Cursor, Claude, GPT).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [Design System](#design-system)
- [Business Model](#business-model)
- [Key Design Decisions](#key-design-decisions)

---

## Tech Stack

| Category | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **Styling** | Tailwind CSS v4, shadcn/ui (Base-Nova), CSS variables |
| **UI Components** | Base UI React (`@base-ui/react`) + shadcn primitives |
| **Icons & Animation** | lucide-react, motion (Framer Motion v12) |
| **Backend / Database** | Convex (realtime, reactive, full-stack platform) |
| **Authentication** | Better Auth via `@convex-dev/better-auth` (email/password) |
| **AI / LLM** | Groq SDK — Meta's `llama-3.3-70b-versatile` model |
| **Payments** | Polar.sh / Stripe ($12/mo Pro subscription) |
| **Diff Engine** | `diff` library (word-level) |
| **PDF Export** | jsPDF |
| **Markdown** | react-markdown |

---

## Architecture Overview

```
Browser (React SPA)
    │
    ├──► Convex Client
    │       ├──► Convex Backend (Queries, Mutations, Actions)
    │       └──► Better Auth Component (sessions, users)
    │
    ├──► Groq API (LLM refinement)
    └──► Polar.sh API (subscriptions + webhooks)
```

The app is a **single-page React application** with no client-side router. Views are managed via React state (`editor | history | profile`). Authentication state gates between auth pages and the main app.

---

## Features

### Text Refinement — 7 Processing Modes

| Mode | Tier |
|---|---|
| Comprehensive Refinement | Free |
| Remove Em Dashes Only | Free |
| Grammar Correction Only | Free |
| De-AI / Humanize Text | Pro |
| Email Polish | Pro |
| Simplify | Pro |
| Formalize | Pro |

### Editing Controls (Toggle Chips)
- Em Dashes toggle
- Grammar toggle
- Clarity toggle
- Structure toggle
- Tone toggle

### Context & Tone Selection
- **6 writing contexts:** General, Academic, Business, Creative, Technical, Legal
- **5 tone options:** Professional, Casual, Persuasive, Academic, Empathetic

### Developer Mode
Converts free-form ideas into structured AI coding prompts with presets for Cursor, Claude, and GPT. Features automatic **Structure Generator** (Goal / Requirements / Constraints / Tech Stack / Output sections), saveable **Prompt Templates**, and an optional **Optimization Pass** (second AI call).

### Output Features
- **Side-by-Side Diff View** — Word-level diff with accept/reject individual changes
- **Alternative Variants** — Generates 2 alternative versions of the output
- **Readability Scoring** — Flesch-Kincaid readability score (Pro)
- **AI Detection Scoring** — 8-signal weighted analysis of AI-likelihood
- **Prompt Quality Scoring** — Scores developer prompts on clarity, specificity, structure, completeness
- **Export** — Download as .txt, .md, or PDF (Pro)

### User Features
- **Email/password authentication** with Better Auth
- **Usage tracking** — 20 free refinements/month with visual progress bar
- **Refinement history** — Paginated, searchable, filterable, with list/grid views, label editing, and delete
- **Subscription management** — Upgrade, cancel, resume via Polar.sh
- **Custom style guide** — User-defined brand voice rules
- **Version history** — In-memory version comparison
- **Mobile responsive** — Full mobile layout with bottom tab navigation and settings sheet

---

## Project Structure

```
text_refiner/
├── convex/                          # Convex backend
│   ├── schema.ts                    # Database schema (4 tables)
│   ├── auth.ts / auth.config.ts     # Better Auth integration
│   ├── convex.config.ts             # App definition + component registration
│   ├── http.ts                      # HTTP router (auth routes + Polar webhook)
│   ├── refinements.ts               # CRUD + paginated history
│   ├── usage.ts                     # Usage tracking + free-tier limits
│   ├── subscriptions.ts             # Plan queries + upsert
│   ├── promptTemplates.ts           # Saved prompt templates CRUD
│   ├── polarActions.ts              # Polar.sh checkout, cancel, resume, webhook
│   └── _generated/                  # Auto-generated Convex types
│
├── src/                             # Frontend source
│   ├── App.tsx                      # Main component (entire UI + state)
│   ├── main.tsx                     # Entry point (Convex + Auth providers)
│   ├── types.ts                     # Shared TypeScript types
│   ├── index.css                    # Tailwind + design tokens + dark mode
│   │
│   ├── lib/
│   │   ├── auth-client.ts           # Better Auth client config
│   │   └── utils.ts                 # cn() utility
│   │
│   ├── services/
│   │   ├── geminiService.ts         # Groq API calls + prompt building (7 modes)
│   │   └── variantsService.ts       # Alternative variants generation
│   │
│   ├── utils/
│   │   ├── aiDetection.ts           # AI-likelihood scoring (8 signals)
│   │   ├── promptScore.ts           # Prompt quality scoring (4 dimensions)
│   │   └── readability.ts           # Flesch-Kincaid scoring
│   │
│   └── components/
│       ├── auth/                    # SignInPage, SignUpPage
│       ├── ui/                      # shadcn primitives (button, badge, select, etc.)
│       ├── DiffView.tsx             # Interactive word-level diff
│       ├── HistoryPage.tsx          # Paginated history with search/filter
│       ├── ProfilePage.tsx          # Account settings + subscription
│       ├── UpgradeModal.tsx         # Free vs Pro comparison + checkout
│       ├── UsageIndicator.tsx       # Usage progress bar
│       ├── VariantsPanel.tsx        # Alternative variants carousel
│       ├── ReadabilityBadge.tsx     # Flesch-Kincaid display
│       └── AIScoreBadge.tsx         # AI-likelihood display
│
├── DESIGN.md                        # Full design system documentation
├── index.html                       # HTML entry point
├── vite.config.ts                   # Vite configuration
├── package.json
└── tsconfig.json
```

---

## Data Flow

### Text Refinement
1. User pastes text and configures options (mode, context, tone, editing toggles, style guide)
2. App calls `api.usage.checkAndIncrement()` → enforces 20/month free limit
3. `geminiService.ts` builds a dynamic prompt and calls Groq's `llama-3.3-70b-versatile` model
4. Optionally runs a second optimization pass (Developer Mode)
5. Output is saved to Convex via `api.refinements.save()`
6. Readability, AI detection, and prompt quality scores are computed client-side
7. Output rendered as Markdown with side-by-side diff view

### Subscription Flow
1. User clicks "Upgrade" → `UpgradeModal` → Polar checkout session created
2. User redirected to Polar.sh / Stripe checkout
3. On success, Polar sends webhook to `POST /polar/webhook`
4. Convex HTTP action validates signature and updates subscription in DB
5. Frontend re-renders with Pro features unlocked

### History
- `HistoryPage` uses Convex `usePaginatedQuery(api.refinements.list)`
- Sorted by creation time descending, 20 items per page
- Client-side search, mode filter, and date filter
- Free plan limited to last 30 days of history

---

## Database Schema

Convex schema (`convex/schema.ts`) — 4 tables:

| Table | Key Fields | Indexes |
|---|---|---|
| **refinements** | `userId`, `label`, `inputText`, `outputText`, `processingMode` | `by_userId_and_creationTime` |
| **usage** | `userId`, `monthKey` (YYYY-MM), `count` | `by_userId_and_month` |
| **promptTemplates** | `userId`, `name`, `inputText`, `preset`, `structureGenerator`, `optimizationPass` | `by_userId` |
| **subscriptions** | `userId`, `plan` (free\|pro), `polarCustomerId?`, `polarSubscriptionId?`, `cancelAtPeriodEnd?` | `by_userId`, `by_polarSubscriptionId` |

Better Auth manages additional internal tables (`users`, `sessions`, `accounts`, `verifications`) via its Convex component adapter.

---

## Design System

The "Executive Precision" design system (documented in `DESIGN.md`):

- **Color palette:** Executive Navy (#1A2B44), Executive Blue (#4A628A), Refined Gold (#B89F6F)
- **Grid:** Strict 4px baseline grid with 720px max editor width
- **Surfaces:** Tiers defined by subtle background shifts rather than borders
- **Radius:** Conservative 4-6px, no pill shapes
- **Shadows:** Ambient (12px blur, 4% opacity)
- **Typography:** Inter (UI), Source Serif 4 (editor), Geist (alternative)
- **Editor:** 1.6x line height for proofreading
- **Modes:** Light and dark mode via CSS variables

---

## Business Model

- **Free tier:** 20 refinements/month, 3 processing modes, basic history
- **Pro tier:** $12/month — unlimited usage, all 7 modes, export (PDF/txt/md), readability scoring, full history access
- **Payment processor:** Polar.sh with Stripe-powered checkout
- **Usage tracking:** Monthly counting via `YYYY-MM` keys in the `usage` table

---

## Key Design Decisions

1. **No client-side router** — Single-page component with `useState` view switching. Works because the app is a focused tool, not a multi-page site.

2. **No external state management** — All state lives in `App.tsx` via `useState`. Keeps the architecture simple for a single-user tool.

3. **Client-side AI calls** — Groq SDK runs in the browser (`dangerouslyAllowBrowser: true`). Avoids Convex execution time limits but requires compile-time API key injection via Vite `define`.

4. **Naming note:** `geminiService.ts` calls **Groq** (not Gemini). The `@google/genai` package is listed but unused.

5. **Dual font strategy** — Inter (sans-serif) for reliability, Source Serif 4 (serif) for editorial precision.

6. **AI detection analysis** — 8-signal weighted system: buzzwords (18%), burstiness (20%), hedge phrases (13%), robotic transitions (12%), starter repetition (12%), structural markers (10%), passive voice (8%), list density (7%).

7. **Convex as glue layer** — Handles auth, persistence, real-time updates, and HTTP webhooks. The LLM work stays client-side.
