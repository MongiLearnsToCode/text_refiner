# Finer Text

A web application that transforms messy, unstructured text into clean, professional writing using AI. Also features a **Developer Mode** that converts rough ideas into structured prompts for AI coding agents (Cursor, Claude, GPT).

## Tech Stack

- **Frontend:** React 19, TypeScript 5.8, Vite 6
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Backend / Database:** Convex (realtime, reactive full-stack platform)
- **AI:** Groq SDK — Meta's Llama 3.3 70B
- **Auth:** Better Auth (email/password)
- **Payments:** Polar.sh / Stripe

## Prerequisites

- Node.js 18+
- A Convex account (free at https://convex.dev)
- A Groq API key (free at https://console.groq.com)
- A Polar.sh account for subscriptions (optional for local dev)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   Copy `.env.example` to `.env.local` and fill in the values:
   ```bash
   cp .env.example .env.local
   ```

3. **Run Convex dev server:**
   ```bash
   npx convex dev
   ```
   This will prompt you to log in to Convex and create a deployment. It also creates the `.env.local` file with your `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` values.

4. **Start the dev server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key for LLM calls (server-side) |
| `CONVEX_DEPLOYMENT` | Yes | Set automatically by `npx convex dev` |
| `VITE_CONVEX_URL` | Yes | Set automatically by `npx convex dev` |
| `VITE_CONVEX_SITE_URL` | Yes | Convex site URL for auth endpoints |
| `VITE_SITE_URL` | Yes | Your app's URL (e.g. `http://localhost:3000`) |
| `POLAR_ACCESS_TOKEN` | For payments | Polar.sh API token |
| `POLAR_PRODUCT_ID` | For payments | Polar.sh product ID for Pro subscription |
| `POLAR_WEBHOOK_SECRET` | For payments | Polar.sh webhook signing secret |
| `VITE_SENTRY_DSN` | Optional | Sentry DSN for error tracking |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run test` | Run test suite |

## Deployment

Deploy the frontend to any static host (Vercel, Netlify, Cloudflare Pages):

```bash
npm run build
```

The `dist/` folder contains the production build.

For the Convex backend, run:
```bash
npx convex deploy
```

Ensure all environment variables are set in your deployment environment.
