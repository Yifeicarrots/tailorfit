# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@docs/PRD.md

## Status

`app/page.tsx` and `app/layout.tsx` are still template code. Built so far: the shared Zod schemas in `lib/types.ts`, the model constant `CLAUDE_MODEL` in `lib/config.ts`, and `callClaude` in `lib/claude.ts` (the only SDK user; `createCallClaude(client)` is the testable factory); the no-invention check (`lib/pipeline/validate.ts`); and the bullet comparison screen (`app/review/`, with its reducer in `lib/review/`), which still runs on fixture data and a provisional type in `lib/review/provisionalRewrite.ts` until it switches to `RewriteResult` from `lib/types.ts`. `vitest.config.ts` excludes `evals/` and loads `vitest.setup.ts`, which mocks `server-only` once for all tests. `lib/storage/`, demo sign-in, and the `eval` script don't exist yet.

**Local only.** The app runs on `localhost` and must not be deployed publicly: there is no real authentication, so a public deployment would let anyone spend the Anthropic API key.

## Commands

- `npm run dev` — dev server at http://localhost:3000 (Turbopack)
- `npm run build` — production build; also the type-check gate (no separate `tsc` script)
- `npm run lint` — ESLint 9 flat config (no Prettier)
- `npm test` — Vitest unit tests only; no network, no API key
- `npm run eval` — real-API eval suite. **Humans only — never run it** (denied in `.claude/settings.json`)

## Stack

- **Next.js 16.4 / React 19.3, App Router** (`app/`, no `src/`). APIs differ from older Next.js — read `node_modules/next/dist/docs/` first.
- **`cacheComponents: true`**: fetching is dynamic by default, caching is opt-in via `"use cache"`, uncached dynamic data must sit under `<Suspense>`. **`partialPrefetching: true`** is also on.
- **Tailwind CSS v4** via a Turbopack loader rule (no `postcss.config`/`tailwind.config`); tokens in `app/globals.css` under `@theme inline`. Utility classes only — no CSS modules or component library.
- **Storage**: the browser's `localStorage`, behind a single module in `lib/storage/`. Data lives on one device and browser only. Sign-in is a demo with no real authentication.
- **Claude**: `@anthropic-ai/sdk`, model `claude-sonnet-5-5` defined in a single config constant — never hardcode it elsewhere.
- **Zod** validates every Claude JSON response.
- Pages use generated route types (e.g. `LayoutProps<"/">`) from `.next/types`. Path alias `@/*` → repo root.

## Architecture

- **Server Actions** run the pipeline. Selection and rewriting are **two separate actions** so the user can adjust the selection in between.
- **Storage** goes through `lib/storage/` only. Nothing else touches `localStorage` directly. Server Actions can't read browser storage, so client components load data from `lib/storage/` and pass it to the actions as arguments.
- **Pipeline code** lives in framework-free modules under `lib/pipeline/` (`experienceSelector.ts`, `resumeRewriter.ts`, `validate.ts`, `prompts.ts`). Prompts stay in `prompts.ts`, not inline.
- **Dependency injection**: stages receive a narrow `callClaude(system, prompt)` function, never the SDK client. Code that persists data receives the storage functions the same way, never `localStorage` itself.
- **Validation failures**:
  - Zod/JSON failure → retry the whole call once, then return an error.
  - Unknown ID (an ID in a Claude response that isn't in the input, e.g. the selector picks an item not in the library) → handled like a Zod/JSON failure: retry the whole call once, then return an error.
  - No-invention failure → retry once with feedback naming the problem. If it still fails, keep that bullet's original text, flag it, and keep the other valid rewrites.

## Conventions

- TypeScript strict, no `any`. Zod schemas are the source of truth; derive types with `z.infer`.
- The Zod schemas in `lib/types.ts` (experience, selection result, rewrite result) are shared contracts between the two teammates. Never change them without asking first.
- `camelCase` files in `lib/`, `PascalCase` React components, named exports only (except Next.js special files).
- Server Components by default; `"use client"` only on interactive leaves. Modules touching Claude import `"server-only"`. `lib/storage/` is browser-only and must never be imported by server code.
- Never log resume content, job descriptions, or Claude responses.
- Required env vars are listed in a committed `.env.example`; never commit `.env*` or put keys in code.
- Ask before adding any dependency.

## Testing

- **Strict TDD** for everything in `lib/` (including `lib/storage/`). Not required for UI components.
- **Red step**: write only the failing test. **Green step**: minimum implementation; never modify the test. Then refactor if needed.
- Unit tests are colocated (`foo.test.ts` beside `foo.ts`) and mock both `callClaude` and storage, injected the same way.
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
