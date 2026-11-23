# Plan: #7 Bullet comparison screen

## Context
Issue #7 (stories 6 and 7): the user sees each original bullet next to its rewrite and must accept or edit every one. Flagged bullets (the rewrite failed the no-invention check, so the original was kept) are clearly marked with the reason. A final version shows every bullet as accepted or edited. It's built first against fictional fixture data and connected to the rewriter's Server Action later. #1 (`lib/types.ts`) and #6's Server Action don't exist yet. For Part 2, this feature also shows Explore → Plan → Implement → Commit in the git history.

**Decisions (from you):**
- Use a provisional local type until #1 merges, and comment on #1 listing the fields the screen needs.
- Put the review state in a reducer in `lib/` and build it with strict TDD.

## Explore findings
- `app/page.tsx` and `app/layout.tsx` are still the scaffold. There are no components, no routes, and no `lib/types.ts`.
- `app/globals.css` has only `background`/`foreground` tokens. Use Tailwind utilities, no component library.
- Next 16 docs (`node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`): pages are Server Components, and `"use client"` goes on interactive leaves only. Static fixture data is fine under `cacheComponents` (no dynamic data, so no Suspense needed).
- `lib/pipeline/validate.ts` produces one problem sentence per invented term. Those sentences are the natural `flagReason` text.

## Design

**Provisional type**: `lib/review/provisionalRewrite.ts` (header comment: replace with `z.infer` from `lib/types.ts` once #1 merges)
```ts
type ProvisionalRewriteResult = {
  items: { id: string; title: string;
    bullets: { original: string; rewritten: string; flagged: boolean; flagReason?: string }[] }[]
}
```
`title` probably comes from the selected experience, not the rewrite result. At integration we'll merge it in, so the screen's props stay the same.

**Reducer**: `lib/review/bulletReview.ts`, pure functions, no React
- `initReview(result)`: one entry per bullet, keyed `${itemId}:${index}`, status `pending`.
- `reviewReducer(state, action)`:
  - `{ type: "accept", key }`: final text is the rewrite, or the original for a flagged bullet; status `accepted`.
  - `{ type: "edit", key, text }`: final text is `text`; status `edited`. Works from any status, so a decision can be changed.
- `isComplete(state)`: true when no bullet is `pending`.
- `finalBullets(state)`: final text grouped by item, in the original order.

**UI**: `app/review/`
- `page.tsx`: Server Component shell with heading and short instructions; renders `<BulletComparison result={sampleRewrite} />`.
- `BulletComparison.tsx` (`"use client"`): `useReducer` over the lib reducer. Groups rows by item and shows "N of M reviewed".
  - Each row has two columns, Original | Rewrite, plus Accept / Edit. Edit opens an inline textarea prefilled with the current text, with Save/Cancel. A status badge shows Pending / Accepted / Edited.
  - Flagged rows get an amber border and the note "Original kept: rewrite added something not in your bullet", followed by the `flagReason`. The right column shows the original. Accept keeps the original; Edit is allowed.
  - A Final version panel shows each item's final bullets once `isComplete`. Until then it shows a disabled placeholder.
- Fixture: `lib/review/sampleRewrite.ts`, for a fictional person ("Maya Okafor", fictional employers), 2 items and about 5 bullets, with one flagged bullet whose `flagReason` is in `validate.ts`'s wording.

**Not in scope**: export or copy (PRD), persisting review state to storage, the Server Action connection (blocked on #1/#6; left unchecked on #7).

## Steps and commits
1. Comment on #1 listing the fields the screen needs: per bullet `original`, `rewritten`, `flagged`, `flagReason`; per item `id`, plus `title` from the selected experience. Commit this plan as `docs/plans/2026-11-22-bullet-comparison.md`: `docs: plan bullet comparison screen`.
2. TDD the reducer, with separate red, green and refactor commits for each cycle:
   - `initReview` + `accept` (normal and flagged)
   - `edit` (including changing an earlier decision)
   - `isComplete` + `finalBullets`
3. `feat(review): add provisional rewrite type and fictional fixture`
4. `feat(review): bullet comparison screen with accept, edit, and flagged states`
5. Delete `lib/placeholder.test.ts` now that real tests exist, and update CLAUDE.md's Status section: `chore: remove placeholder test`.
6. Run `git pull --rebase`, then push. Add a progress comment on #7.

## Verification
- `npm test`: reducer tests pass, and the validate tests are still green.
- `npm run lint` and `npm run build` pass (build is the type-check gate).
- `npm run dev`, then open http://localhost:3000/review and check that:
  - Accept and Edit both work.
  - The flagged bullet shows the original and the reason.
  - The counter updates.
  - The final panel appears only after every bullet is decided.
