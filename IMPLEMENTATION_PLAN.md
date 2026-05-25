# Implementation Plan — Finer Text Audit Remediation

Based on `CODEBASE_AUDIT.md`. All items are grouped into 4 phases ordered by risk reduction and dependency logic.

---

## Phase 0 — Quick Wins (< 1 day)

Low-effort items that can be done immediately with high impact.

| # | Task | Files to touch | Effort |
|---|---|---|---|
| 0.1 | **Rename `geminiService.ts` → `groqService.ts`** | `src/services/geminiService.ts` → `src/services/groqService.ts`, `src/App.tsx` (update import), `src/components/VariantsPanel.tsx` (update import if needed) | 10 min |
| 0.2 | **Update `package.json` name** | `package.json`: `"name": "react-example"` → `"name": "finer-text"` | 1 min |
| 0.3 | **Update README.md** | Replace AI Studio / Gemini references with Groq + Convex setup instructions | 20 min |
| 0.4 | **Update `metadata.json`** | `metadata.json`: update name and description to "Finer Text" | 1 min |
| 0.5 | **Add Groq API timeout** | `src/services/groqService.ts` (ex-geminiService): add `maxRetries: 2, timeout: 30000` to the Groq constructor or per-call options | 10 min |
| 0.6 | **Remove unused dependencies** | `npm uninstall @google/genai express dotenv autoprefixer` | 5 min |

**Total Phase 0:** ~45 min

---

## Phase 1 — Security & Critical (Must Have)

Non-negotiable pre-launch items.

### 1.1 Move Groq API calls server-side

**Problem:** `VITE_GROQ_API_KEY` is baked into the client bundle via Vite `define` and used with `dangerouslyAllowBrowser: true`.

**Solution:** Create a Convex action that proxies LLM calls, then call it from the client.

**Steps:**

1. **Create `convex/llm.ts`** — a Convex action with the Groq SDK (runs server-side):

```ts
// convex/llm.ts
"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const refine = action({
  args: {
    prompt: v.string(),
    optimizationPrompt: v.optional(v.string()),
  },
  handler: async (_, args) => {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: args.prompt }],
      max_tokens: 4096,
    });

    let refinedText = response.choices[0]?.message?.content || "";

    if (args.optimizationPrompt) {
      const optResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: args.optimizationPrompt }],
        max_tokens: 4096,
      });
      refinedText = optResponse.choices[0]?.message?.content || refinedText;
    }

    return refinedText;
  },
});

export const generateVariants = action({
  args: {
    prompt: v.string(),
    count: v.number(),
  },
  handler: async (_, args) => {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: args.prompt }],
      max_tokens: 4096,
    });

    const raw = response.choices[0]?.message?.content ?? "";
    return raw.split("---VARIANT---").map((s) => s.trim()).filter(Boolean);
  },
});
```

2. **Remove `dangerouslyAllowBrowser: true`** from the client-side services and delete the `VITE_GROQ_API_KEY` env var.

3. **Update `src/services/groqService.ts`** to call `api.llm.refine` via `useAction` instead of calling Groq directly.

4. **Update `src/services/variantsService.ts`** similarly to call `api.llm.generateVariants`.

5. **Update `src/App.tsx`** to use `useAction(api.llm.refine)` and `useAction(api.llm.generateVariants)` instead of the direct service calls.

6. **Update `.env.example`** — remove `VITE_GROQ_API_KEY`, add `GROQ_API_KEY` (server-side).

7. **Set `GROQ_API_KEY`** and remove `VITE_GROQ_API_KEY` from `vite.config.ts` `define`.

**Files affected:** `convex/llm.ts` (new), `src/services/groqService.ts`, `src/services/variantsService.ts`, `src/App.tsx`, `vite.config.ts`, `.env.example`

**Effort:** Medium

---

### 1.2 Add error tracking (Sentry)

**Steps:**

1. `npm install @sentry/react @sentry/vite-plugin`
2. Add `Sentry.init()` to `src/main.tsx`
3. Add Sentry `vitePlugin` to `vite.config.ts` for source map upload (optional)
4. Wrap root component with `Sentry.ErrorBoundary`

```ts
// src/main.tsx (add at top)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.5,
});
```

5. Add `VITE_SENTRY_DSN` to `.env.example`

**Files affected:** `src/main.tsx`, `.env.example`, `package.json`, `vite.config.ts`

**Effort:** Small

---

### 1.3 Add password reset flow

**Steps:**

1. Add "Forgot password?" link to `SignInPage.tsx`
2. Create `ForgotPasswordPage.tsx` and `ResetPasswordPage.tsx` components
3. Better Auth supports password reset via `authClient.forgotPassword()` and `authClient.resetPassword()` out of the box
4. Wire up the email sending — requires configuring an SMTP/email provider in Better Auth or using Better Auth's built-in flow

```ts
// Better Auth already supports this — just need UI pages.
// In SignInPage.tsx, add:
// <a onClick={() => setView('forgot-password')}>Forgot password?</a>

// ForgotPasswordPage.tsx:
const { error } = await authClient.forgotPassword({ email });

// ResetPasswordPage.tsx (landing page from email link):
const { error } = await authClient.resetPassword({ newPassword, token });
```

5. Need to update `App.tsx` auth view state to support `'forgot-password'` and `'reset-password'` views.

**Files affected:** `src/components/auth/ForgotPasswordPage.tsx` (new), `src/components/auth/ResetPasswordPage.tsx` (new), `src/components/auth/SignInPage.tsx`, `src/App.tsx`

**Effort:** Small (UI only — Better Auth handles the backend)

---

### 1.4 Add test suite

**Steps:**

1. **Install vitest** (native Vite compatibility):
   ```
   npm install -D vitest @testing-library/react @testing-library/jest-dom happy-dom
   ```

2. **Add test script to `package.json`**:
   ```json
   "test": "vitest run",
   "test:watch": "vitest"
   ```

3. **Create `vitest.config.ts`** extending Vite config with `happy-dom` environment.

4. **Add tests for critical paths:**

   | Test | What to cover |
   |---|---|
   | `convex/__tests__/polarActions.test.ts` | Webhook signature validation, event processing for each subscription event type, upsert logic |
   | `convex/__tests__/usage.test.ts` | Usage limit enforcement, free vs pro differentiation, month key generation |
   | `convex/__tests__/refinements.test.ts` | Auth gating, owner authorization, save/remove/update |
   | `src/__tests__/aiDetection.test.ts` | Scoring edge cases (short text, AI text, human text, boundary scores) |
   | `src/__tests__/readability.test.ts` | Flesch-Kincaid scoring for different text types |
   | `src/__tests__/promptScore.test.ts` | Score levels and label mapping |

   For Convex tests, use `convex/` test utilities:
   - Use `npx convex test` for Convex-specific tests, or mock Convex internals with vitest.

5. **Set up `@testing-library/react`** for component-level tests:
   - `DiffView.test.tsx` — accept/reject toggles
   - `UsageIndicator.test.tsx` — rendering for free/pro states
   - `HistoryPage.test.tsx` — pagination, filtering, empty states

**Files affected:** `package.json`, `vitest.config.ts` (new), `convex/__tests__/*.test.ts` (new), `src/__tests__/*.test.ts` (new), `.env.example`

**Effort:** Large

---

## Phase 2 — Code Health (Should Have)

### 2.1 Refactor `App.tsx`

Break the 1091-line component into separate modules:

| Extract to | Responsibility | ~Lines |
|---|---|---|
| `src/components/EditorHeader.tsx` | Header bar, nav buttons, usage indicator | 70 |
| `src/components/Sidebar.tsx` | All sidebar content: mode, context, tone, editing chips, style guide, dev mode, templates | 270 |
| `src/components/InputPanel.tsx` | Raw input textarea + paste/clear buttons | 50 |
| `src/components/OutputPanel.tsx` | Output panel header, rendered output, scores bar | 100 |
| `src/components/MobileLayout.tsx` | Mobile tab switcher, bottom nav, settings sheet | 120 |
| `src/components/EditorLayout.tsx` | Desktop side-by-side layout orchestration | 60 |
| `src/hooks/useRefinement.ts` | `handleRefine` logic + state for processing | 60 |
| `src/hooks/useEditorState.ts` | All input state, diff/variants/compare state | 50 |

**Result:** `App.tsx` goes from ~1091 lines to ~60 lines (just composes the above).

**Files affected:** `src/App.tsx` (refactored), 8 new files as above

**Effort:** Large

---

### 2.2 Enable strict TypeScript

**Steps:**

1. Add to `tsconfig.json`:
   ```json
   "strict": true,
   "noUncheckedIndexedAccess": true,
   "exactOptionalPropertyTypes": true
   ```
2. Run `npx tsc --noEmit` and fix all errors
3. Main areas that will need fixing:
   - `convex/usage.ts:10-16` — replace `any` with proper types
   - `convex/polarActions.ts:105` — `event.data as any` — type properly
   - `src/App.tsx` — various implicit `any` in event handlers
   - Accessing `usageData.limit` (number | null) wherever it's used

**Files affected:** `tsconfig.json`, plus fixes across ~10-15 files

**Effort:** Medium

---

### 2.3 Set up ESLint + Prettier

**Steps:**

1. `npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks prettier`
2. Create `eslint.config.js`:
   ```js
   import js from "@eslint/js";
   import tseslint from "typescript-eslint";
   import reactHooks from "eslint-plugin-react-hooks";

   export default tseslint.config(
     js.configs.recommended,
     ...tseslint.configs.recommended,
     {
       plugins: { "react-hooks": reactHooks },
       rules: { ...reactHooks.configs.recommended.rules },
     },
     { ignores: ["dist/", "convex/_generated/"] }
   );
   ```
3. Create `.prettierrc`:
   ```json
   { "semi": true, "singleQuote": false, "trailingComma": "all", "tabWidth": 2 }
   ```
4. Update `package.json` scripts:
   ```json
   "lint": "eslint src/ convex/ && tsc --noEmit",
   "format": "prettier --write src/ convex/"
   ```

**Files affected:** `eslint.config.js` (new), `.prettierrc` (new), `package.json`

**Effort:** Small

---

### 2.4 Replace `alert()` with toast notifications

**Steps:**

1. Add a toast component (shadcn/ui has `sonner` integration or use `react-hot-toast`):
   ```
   npm install sonner
   ```
2. Add `<Toaster />` to `App.tsx`
3. Replace all `alert(...)` calls:
   - `App.tsx:214` → `toast.error(msg)`
   - `App.tsx:261` → `toast.error(msg)`
   - `ProfilePage.tsx:35,45` → `toast.error(...)`
4. Add success toasts for copy, save, delete operations

**Files affected:** `src/App.tsx`, `src/components/ProfilePage.tsx`, `package.json`

**Effort:** Small

---

### 2.5 Add delete confirmation dialogs

**Steps:**

1. Add a `ConfirmDialog` component (or use shadcn's `AlertDialog`):
   ```tsx
   // src/components/ui/confirm-dialog.tsx
   ```
2. Wrap delete actions in `HistoryPage.tsx`:
   - List view line 372
   - Grid view line 436
3. Wrap template delete in `App.tsx` sidebar (line 554)

**Files affected:** `src/components/ui/confirm-dialog.tsx` (new), `src/components/HistoryPage.tsx`, `src/App.tsx`

**Effort:** Small

---

### 2.6 Add structured logging

**Steps:**

1. Replace `console.error` in `geminiService.ts` (after rename: `groqService.ts`) with a `logger` utility
2. Create `src/lib/logger.ts`:
   ```ts
   const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
   type Level = keyof typeof LOG_LEVELS;

   function log(level: Level, message: string, context?: Record<string, unknown>) {
     const entry = {
       timestamp: new Date().toISOString(),
       level,
       message,
       ...context,
     };
     if (LOG_LEVELS[level] >= LOG_LEVELS.warn) {
       console.error(JSON.stringify(entry));
     } else {
       console.log(JSON.stringify(entry));
     }
   }

   export const logger = {
     info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
     warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
     error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
   };
   ```
3. Replace `console.error` across the codebase with `logger.error`

**Files affected:** `src/lib/logger.ts` (new), `src/services/groqService.ts`, `src/services/variantsService.ts`

**Effort:** Small

---

## Phase 3 — Polish (Could Have)

### 3.1 CI pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

**Effort:** Small

### 3.2 Health check endpoint

Add a Convex HTTP action at `/health`:

```ts
// convex/http.ts (add)
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});
```

**Effort:** Small

### 3.3 Keyboard shortcut (Ctrl+Enter)

Add to `App.tsx`:

```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleRefine();
    }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [handleRefine]);
```

**Effort:** Small

### 3.4 ARIA labels

Audit all icon-only buttons and add `aria-label`:

| Component | Buttons to fix |
|---|---|
| `App.tsx` | Lock/Unlock sidebar, Paste, Clear, Copy, Export, close buttons |
| `HistoryPage.tsx` | Delete, Load, Edit, Expand buttons |
| `DiffView.tsx` | Toggle change buttons |
| `VariantsPanel.tsx` | Chevron left/right |

**Effort:** Medium

---

## Phase 4 — Future (Won't Have This Cycle)

- **Email verification** — requires SMTP config + UI for resend
- **OAuth login (Google/GitHub)** — requires Better Auth OAuth plugin setup
- **AI response caching** — needs a cache table in Convex + cache key generation
- **Rate limiting** — would need a Convex rate limiter component or middleware
- **CSP headers** — requires platform-level config (Vite/Convex/Cloudflare)

---

## Summary Timeline

| Phase | Items | Estimated Effort | Dependencies |
|---|---|---|---|
| **Phase 0** — Quick Wins | 6 small tasks | 45 min | None |
| **Phase 1** — Security & Critical | 4 tasks | 3-4 days | Phase 0 (rename before refactoring services) |
| **Phase 2** — Code Health | 6 tasks | 4-5 days | Phase 1 (refactor after proxying API) |
| **Phase 3** — Polish | 4 tasks | 1-2 days | Phase 2 |
| **Phase 4** — Future | 4 tasks | Not scheduled | N/A |

**Total:** ~8-12 days for all Phases 0-3.
