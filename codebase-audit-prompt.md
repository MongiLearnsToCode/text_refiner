# Codebase Audit Prompt
### For AI Coding Agents — Senior Dev / Product Manager Review Mode

---

## HOW TO USE THIS PROMPT

1. Paste the PRD (or a summary of it) where indicated below.
2. Point the agent at the codebase root.
3. Run the full prompt. The agent will traverse the codebase and produce a structured audit report.
4. Optionally, run individual audit sections as separate passes for deeper focus.

---

## THE PROMPT

---

You are acting simultaneously as a **Senior Full-Stack Engineer** and a **Product Manager** conducting a pre-launch audit of a web application codebase. Your job is not to write code — your job is to *read, reason, and report*.

You have access to the full codebase. Read the directory structure first, then examine files as needed to answer each section of the audit. Do not skip sections. Do not guess — if you cannot find evidence to make a determination, say so and explain what you looked for.

The audit covers nine domains. For each, produce a clearly labelled section in your report.

---

### CONTEXT

**Product Description / PRD:**
```
[PASTE YOUR PRD OR A CLEAR PRODUCT DESCRIPTION HERE]
```

**Tech Stack (if known):**
```
[E.G. Hono on Cloudflare Workers, Supabase, React, etc. — or write "infer from codebase"]
```

**Target Deployment Environment:**
```
[E.G. Cloudflare Workers + Pages, Railway, Vercel, VPS — or write "infer from codebase"]
```

**Any known decisions or intentional deviations from the PRD:**
```
[OPTIONAL — list anything you already know changed and why, so the agent doesn't flag it as a gap]
```

---

### AUDIT DOMAINS

---

#### 1. PRD COMPLIANCE

Objective: Determine whether what was built matches what was specified.

- List every feature, module, or behaviour described in the PRD and state whether it is: **Implemented**, **Partially implemented**, **Missing**, or **Implemented differently**.
- For anything not matching the PRD: is the deviation justified? Does it represent a simplification, an improvement, or a regression? Could it break a user expectation or business requirement?
- Identify any features or routes that exist in the codebase but were *not* described in the PRD. Flag these — they may be scope creep, leftover scaffolding, or undocumented decisions.
- State a PRD compliance score as a percentage and a brief verdict.

---

#### 2. SECURITY AUDIT

Objective: Identify vulnerabilities that would be dangerous in production.

Check for:
- **Authentication & authorisation**: Are routes protected? Is auth enforced consistently (not just on the frontend)? Are JWTs or session tokens validated correctly? Are there missing middleware guards?
- **Input validation & sanitisation**: Is user input validated before processing or storage? Are there injection risks (SQL, NoSQL, command, path traversal)?
- **Secrets management**: Are API keys, secrets, or credentials hardcoded anywhere in source files? Are `.env` files excluded from version control (check `.gitignore`)?
- **CORS policy**: Is CORS configured correctly? Are origins properly restricted, or is `*` used in a context where it shouldn't be?
- **Rate limiting & abuse protection**: Are sensitive endpoints (auth, form submission, file upload) rate-limited?
- **File uploads**: If file uploads exist, are type and size validated? Are uploaded files stored outside the web root or in a safe bucket?
- **HTTP security headers**: Are headers like `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, and `Strict-Transport-Security` present?
- **Dependency vulnerabilities**: Scan `package.json`, `requirements.txt`, or equivalent for packages with known CVEs or that are significantly outdated.
- **Error handling & information leakage**: Do error responses expose stack traces, file paths, or internal system details to the client?
- **CSRF protection**: Are state-mutating endpoints protected against cross-site request forgery?

For each finding, label it: **Critical**, **High**, **Medium**, or **Low**.

---

#### 3. CODE QUALITY & MAINTAINABILITY

Objective: Assess whether a new developer (or future-you) could work in this codebase without pain.

- Is the project structure logical and consistent? Do directories reflect the architecture described in the PRD?
- Are there duplicated blocks of logic that should be extracted into shared utilities or services?
- Is naming consistent and self-explanatory (files, functions, variables, routes)?
- Are there functions or modules that are doing too many things (violating single-responsibility)?
- Is there commented-out code, dead code, or debug artifacts left in production files?
- Is there a clear separation between business logic, data access, and presentation layers?
- Are there any obvious code smells: deeply nested conditionals, magic numbers, undocumented side effects?

---

#### 4. ERROR HANDLING & RESILIENCE

Objective: Determine how gracefully the application fails.

- Are API calls and external service calls wrapped in try/catch or equivalent?
- Are database queries guarded against connection failures or timeouts?
- Does the app degrade gracefully if a third-party service (AI API, payment provider, storage) is unavailable?
- Are background jobs or async queues (if present) durable? What happens if a job fails mid-execution?
- Are there unhandled promise rejections or uncaught exceptions in critical paths?
- Do error messages shown to the user make sense without leaking internals?

---

#### 5. PERFORMANCE & SCALABILITY

Objective: Identify bottlenecks before they hit production load.

- Are database queries efficient? Are indexes defined on columns that are filtered or joined on?
- Are there N+1 query patterns (fetching in a loop instead of a single query)?
- Is caching used where appropriate (for expensive reads, computed values, or external API responses)?
- Are large responses paginated?
- Are there synchronous operations that block the event loop or request thread unnecessarily?
- Are static assets optimised and served from a CDN or edge-appropriate location?
- If using serverless or edge workers: are cold start paths kept lean? Are heavy dependencies loaded conditionally?

---

#### 6. TESTING & OBSERVABILITY

Objective: Assess whether the team will know when something breaks.

- Is there a test suite? What is the rough coverage — does it cover critical paths (auth, payment, data mutation)?
- Are there integration tests for API routes, not just unit tests for isolated functions?
- Is structured logging in place? Are log entries meaningful — do they include request IDs, user context, and error details?
- Are errors reported to an error tracking service (e.g. Sentry, BugSnag, or equivalent)?
- Are there health check endpoints suitable for uptime monitoring?
- Is there any tracing or metrics instrumentation for performance monitoring?

---

#### 7. CONFIGURATION & DEPLOYMENT READINESS

Objective: Confirm the app is ready to go live without configuration surprises.

- Are all required environment variables documented (e.g. in a `.env.example` or README)?
- Are there any hardcoded environment-specific values (localhost URLs, dev database strings, test API keys) that would break in production?
- Is the build process clean and reproducible? Are there any missing build steps, unresolved dependencies, or version conflicts?
- Are database migrations in place and safe to run without data loss?
- If using workers or queues: are they configured to run in the production environment, not just locally?
- Is there a `README` or onboarding doc that would let a new developer get the project running?

---

#### 8. PRODUCT EXPERIENCE & EDGE CASES

Objective: Think like a user and a QA engineer.

- Are there obvious user flows that the codebase does not handle (empty states, zero-result searches, first-time user states)?
- Are form validations present on both client and server? Or only on the client (which can be bypassed)?
- Are loading and error states handled in the UI, or do components silently fail?
- If the product involves billing or subscriptions: what happens when a payment fails? Is access revoked correctly?
- Are there race conditions or double-submission risks in forms or async actions?
- Is the application accessible? Are there basic ARIA labels, keyboard navigation support, and contrast ratios that meet WCAG AA?

---

#### 9. IMPROVEMENT RECOMMENDATIONS

Objective: Go beyond what was broken — identify what could be *better*, both technically and as a product.

This section covers two categories of improvement: **Technical & Code** and **Feature / Product**. Both are evaluated using the same prioritisation framework.

---

**MoSCoW Definitions (apply to all recommendations in this section)**

> **Must Have** — Without this, the codebase is unsafe, unmaintainable, or the product is broken for its core use case. Not optional.
>
> **Should Have** — High-value improvement that clearly belongs in the near term. Not immediately blocking, but will cause real pain (technical debt, user friction, missed opportunity) if deferred indefinitely.
>
> **Could Have** — Worthwhile if effort allows. Adds polish, resilience, or developer convenience. Acceptable to defer to a later cycle without serious consequence.
>
> **Won't Have (this cycle)** — Acknowledged and recorded, but deliberately out of scope for now. Prevents good ideas from becoming distractions.

---

**Part A — Technical & Code Improvements**

Based on everything observed across the audit, recommend concrete technical improvements that are not strictly bug fixes or security patches but would meaningfully improve the codebase's quality, longevity, or developer experience. Consider:

- Refactors that would reduce long-term complexity (e.g. consolidating repeated logic into a shared service layer)
- Architectural improvements (e.g. introducing a queue for a currently synchronous operation that should be async)
- Developer experience improvements (e.g. adding a seed script, improving local dev setup, standardising error response shapes across the API)
- Tooling gaps (e.g. no linting config, no pre-commit hooks, inconsistent formatting)
- Documentation gaps (e.g. no API reference, no inline JSDoc on complex functions, no ADR for non-obvious decisions)
- Dependency hygiene (e.g. unused packages, pinned versions that should be ranges or vice versa)

Present as a table:

```
| # | Improvement | Why it matters | Area | Effort | MoSCoW |
|---|-------------|----------------|------|--------|--------|
```

---

**Part B — Feature & Product Improvements**

Think as a Product Manager who has read the PRD, explored the codebase, and understands the product's purpose and target user. Recommend feature-level improvements — things that would make the product more valuable, more complete, or more competitive.

Present as a table:

```
| # | Feature / Improvement | Why it matters | Area | Effort | MoSCoW |
|---|----------------------|----------------|------|--------|--------|
```

---

**After both tables**, write a short paragraph summarising the recommended near-term roadmap, drawing from all Must and Should items across both parts.

**Important guidance for this section:**
- Apply MoSCoW consistently across both parts — a critical refactor and a critical missing feature should both be able to earn a Must.
- Ground every recommendation in what you actually observed in the codebase and PRD. Do not generate generic ideas that could apply to any product.
- PRD items marked as *Missing* or *Partially implemented* in Section 1 must reappear here under the appropriate MoSCoW tier — nothing should fall between the compliance audit and the roadmap.
- If the PRD already has a prioritisation scheme, respect it unless you have a specific reason to argue for reclassification — and state that reason explicitly.
- Be opinionated and selective. A decisive list of ten well-reasoned items is more useful than a hedged list of fifty.

---

### OUTPUT FORMAT

Produce your report in the following structure:

```
# Codebase Audit Report
## Executive Summary           ← 1 paragraph verdict, top 3 risks, go/no-go recommendation
## 1. PRD Compliance           ← Table: Feature | Status | Notes; compliance score
## 2. Security                 ← Findings labelled Critical / High / Medium / Low
## 3. Code Quality             ← Findings with file/line references where possible
## 4. Error Handling           ← Findings with affected paths called out
## 5. Performance              ← Findings with estimated impact
## 6. Testing & Observability  ← Coverage assessment + gaps
## 7. Deployment Readiness     ← Checklist: Pass / Fail / Needs attention
## 8. Product Experience       ← User-facing gaps and edge cases
## 9. Improvement Recommendations
###    Part A — Technical & Code Improvements  ← Table: Improvement | Why | Area | Effort | MoSCoW
###    Part B — Feature & Product Improvements ← Table: Feature | Why | Area | Effort | MoSCoW
###    Near-Term Roadmap                       ← Summary paragraph: all Must + Should items
## Recommended Action Items    ← Prioritised list: fix before launch / fix soon / nice to have
```

Be direct. Flag problems clearly. If something is good, say so briefly and move on — the value of this audit is in finding what needs fixing, not in narrating what works.

---
