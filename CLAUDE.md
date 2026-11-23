# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@docs/PRD.md

## Status

Fresh `create-next-app` scaffold: `app/page.tsx` and `app/layout.tsx` are still template code. Planned dependencies are not yet installed: `@anthropic-ai/sdk`, `zod`, `@supabase/supabase-js`, `@supabase/ssr`, `vitest` (plus a `test` script).

## Commands

- `npm run dev` — dev server at http://localhost:3000 (Turbopack)
- `npm run build` — production build; also the type-check gate (no separate `tsc` script)
- `npm run lint` — ESLint 9 flat config (no Prettier)
- `npm test` — Vitest unit tests only; no network, no API key
- `npm run eval` — real-API eval suite. **Humans only — never run it** (denied in `.claude/settings.json`)
- `supabase db push` — apply `supabase/migrations/` to the hosted project

## Stack

- **Next.js 16.4 / React 19.3, App Router** (`app/`, no `src/`). APIs differ from older Next.js — read `node_modules/next/dist/docs/` first.
- **`cacheComponents: true`**: fetching is dynamic by default, caching is opt-in via `"use cache"`, uncached dynamic data must sit under `<Suspense>`. **`partialPrefetching: true`** is also on.
- **Tailwind CSS v4** via a Turbopack loader rule (no `postcss.config`/`tailwind.config`); tokens in `app/globals.css` under `@theme inline`. Utility classes only — no CSS modules or component library.
- **Supabase**: Google sign-in + hosted Postgres with row-level security. Schema changes via the Supabase CLI.
- **Claude**: `@anthropic-ai/sdk`, model `claude-sonnet-5-5` defined in a single config constant — never hardcode it elsewhere.
- **Zod** validates every Claude JSON response.
- Pages use generated route types (e.g. `LayoutProps<"/">`) from `.next/types`. Path alias `@/*` → repo root.

## Architecture

- **Server Actions** run the pipeline. Selection and rewriting are **two separate actions** so the user can adjust the selection in between.
- **Every Server Action verifies the signed-in user first**, before any other work.
- **Supabase access** uses a server client created from the user's session so RLS applies. **Never use the service role key for user data.**
- **Pipeline code** lives in framework-free modules under `lib/pipeline/` (`experienceSelector.ts`, `resumeRewriter.ts`, `validate.ts`, `prompts.ts`). Prompts stay in `prompts.ts`, not inline.
- **Dependency injection**: stages receive a narrow `callClaude(system, prompt)` function, never the SDK client. Data-access functions receive the Supabase client.
- **Validation failures**:
  - Zod/JSON failure → retry the whole call once, then return an error.
  - No-invention failure → retry once with feedback naming the problem. If it still fails, keep that bullet's original text, flag it, and keep the other valid rewrites.

## Conventions

- TypeScript strict, no `any`. Zod schemas are the source of truth; derive types with `z.infer`.
- `camelCase` files in `lib/`, `PascalCase` React components, named exports only (except Next.js special files).
- Server Components by default; `"use client"` only on interactive leaves. Modules touching Claude or the Supabase server client import `"server-only"`.
- Never log resume content, job descriptions, or Claude responses.
- Every schema change gets a migration in `supabase/migrations/`, with RLS policies in the same migration as their table.
- Required env vars are listed in a committed `.env.example`; never commit `.env*` or put keys in code.
- Ask before adding any dependency.

## Testing

- **Strict TDD** for everything in `lib/` and for the auth check in every Server Action. Not required for UI components.
- **Red step**: write only the failing test. **Green step**: minimum implementation; never modify the test. Then refactor if needed.
- Unit tests are colocated (`foo.test.ts` beside `foo.ts`) and mock both `callClaude` and Supabase.
- Evals live in `evals/` and are excluded from the Vitest config. Fixtures are JSON in `evals/fixtures/`; each run's scores are saved to `evals/results/` with the date. Evals run manually, never in CI.
- Claude may draft fictional resumes and job descriptions for fixtures, but **never writes or edits the "must include" labels** — the two team members label them independently.
- Never weaken a validation check, loosen a Zod schema, or edit a fixture to make a test or eval pass.

## Git

- Conventional Commits with scopes: `feat(selector):`, `fix(rewriter):`, `docs:`, `chore:`, plus custom `eval:`.
- TDD steps are separate commits, marked after the colon:
  `test(rewriter): [red] …` → `feat(rewriter): [green] …` → `refactor(rewriter): …`.
  A failing suite on `main` after a red commit is expected — don't add hooks that block it.
- Committing directly to `main` is fine; feature branches are optional for larger work. No reviews; self-merge.
- Always `git pull --rebase` before pushing. Rebasing a branch onto `main` before merging is fine.
- **Never squash.** Never rebase commits that have been pushed and pulled by the other person.
