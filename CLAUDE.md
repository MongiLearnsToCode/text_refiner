# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run lint      # TypeScript type checking (tsc --noEmit)
npm run clean     # Remove dist/
```

There is no test framework configured in this project.

## Environment Setup

Requires a `.env.local` file (not `.env`) with:
```
VITE_GROQ_API_KEY=<your-key>
```
Get a free key at https://console.groq.com

## Architecture

Single-page React 19 app with Vite. No routing, no external state management — all state lives in `App.tsx` via `useState`.

**Data flow:**
```
User input + options (App.tsx) → geminiService.refineText() → Gemini API → rendered markdown output
```

**Key files:**
- `src/App.tsx` — entire UI and state; the sidebar controls feed into a single "Refine Text" action
- `src/services/geminiService.ts` — dynamically builds prompts from selected options and calls Groq (`llama-3.3-70b-versatile`); optionally runs a second optimization pass
- `src/types.ts` — `PromptVersion` interface for saved version history

**Processing modes** (selected in sidebar, passed to `geminiService`):
1. Comprehensive Refinement — default, context-aware full edit
2. Remove Em Dashes Only
3. Grammar Correction Only
4. De-AI / Humanize Text — strips AI patterns, targets British English

**Developer Mode** — transforms input into a structured AI prompt instead of refining prose; supports Cursor/Claude/GPT presets and an optional structure generator (Goal/Requirements/Constraints/Tech Stack/Output).

**Version history** is in-memory only (no persistence); saved versions support side-by-side compare view.

## Tech Stack

- React 19, TypeScript, Vite 6
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js`)
- `@google/genai` for Gemini API
- `react-markdown` for output rendering
- `motion` (Framer Motion v12) for animations
- `lucide-react` for icons
