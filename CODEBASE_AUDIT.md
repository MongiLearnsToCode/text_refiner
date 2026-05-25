# Codebase Audit Report — Finer Text

## Executive Summary

Finer Text (formerly "Text Refiner & Prompt Builder") is a well-architected single-page React application that refines unstructured text using AI (Groq/LLaMA). The codebase is production-capable in terms of core functionality — auth, subscriptions, pagination, and the refinement pipeline all work correctly — but has three critical gaps that must be addressed before launch: **zero tests**, **client-side API key exposure**, and **no error monitoring/observability**. The auth and payment flows are well-structured with proper webhook signature validation and server-side enforcement. Code quality is generally good but `App.tsx` (1091 lines) is a monolithic component that needs refactoring. The app is deployable with standard Vite/Convex tooling, but the README is outdated and references AI Studio rather than the actual deployment process.

**Top 3 Risks:**
1. **No test suite** — every deploy is a blind push; auth, payment, and refinement flows have zero coverage
2. **API key exposed client-side** — the Groq API key is baked into the browser bundle via Vite `define`
3. **No error tracking** — unhandled errors in production will be invisible to the team

**Go/No-Go Recommendation:** **Conditional Go** — the app is functionally complete but should not launch without test coverage for the payment webhook flow and a server-side proxy for the AI API.

---

## 1. PRD Compliance

No PRD was provided with the audit prompt. The following assessment is based on the product description inferred from the codebase, UI copy, and `APP_DESCRIPTION.md`.

| Feature | Status | Notes |
|---|---|---|
| Text refinement (7 modes) | **Implemented** | 3 free + 4 Pro modes in `geminiService.ts` |
| Editing toggle chips | **Implemented** | Em Dashes, Grammar, Clarity, Structure, Tone |
| Context & tone selection | **Implemented** | 6 contexts, 5 tone options |
| Word length targeting | **Implemented** | Short/Medium/Long/Custom |
| Custom style guide | **Implemented** | Textarea in sidebar, injected into prompt |
| Developer Mode | **Implemented** | Presets for Cursor/Claude/GPT + Structure Generator + Optimisation Pass |
| Prompt templates (save/load) | **Implemented** | CRUD against Convex `promptTemplates` table |
| Side-by-side diff view | **Implemented** | Word-level diff with accept/reject toggles in `DiffView.tsx` |
| Alternative variants | **Implemented** | `variantsService.ts` generates 2 variants via separate LLM call |
| Readability scoring | **Implemented** | Flesch-Kincaid, Pro-only, in `readability.ts` |
| AI detection scoring | **Implemented** | 8-signal weighted analysis in `aiDetection.ts` |
| Prompt quality scoring | **Implemented** | 4-dimension scoring in `promptScore.ts` |
| Export (txt, md, PDF) | **Implemented** | Pro-only, via Blob download + jsPDF |
| User auth (email/password) | **Implemented** | Better Auth + Convex component |
| Usage tracking (20/mo) | **Implemented** | `usage.ts` with YYYY-MM keys |
| Subscription payments | **Implemented** | Polar.sh/Stripe with webhook handling |
| Refinement history | **Implemented** | Paginated, searchable, filterable, list/grid views |
| Version history (in-memory) | **Implemented** | `PromptVersion[]` in state |
| Mobile responsive | **Implemented** | Bottom nav, tab switcher, settings sheet |
| Dark mode | **Implemented** | CSS variables, `.dark` class |

**PRD Compliance Score:** N/A (no PRD provided) — inferred feature completeness appears high.

---

## 2. Security Audit

| # | Finding | Severity | Details |
|---|---|---|---|
| 1 | **Groq API key exposed in client bundle** | **Critical** | `VITE_GROQ_API_KEY` is injected at build time via Vite `define` and used with `dangerouslyAllowBrowser: true` in `geminiService.ts:4` and `variantsService.ts:4`. Anyone inspecting the JS bundle can extract the key and make unauthorised LLM calls at the project's expense. |
| 2 | **No rate limiting on any endpoint** | **High** | Auth endpoints, the AI refinement call, and the usage-check mutation have no rate limiting. An attacker could exhaust the free-tier limit for all users or spam the Groq API. |
| 3 | **No Content-Security-Policy headers** | **Medium** | The app serves without CSP headers, leaving it open to XSS attacks if user-generated content (markdown output) contains malicious scripts. |
| 4 | **No security headers at all** | **Medium** | No `X-Frame-Options`, `X-Content-Type-Options`, or `Strict-Transport-Security` headers present. |
| 5 | **`alert()` for error messages** | **Medium** | Several error paths use `alert()` (`App.tsx:214`, `App.tsx:261`, `ProfilePage.tsx:35,45`) instead of user-friendly inline messages. This is a UX issue but also potentially exposes internal error details. |
| 6 | **No input size validation on backend** | **Medium** | The `refinements.save` mutation accepts arbitrary-length `inputText` and `outputText` strings. No max-length validation exists on the server side. |
| 7 | **No CSRF protection on auth routes** | **Low** | Better Auth's `crossDomain` plugin handles this adequately, but the Convex HTTP route for auth does not appear to have explicit CSRF token validation. |
| 8 | **Secrets in `.env.example`** | **Low** | The `.env.example` file correctly excludes real secrets and uses placeholder values. `.env*` is properly in `.gitignore` (line 7). Good. |
| 9 | **Webhook signature validation** | **✅ Good** | Polar webhooks are validated via `@polar-sh/sdk/webhooks.validateEvent()` in `polarActions.ts:93`. |
| 10 | **Backend auth enforcement** | **✅ Good** | Every mutation and query checks `ctx.auth.getUserIdentity()` and throws `"Not authenticated"` if missing. |
| 11 | **Owner authorization checks** | **✅ Good** | `refinements.remove`, `refinements.updateLabel`, `promptTemplates.remove`, `promptTemplates.rename` all verify `doc.userId === identity.tokenIdentifier` before mutating. |

---

## 3. Code Quality & Maintainability

| # | Finding | Details | File:Line |
|---|---|---|---|
| 1 | **Monolithic `App.tsx` (1091 lines)** | The entire editor UI, state management, layout, sidebar logic, mobile sheet, output panel, and all event handlers live in one file. Violates single-responsibility principle. | `src/App.tsx:1-1091` |
| 2 | **Misnamed service file** | `geminiService.ts` calls **Groq** (not Gemini). The `@google/genai` package is unused. This is misleading for any developer reading the code. | `src/services/geminiService.ts:1` |
| 3 | **Unused dependencies** | `@google/genai`, `express`, `dotenv` are listed in `package.json` but not used in any meaningful way. `autoprefixer` is redundant with Tailwind v4. | `package.json:19,29-30,47` |
| 4 | **Loose `any` types** | `isUserPro` in `usage.ts` uses `ctx: any` and `q: any`. No type safety for these parameters. | `convex/usage.ts:10-16` |
| 5 | **No JSDoc on complex functions** | The AI detection scorer (`scoreAILikelihood`), readability scorer, and prompt builder have no documentation beyond inline comments. | `src/utils/*.ts` |
| 6 | **Hardcoded strings in business logic** | FREE_TIER_LIMIT is a constant (good), but processing mode names are duplicated between `App.tsx` (FREE_MODES, PRO_MODES) and `geminiService.ts` (string comparisons). A shared enum would be better. | `src/App.tsx:44-57`, `src/services/geminiService.ts:50-121` |
| 7 | **No TypeScript strict mode** | `tsconfig.json` has no `strict: true`. Several `any` casts and implicit `any` types exist. | `tsconfig.json` |
| 8 | **Consistent naming conventions** | ✅ Good — files use camelCase, components use PascalCase, Convex functions are well-named. |
| 9 | **Clean folder separation** | ✅ Good — clear separation between `convex/` (backend), `src/services/` (AI calls), `src/utils/` (scoring), `src/components/` (UI). |
| 10 | **No commented-out code or debug artifacts** | ✅ Clean. |

---

## 4. Error Handling & Resilience

| # | Finding | Details | File:Line |
|---|---|---|---|
| 1 | **Groq API calls wrapped in try/catch** | ✅ Good — both `refineText` and `generateVariants` catch errors and return user-friendly messages. | `geminiService.ts:209-215`, `variantsService.ts:32-41` |
| 2 | **Usage limit error properly handled** | ✅ Good — `USAGE_LIMIT_EXCEEDED` is caught in `App.tsx:211` and triggers the upgrade modal. | `App.tsx:209-218` |
| 3 | **Webhook error handling** | ✅ Good — signature verification errors are caught and return 400. | `polarActions.ts:92-103`, `http.ts:22-32` |
| 4 | **`alert()` for user-facing errors** | ⚠️ Several paths use `alert()` instead of inline error messages or toast notifications. Poor UX and can appear jarring. | `App.tsx:214,261`, `ProfilePage.tsx:35,45` |
| 5 | **No failure degradation for AI service** | If the Groq API is down, the user gets "Failed to refine text. Please try again." with no retry logic or queue. | `geminiService.ts:214` |
| 6 | **No timeout on AI calls** | The Groq SDK has no explicit timeout configured. A hung request could leave the user staring at a spinner indefinitely. | `geminiService.ts:176-179` |
| 7 | **No unhandled promise rejection handler** | No `window.onunhandledrejection` or equivalent. Unhandled rejections in production could cause silent failures. | — |
| 8 | **Convex mutation errors are propagated** | Convex mutations throw on auth failure and are caught by the caller. Exceptions do not leak stack traces to the client due to Convex's error serialisation. ✅ |

---

## 5. Performance & Scalability

| # | Finding | Impact | Details |
|---|---|---|---|
| 1 | **Convex queries properly indexed** | ✅ Low | All five indexes in `schema.ts` are used by their respective queries. No table scan concerns. |
| 2 | **No N+1 queries** | ✅ Low | The `list` query uses a single indexed query with pagination. `getUsage` uses `Promise.all` for two parallel queries. |
| 3 | **History pagination** | ✅ Low | `usePaginatedQuery` with 20-item pages prevents unbounded data fetches. |
| 4 | **Client-side AI calls are synchronous** | ⚠️ Medium | Each refinement makes 1–2 sequential API calls to Groq. Large texts (>2000 words) may take 10+ seconds. The UI shows a spinner but offers no cancellation mechanism. |
| 5 | **No caching for AI responses** | ⚠️ Low | If a user refines the same text twice with the same settings, the LLM is called again. No response deduplication. |
| 6 | **Large state in a single component** | ⚠️ Low | All state in `App.tsx` means any state change triggers re-renders of the entire component tree. With React 19's compiler optimizations this is mitigated, but it's a smell. |
| 7 | **No image optimisation** | ✅ N/A | No images served. |
| 8 | **Static assets served via Vite** | ✅ Low | Vite produces tree-shaken, minified bundles with code splitting. |

---

## 6. Testing & Observability

| # | Finding | Severity | Details |
|---|---|---|---|
| 1 | **Zero tests** | **Critical** | No test files exist anywhere in the codebase (no `*.test.*`, `*.spec.*`, or `__tests__/` directories). No test framework configured in `package.json`. |
| 2 | **No structured logging** | **High** | The only log calls are `console.error` in `geminiService.ts:210`. No request IDs, no user context, no structured log format. |
| 3 | **No error tracking service** | **High** | No Sentry, Bugsnag, or equivalent integration. Production errors will be invisible. |
| 4 | **No health check endpoint** | **Medium** | No `GET /health` or equivalent for uptime monitoring. |
| 5 | **No Convex function tracing** | **Medium** | Convex provides built-in function logging in the dashboard, but no custom tracing or metrics are instrumented. |
| 6 | **No CI/CD pipeline** | **Medium** | No `.github/workflows/` or CI config found. No automated linting or type-checking on push. |

---

## 7. Configuration & Deployment Readiness

| # | Item | Status | Details |
|---|---|---|---|
| 1 | `.env.example` documents all required vars | ✅ Pass | All 5 environment variables documented with descriptions. |
| 2 | Hardcoded environment-specific values | ⚠️ Needs attention | `SITE_URL` defaults to `http://localhost:3000` in `polarActions.ts:26`. Will break in production if `SITE_URL` is not set. |
| 3 | Build process is clean | ✅ Pass | `npm run build` runs `vite build`. Reproducible with lockfile. |
| 4 | Database migrations | ✅ Pass | Convex handles schema implicitly — no migration scripts needed. Schema changes require `npx convex deploy`. |
| 5 | README onboarding | ❌ Fail | README.md references "AI Studio" and `GEMINI_API_KEY`, not the actual Groq API key or Convex setup. Will confuse a new developer. |
| 6 | `lint` script is type-check only | ⚠️ Needs attention | `package.json:11` defines `"lint": "tsc --noEmit"`. No ESLint or Prettier configured. |
| 7 | `tsconfig.json` lacks `strict: true` | ⚠️ Needs attention | No strict mode, no `noUncheckedIndexedAccess`, no `exactOptionalPropertyTypes`. |
| 8 | `package.json` name is generic | Low | `"name": "react-example"` — should be updated to `"finer-text"`. |

---

## 8. Product Experience & Edge Cases

| # | Finding | Severity | Details |
|---|---|---|---|
| 1 | **Password reset flow missing** | **Medium** | No "Forgot password?" link on the sign-in page. Users who forget their password cannot recover their account. |
| 2 | **No email verification** | **Low** | `requireEmailVerification: false` in `auth.ts:21`. Users can sign up with any email. |
| 3 | **`alert()` for error messages** | **Medium** | Error feedback uses the browser's native `alert()` dialog, which is jarring and non-customisable. | `App.tsx:214,261`, `ProfilePage.tsx:35,45` |
| 4 | **Empty states handled** | ✅ Good | History page shows "No refinements yet" and "No results match your filters" states. Output panel shows "Refined text will appear here..." placeholder. |
| 5 | **Loading states** | ✅ Good | Spinners shown during refinement, variant generation, checkout, and subscription actions. |
| 6 | **Double-submission prevention** | ✅ Good | `refineDisabled` (line 304) disables the button while processing. Subscription action buttons are also disabled during loading. |
| 7 | **Accessibility concerns** | **Medium** | Many interactive elements use `<button>` with icon-only content and no `aria-label`. The diff view uses semantic markup but color-only differentiation (green/red/amber) without text labels may fail WCAG 1.4.1. |
| 8 | **No keyboard shortcut for refine** | **Low** | Users must click the "Refine Text" button — no Ctrl+Enter or similar shortcut. |
| 9 | **Payment failure handling** | ✅ Good | Errors from `createCheckoutSession` are caught and displayed in the modal. Subscription cancellation and resume flows are well-structured. |
| 10 | **No confirmation before delete** | **Medium** | History entries are deleted immediately on click with no "Are you sure?" confirmation. Accidental deletion is irreversible. | `HistoryPage.tsx:372` |

---

## 9. Improvement Recommendations

### Part A — Technical & Code Improvements

| # | Improvement | Why it matters | Area | Effort | MoSCoW |
|---|---|---|---|---|---|
| 1 | **Add a test suite** | Zero tests means every deploy risks regression in auth, payment, or refinement flows | Testing | Large | **Must Have** |
| 2 | **Proxy Groq API through Convex action** | API key is currently exposed in the client bundle; move to a Convex action or server endpoint | Security | Medium | **Must Have** |
| 3 | **Add error tracking (Sentry)** | Production errors are invisible without monitoring; Sentry also provides breadcrumbs and replay | Observability | Small | **Must Have** |
| 4 | **Refactor `App.tsx` into smaller components** | 1091-line component is unmaintainable; extract sidebar, header, editor panels, mobile layout | Architecture | Large | **Should Have** |
| 5 | **Add ESLint + Prettier config** | No linting beyond `tsc --noEmit` means inconsistent code style and missed bugs | Tooling | Small | **Should Have** |
| 6 | **Rename `geminiService.ts` and remove unused deps** | Misleading name wastes developer time; unused deps bloat `node_modules` | Hygiene | Small | **Should Have** |
| 7 | **Enable `strict: true` in tsconfig** | Catches `any` casts, null checks, and implicit `any` at compile time | Type Safety | Medium | **Should Have** |
| 8 | **Add proper logging (pino or Convex console)** | Replaces `console.error` with structured, queryable log entries | Observability | Small | **Should Have** |
| 9 | **Add health check endpoint** | Enables uptime monitoring and automated deploy health checks | Deployment | Small | **Could Have** |
| 10 | **Add CI pipeline with type-check + lint** | Catches errors before they reach production | Tooling | Medium | **Could Have** |

### Part B — Feature & Product Improvements

| # | Feature / Improvement | Why it matters | Area | Effort | MoSCoW |
|---|---|---|---|---|---|
| 1 | **Password reset flow** | Users will inevitably forget passwords; currently no recovery path | Auth | Small | **Must Have** |
| 2 | **Delete confirmation dialogs** | History deletions are irreversible with no confirmation | UX | Small | **Should Have** |
| 3 | **Replace `alert()` with toast notifications** | Native `alert()` dialogs block the UI and look unprofessional | UX | Small | **Should Have** |
| 4 | **Add keyboard shortcut (Ctrl+Enter) for refine** | Power users expect keyboard shortcuts for repeated actions | UX | Small | **Could Have** |
| 5 | **Add ARIA labels and improve contrast** | Screen reader users and users with low vision need accessible UI | Accessibility | Medium | **Could Have** |
| 6 | **Add email verification flow** | Reduces spam accounts and improves account security | Auth | Medium | **Could Have** |
| 7 | **Support OAuth login (Google/GitHub)** | Reduces sign-up friction; users expect social login | Auth | Medium | **Won't Have** |

### Near-Term Roadmap

The **Must Have** items from both parts define the pre-launch critical path:

1. **Proxy the Groq API through a server-side endpoint** (a Convex action) to eliminate the client-side API key exposure — this is the single biggest security risk.
2. **Add a test suite** covering at minimum: the Polar.sh webhook handler (the most complex and critical data flow), the usage limit enforcement, and the auth gating on mutations.
3. **Integrate Sentry or equivalent error tracking** so production errors are visible.
4. **Add a password reset flow** — without it, a significant fraction of users will be locked out and churn.

**Should Have** items (next cycle): refactor `App.tsx`, enable `strict` tsconfig, set up ESLint/Prettier, add delete confirmations, replace `alert()` with toasts, and add structured logging.

---

## Recommended Action Items

### Fix Before Launch
1. Move Groq API calls to a Convex action (eliminates client-side key exposure)
2. Add Sentry error tracking
3. Add password reset flow
4. Add test coverage for the Polar.sh webhook handler and the usage limit enforcement
5. Update README.md with accurate setup instructions (currently references AI Studio)
6. Ensure `SITE_URL` env var is set in production (defaults to `localhost:3000`)

### Fix Soon
7. Refactor `App.tsx` into maintainable modules
8. Enable `strict: true` in `tsconfig.json`
9. Set up ESLint + Prettier
10. Replace `alert()` calls with a toast notification system
11. Add delete confirmation dialogs to history
12. Rename `geminiService.ts` and prune unused dependencies
13. Add structured logging (replace `console.error`)

### Nice to Have
14. Add CI pipeline (GitHub Actions)
15. Add health check endpoint
16. Add keyboard shortcut for "Refine Text"
17. Improve ARIA labels and accessibility
18. Add email verification
19. Add OAuth login providers
