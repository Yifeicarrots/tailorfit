# Plan: #2 Experience library

## Context
Issue #2 (story 1): users enter each experience and project once, then add, edit, delete, and list them on their own screen. Items are saved through `lib/storage/`, so they survive a reload. Input is checked with `experienceSchema`, and errors appear under each field. The Explore notes and decisions are in `docs/notes/02-experience-library-explore.md` (commits `5c70ef5`, `50138d2`).

**Decisions (from you):** `/library` route; signed-out users see "Please sign in first" with a link home; `crypto.randomUUID()` passed in, and bullet IDs stay stable on edit; a list of bullet inputs with add and remove; a month picker plus a "Current" checkbox (sets `endDate: null`); an empty organization becomes `undefined`; plain-language errors under each field; `confirm()` before delete; sorted current first, then start date newest first; load the library into state once after mount; back up invalid stored data before any save can overwrite it, and warn the user; no shared listener (known limitation); `lib/types.ts` unchanged.

## Design

### 1. Storage backup: `lib/storage/storage.ts` (TDD)
New export, with `loadLibrary` left as it is (DemoSignIn calls it inside a `useSyncExternalStore` snapshot, so it must stay free of side effects):
```ts
export function loadLibraryWithBackup(store: KeyValueStore):
  { library: ExperienceLibrary; backedUp: boolean }
```
- Missing key → `{ library: [], backedUp: false }`
- Valid data → `{ library, backedUp: false }`, with no write to the backup key
- Corrupt JSON **or** schema-invalid data → copy the raw string to `tailorfit:library:backup`, then return `{ library: [], backedUp: true }`. The backup is written on load, so it exists before any save.
- Reuse the parse logic from the private `readJson` helper, refactoring it to tell "missing" apart from "invalid" if needed.

### 2. Library edits: `lib/library/libraryEdits.ts` (TDD, pure)
- `addItem(library, item)`, `updateItem(library, item)` (replaces by `id`; library unchanged if the id is unknown), `deleteItem(library, id)`
- `sortLibrary(library)`: returns a new array with current items (`endDate === null`) first, then `startDate` descending. Sorting is stable for ties. Used for display; the stored order doesn't matter.

### 3. Form conversion: `lib/library/experienceForm.ts` (TDD, pure)
```ts
type ExperienceFormValues = {
  id: string; type: "experience" | "project"; title: string; organization: string;
  startDate: string; endDate: string; current: boolean;
  bullets: { id: string; text: string }[];
};
type FormField = "title" | "organization" | "startDate" | "endDate" | "bullets";
type FormErrors = Partial<Record<FormField, string>>;
```
- `emptyForm(newId)`: new item id and one empty bullet row, each with its own `newId()`.
- `formFromExperience(experience)`: keeps the item and bullet IDs (so edits keep IDs stable). `current = endDate === null`; `organization ?? ""`.
- `addBulletRow(values, newId)` / `removeBulletRow(values, bulletId)`: removing never leaves zero rows.
- `experienceFromForm(values)` → `{ ok: true; experience } | { ok: false; errors }`:
  - Trims text; `organization` "" → `undefined`; `current` → `endDate: null`; drops blank bullet rows.
  - Form-only rules: end date required unless Current; end date not before start date.
  - Then runs `experienceSchema.safeParse`. Each issue's `path[0]` maps to a field with a plain-language message, e.g. "Add a title.", "Pick a start month.", "Pick an end month, or tick Current.", "End month can't be before the start month.", "Add at least one bullet point."

### 4. UI: `app/library/` (no TDD)
- `page.tsx`: Server Component shell (`<main>`, heading, short intro, link home) rendering `<LibraryScreen />`.
- `LibraryScreen.tsx` (`"use client"`):
  - Uses `useSyncExternalStore` to read the user name, with `undefined` as the server snapshot → "Loading…". This is the same pattern as `DemoSignIn` and avoids hydration mismatches.
  - `null` → "Please sign in first" with `<Link href="/">`.
  - Signed in → renders `<LibraryEditor />`. That component is only mounted on the client, so its lazy `useState(() => loadLibraryWithBackup(browserStore()))` loads the library exactly once after mount, with no `setState` in an effect.
- `LibraryEditor.tsx` (`"use client"`):
  - Shows an amber warning if `backedUp`.
  - Lists `sortLibrary(library)` as cards: type badge, title, organization, date range ("2025-06 – Present"), and bullets. Each card has Edit and Delete buttons.
  - Add button. Only one form is open at a time (add, or editing one item).
  - On save: `addItem`/`updateItem` → `saveLibrary(browserStore(), next)` → `setLibrary(next)`.
  - Delete: `window.confirm("Delete “<title>”? This can't be undone.")` → `deleteItem` → save.
  - Passes `newId = () => crypto.randomUUID()` down.
- `ExperienceForm.tsx` (`"use client"`):
  - Fields: Experience/Project selector, title, organization, start month (`type="month"`), end month (disabled when Current is ticked) plus a Current checkbox, and bullet inputs with Remove and an "Add bullet" button.
  - Save and Cancel buttons. Error text (`text-red-600`) appears under each field, with `aria-describedby`.
- `app/DemoSignIn.tsx`: add a "Manage your library" `<Link href="/library">` to the signed-in view.
- Styling follows the zinc/Tailwind classes in `DemoSignIn.tsx` and `BulletComparison.tsx`.

**Known limitation:** no shared listener. DemoSignIn's library count and the library screen don't notify each other within one tab. Since they're on different routes, the count is up to date after navigating back.

**Out of scope:** changes to `lib/types.ts`, restoring from the backup, and reordering items by hand.

## Steps and commits
1. Copy this plan to `docs/plans/2026-11-22-experience-library.md` → `docs(library): plan experience library (#2)`.
2. Storage backup TDD, with separate `test(storage): [red] …` / `feat(storage): [green] …` commits:
   (a) valid and missing data → `backedUp: false`, no backup written; (b) schema-invalid data → backed up; (c) corrupt JSON → backed up. Then a refactor commit if needed.
3. `libraryEdits` TDD (scope `library`): add/update/delete cycle, then `sortLibrary` cycle.
4. `experienceForm` TDD (scope `library`): `emptyForm`/`formFromExperience`/bullet rows; valid conversion (trim, org → undefined, current → null, blank bullets dropped); each error rule.
5. `feat(library): experience library screen with add, edit, and delete`. This includes the DemoSignIn link.
6. Run `git pull --rebase`, push, and post a progress comment on #2 (checklist status and the known limitation).

Tests use `fakeStore()` (copied from `lib/storage/storage.test.ts`), a counter-based fake `newId`, and fictional data only.

## Verification
- `npm test`: all new and existing tests green.
- `npm run lint` and `npm run build` (type-check gate).
- `npm run dev` → http://localhost:3000:
  - Signed out, `/library` shows "Please sign in first" with a working link.
  - Sign in → "Manage your library" → add an experience (with organization) and a project (no organization, Current ticked).
  - Reload: both are still there, sorted with the current item first.
  - Edit an item's bullets: bullet IDs are unchanged in DevTools → Local Storage.
  - Submitting an empty title, a missing start month, an end before the start, and no bullets each shows its message under the field.
  - Delete: Cancel in `confirm()` keeps the item; OK removes it.
  - Set `tailorfit:library` to `{bad` in DevTools and reload: the warning shows and `tailorfit:library:backup` holds `{bad`.
