Anki Chinese MVP
=================

Study Chinese with AI-generated flashcards. Built with Next.js App Router, Convex, and Clerk.

Prerequisites
- Node 18+
- Convex CLI: `npm i -g convex`
- Clerk account and application (publishable + secret keys)
- OpenAI API key

Environment
1) Copy `.env.example` → `.env.local` and fill:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CONVEX_URL` (from your Convex project)
2) In Convex env, set `OPENAI_API_KEY`:
   - `npx convex env set OPENAI_API_KEY sk-...`
3) (Optional) Admins for server enforcement:
   - `npx convex env set ADMIN_USER_IDS <userId1,userId2>`
   - userId is the Convex identity subject from `/admin/env` when signed in.

Convex Setup
1) Start Convex dev (generates `convex/_generated/*`):
   - `npx convex dev`
2) If you don’t have a project yet, the CLI will guide you; otherwise, link to an existing project.

Run Next.js
- `npm install`
- `npm run dev`

Testing (optional)
- E2E tests with Playwright
  - Install browsers: `npx playwright install --with-deps`
  - Run tests: `npx playwright test`
  - View report: `npx playwright show-report`
  - Config: `playwright.config.ts` (starts Next on port 3000)
  - Live E2E (auth + optional OpenAI) — opt-in:
    - Enable Email+Password in Clerk for your app and create a test user
    - Set env variables when running Playwright:
      - `E2E_LIVE=1 E2E_CLERK_EMAIL=<email> E2E_CLERK_PASSWORD=<password>`
      - Optional generate test (uses OpenAI via Convex): add `E2E_GENERATE=1`
    - Run: `E2E_LIVE=1 E2E_CLERK_EMAIL=... E2E_CLERK_PASSWORD=... npx playwright test tests/e2e-live.spec.ts`

Usage
1) Sign in via Clerk (modal on the home page).
2) Create a folder in the left sidebar.
3) Enter a Chinese word and click Generate to create a card.
4) Click a card to flip it; use the search bar to filter by original word.
5) Check env status at `/admin/env` (signed-in): confirms Convex URL, Clerk key, and Convex OPENAI_API_KEY.
6) Run preflight at `/admin/preflight`: quick end-to-end connectivity checks.

Backend
- Convex schema: `convex/schema.ts` with `folders` and `cards`.
- Folders API: `convex/folders.ts` → list/create/delete (non-empty delete blocked).
- Cards API: `convex/cards.ts` → listByFolder/save/update/delete/move/search.
- AI Generation: `convex/generateCard.ts` → duplicate guard, rate limits (5/min, 20/day), OpenAI call with strict JSON validation.

Configuration Notes
- Clerk: ensure both publishable and secret keys are set. In production, configure redirect URLs in Clerk dashboard.
- Convex: set `OPENAI_API_KEY` only in Convex env; not in Next.js `.env.local`.
- Tailwind: configured via `tailwind.config.ts` and `app/globals.css`.

Deployment (Cloudflare Pages + Convex)
1) Deploy Convex to production via `npx convex deploy`; copy the prod URL into `NEXT_PUBLIC_CONVEX_URL`.
2) Create a Cloudflare Pages project from this repo.
3) Set environment variables in Cloudflare Pages:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CONVEX_URL` (use Convex prod URL)
4) Build command: `npm run build`; Output directory: `.next` (Cloudflare will handle Next.js).
5) In Convex prod env, set: `npx convex env set --prod OPENAI_API_KEY sk-...`
  - (Optional) Set admins: `npx convex env set --prod ADMIN_USER_IDS <id1,id2>`
6) Health endpoint: `/api/health` returns `{ ok: true }` for uptime checks.

Notes
- All Convex functions require auth. The UI uses Clerk `SignedIn`/`SignedOut` gates.
- If you see type errors on first run, ensure `npx convex dev` has generated `_generated` types.
