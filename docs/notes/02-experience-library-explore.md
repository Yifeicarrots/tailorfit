# #2 Experience library: exploration notes

Explore phase only. No code was written or changed.

## What #2 asks for

From `gh issue view 2` (story 1, depends on #1, which is closed):

- Add an experience or project with its bullet points
- Edit an item and its bullets
- Delete an item
- List every saved item
- Items survive a reload because they're saved through `lib/storage/`
- Input is checked with the experience schema from `lib/types.ts`, and invalid input shows an error
- Only the interactive parts are `"use client"` components

## Relevant files

| File | What it gives #2 |
| --- | --- |
| `lib/types.ts` | `experienceSchema`, `bulletSchema`, `experienceLibrarySchema`, and the types `Experience`, `Bullet`, `ExperienceLibrary`. Shared contract: **do not change without asking the teammate.** |
| `lib/types.test.ts` | Shows what the schema accepts and rejects: dates must be `YYYY-MM` (month 01–12), `endDate: null` means "present", `organization` is optional (projects can omit it), `bullets` needs at least 1 item, and `id`/`title`/bullet `text` must be non-empty. |
| `lib/storage/storage.ts` | `KeyValueStore` type, `saveLibrary(store, library)`, `loadLibrary(store)` (returns `[]` for missing, corrupt, or schema-invalid data), key `tailorfit:library`. Private `readJson` helper. |
| `lib/storage/storage.test.ts` | The `fakeStore()` pattern (a `Map`-backed `KeyValueStore`) and fictional sample data to copy for new tests. |
| `lib/storage/browserStore.ts` | `browserStore()`: the **only** place that references `localStorage`. Client components call it and pass the result to the storage functions. |
| `app/DemoSignIn.tsx` | The working example of a client component reading and writing storage: `useSyncExternalStore` with a module-level `listeners` set, a `notify()` after each write, the `storage` event for other tabs, and `undefined` as the server/hydration snapshot (shown as "Loading…"). It already shows the library count, so #2's writes should make that count update. |
| `app/page.tsx` | Server Component shell (`<main>` + header) that renders the client leaf. The model for a new route page. |
| `app/review/page.tsx`, `app/review/BulletComparison.tsx` | A second example of the page-shell + client-leaf split, using `useReducer` over a pure reducer in `lib/`. |
| `lib/review/bulletReview.ts` (+ test) | The pattern for UI state: a pure, framework-free reducer in `lib/`, built with TDD, with the component only wiring it up. |
| `docs/plans/2026-11-22-bullet-comparison.md` | Format to follow for the Plan step that comes after this. |
| `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` | Next 16 guidance on the server/client split. Read before writing the route. |

## Existing patterns to follow

- **Storage access**: client component → `browserStore()` → `saveLibrary` / `loadLibrary`. Nothing new touches `localStorage`; `lib/storage/` is never imported from server code.
- **Dependency injection**: anything in `lib/` that persists takes a `KeyValueStore` (or the storage functions) as an argument. Tests use `fakeStore()`, never real `localStorage`.
- **Pure logic in `lib/`, built with strict TDD**: add/update/delete on a library, and turning form input into an `Experience`, belong in a framework-free module (likely `lib/library/…`, camelCase file names, named exports), with colocated tests. Red and green are separate commits (`test(library): [red] …` → `feat(library): [green] …` → `refactor(library): …`).
- **UI**: route page is a Server Component; only the form and list are `"use client"`. UI components don't need TDD.
- **Validation**: parse with `experienceSchema.safeParse(...)` and map `error.issues` to messages. Types come from `z.infer`, never hand-written.
- **Styling**: Tailwind utilities only, zinc palette with `dark:` variants, and the same button classes as `DemoSignIn.tsx` (consider extracting them if a third copy appears).
- **Reading storage in React**: copy `DemoSignIn`'s `useSyncExternalStore` setup, with `undefined` as the server snapshot so `cacheComponents` prerendering never touches `localStorage`.
- **Fixtures**: fictional people and employers only (e.g. "Maplewood Robotics", "Avery Quinn").
- **Commits**: scope `library`, Conventional Commits, `git pull --rebase` before pushing.

## Decisions

Answers to the open questions and risks below, decided by Yanni on 2026-11-22.

### Open questions

1. **Route**: the library gets its own `/library` route.
2. **Sign-in gate**: signed-out users see "Please sign in first" with a link to the home page.
3. **IDs**: `crypto.randomUUID()`, passed into `lib/` code as an argument so tests can use stable IDs. Existing bullet IDs stay the same when an item is edited.
4. **Bullets**: a list of bullet inputs with add and remove buttons (not one textarea).
5. **Dates**: a month picker (`<input type="month">`) plus a "Current" checkbox that sets `endDate` to `null`.
6. **Empty organization**: becomes no value (`undefined`), not `""`.
7. **Errors**: plain-language messages under each field. The wording lives in the form layer, not in `lib/types.ts`.
8. **Delete**: confirm first with the browser's `confirm()` dialog.
9. **Order**: sorted by start date, newest first, with current items (`endDate: null`) on top.

### Risks

- **Re-render loop**: load the library into state once after mount, rather than using `loadLibrary` as a `useSyncExternalStore` snapshot.
- **Silent data loss**: if stored library data fails validation, copy the raw text to a backup key before any save can overwrite it, and show the user a warning. This is a TDD cycle in `lib/storage/`.
- **Same-tab updates between components**: skip the shared listener. Known limitation: `DemoSignIn`'s library count and the library screen don't notify each other within one tab. That's acceptable while they're on different routes.
- **Shared schema**: extra form rules (friendlier messages, end ≥ start, etc.) stay out of `lib/types.ts`.

## Open questions

1. **Where does the library live?** A new route (e.g. `/library`) linked from the signed-in home screen, or on the home page itself? A route keeps `DemoSignIn` small.
2. **Is the library gated by the demo sign-in?** If a signed-out user opens `/library` directly, should it redirect or prompt to sign in? (Sign-in is client-side only, so any gate is client-side too.)
3. **How are IDs generated?** `crypto.randomUUID()` works in the browser on `localhost`. To keep `lib/` testable, the ID generator should be injected (like storage) so tests get stable IDs. Bullet IDs must stay stable across edits, because the selector and rewriter refer to them.
4. **Form shape for bullets**: one textarea with one bullet per line, or a dynamic list of inputs with add/remove? The dynamic list keeps bullet IDs stable when editing; a textarea makes that harder.
5. **Dates**: `<input type="month">` produces `YYYY-MM` directly. A "Current role / ongoing" checkbox maps to `endDate: null`. Should we also check that `endDate` ≥ `startDate`? The schema doesn't, and we can't change it without asking, so any such check would be form-only.
6. **Empty organization**: an empty string fails `z.string().min(1).optional()`, so the form must turn `""` into `undefined`. Should an organization be required for `type: "experience"`? The schema doesn't require it.
7. **Error display**: per-field messages (from `issue.path`) or one summary? The schema's default messages ("Too small…") aren't user-friendly, so we probably need our own wording in the form layer, not in `lib/types.ts`.
8. **Delete confirmation**: should deleting an item ask first? There's no undo.
9. **Ordering**: insertion order, or sorted by `startDate` (newest first)? Saved order affects the order the selector sees.

## Risks

- **`useSyncExternalStore` infinite re-render**: `loadLibrary()` returns a new array on every call, so using it directly as `getSnapshot` will loop forever ("getSnapshot should be cached"). `DemoSignIn` avoids this by returning only `.length`. The library screen needs a cached snapshot (e.g. cache by the raw stored string) or must load once into `useState`/`useReducer` after mount.
- **Silent data loss**: `loadLibrary` returns `[]` when *any* item fails the schema. If stored data is ever invalid, the screen shows an empty library, and the next save overwrites everything. Mitigation: always validate before saving (never write an item that fails `experienceSchema`), and consider warning instead of showing an empty list. Changing `loadLibrary`'s behaviour would need a TDD cycle.
- **Two components writing the same key**: `DemoSignIn` keeps its own private `listeners`/`notify`. If the library screen has a separate one, they won't hear each other within the same tab (only the cross-tab `storage` event). It's fine while they're on different routes, but a shared subscribe/notify would be cleaner. It isn't in `lib/storage/` today.
- **Hydration mismatch**: anything rendered from `localStorage` must start from the server snapshot (`undefined` → "Loading…"), or the server and client HTML will differ.
- **Shared-schema pressure**: the form may tempt changes to `lib/types.ts` (friendlier messages, `endDate` ≥ `startDate`, required organization). Those are shared contracts; ask the teammate first or keep the extra rules in the form layer.
- **Bullet ID stability**: regenerating bullet IDs on every edit wouldn't break #2, but it would break the link between a library item and a past selection or rewrite. Keep existing IDs when editing.
- **Review screen is still provisional**: `app/review` uses `lib/review/provisionalRewrite.ts`, not `lib/types.ts`. That's not part of #2, but it shows the library's `title` isn't in `rewriteResultSchema`, so later integration will join on item `id`. That's one more reason IDs must stay stable.
- **Logging**: never `console.log` library contents (resume content), even while debugging.
