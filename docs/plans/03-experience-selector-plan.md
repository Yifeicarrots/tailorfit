# Plan: #3 Experience selector

## Context
Issue #3 (story 3): Claude call #1 takes the experience library and the job description and returns the IDs of the best-fit items, each with a reason. It follows the same patterns as the rewriter (`lib/pipeline/resumeRewriter.ts`). Strict TDD: red, green, and refactor are separate commits.

## Shape
- **`lib/pipeline/prompts.ts`**: `SELECTOR_SYSTEM_PROMPT` and `buildSelectionPrompt(library, jobDescription)`. The prompt has a `<job_description>` block and an `<experiences>` JSON block with each item's id, type, title, organization, dates, and bullet text.
- **`lib/pipeline/validate.ts`**: `checkSelectionIds(selection, library)` → `{ ok: true } | { ok: false; problems: string[] }`.
- **`lib/pipeline/experienceSelector.ts`**: `selectExperiences({ library, jobDescription }, callClaude)` → `{ ok: true; result: SelectionResult } | { ok: false; error: string }`. Claude's JSON is checked against `selectionResultSchema` from `lib/types.ts`, which stays unchanged.
- Every test uses a `vi.fn<CallClaude>()` mock and a fictional library. No test makes a network call.

## Test cases, in build order

**A. `validate.test.ts`: `checkSelectionIds`**
1. Accepts a selection whose IDs are all in the library.
2. Rejects an ID that isn't in the library, and the problem names that ID.
3. Rejects a duplicate ID.
4. Accepts an empty selection.

**B. `experienceSelector.test.ts`: prompt**

5. Calls Claude once. The prompt contains the job description and every library item's ID, title, and bullet text.
6. The system prompt says an empty selection is allowed and shows the `{"selected":[]}` shape, so Claude isn't pushed to pad the list.

**C. Valid response**

7. Valid JSON is parsed into `{ ok: true, result: { selected: [...] } }`. Each pick keeps its reason, and the order stays as Claude returned it.
8. **Fits nothing:** `{"selected":[]}` returns `{ ok: true, result: { selected: [] } }` after one call. There is no retry and nothing is padded.

**D. Malformed JSON or a schema failure**

9. If the response isn't JSON, the selector retries once with the same system prompt and prompt, then uses the retry's result.
10. If the response fails the schema (a pick with no `reason`, or an empty `reason`), the selector retries once and uses the retry.
11. After two invalid responses it returns `{ ok: false, error }` after exactly two calls. The error doesn't contain the response text.

**E. Unknown IDs count as validation failures**

12. If a response contains an ID that isn't in the library, the selector retries once and uses the valid retry.
13. A duplicate ID also triggers one retry.
14. An unknown ID in both responses returns an error after two calls.

**F. No logging**

15. A run with one failed attempt and then a success never calls `console.log`, `info`, `warn`, or `error`.

**G. Thin Server Action (last; in `app/`, so not TDD)**
- `app/actions/selectExperiences.ts` starts with `"use server"`. It takes `(library, jobDescription)`, checks them with `experienceLibrarySchema` and a non-empty string (a Server Action is a public endpoint), then calls `selectExperiences(..., callClaude)`. Before writing it, read the Server Actions guide in `node_modules/next/dist/docs/`. `npm run build` and `npm run lint` check it.

## Decisions
- **Duplicate IDs** are treated like unknown IDs: retry once, then return an error.
- **Order:** the selector keeps Claude's order, which ranks the picks by relevance.
- **No cap** on how many items get picked. The prompt asks only for relevant ones.
- **An empty library** goes through the normal path, with no shortcut.
- **If `callClaude` throws** (network error or refusal), the error passes up to the caller without a retry, the same as the rewriter.
- **Limit of test 8:** the unit test only proves that our code accepts an empty selection and doesn't pad it. Whether Claude actually returns `[]` for a job that fits nothing is a question for the eval suite.
