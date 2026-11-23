# TailorFit — Annotated Claude Code Session Log

This document walks through the Claude Code sessions behind Homework 4, with short excerpts and notes on what each one shows. The full, unedited transcripts are in `docs/session-logs/`:

| Log | Covers |
|---|---|
| `01-claude-md-interview.txt` | `/init`, the CLAUDE.md interview, permissions |
| `02-shared-schemas-and-callclaude.txt` | Shared schemas, `callClaude`, merge conflict, removing the Status section |
| `03-storage-and-demo-sign-in.txt` | Storage module (TDD) and demo sign-in |
| `04-experience-library.txt` | Issue #2: Explore → Plan → Implement → Commit (Part 2) |
| `05-experience-selector.txt` | Issue #3: strict TDD (Part 3), `/compact`, `claude --continue` |

Excerpts are trimmed for length. `…` marks removed text.

> **TODO before submitting:** check each excerpt against the exported logs, fill in the commit hashes marked `<hash>`, and replace each `[Screenshot: …]` with the image path in `docs/screenshots/`.

---

## Part 1: Project setup

### 1.1 `/init` output, committed unchanged

[Screenshot: `/init` running in Claude Code]

**Commit:** `<hash> chore: generate initial CLAUDE.md via /init`

**Annotation:** I ran `/init` after scaffolding, so it had real code to analyze, and committed its output without edits. Every later change to CLAUDE.md is a separate commit, so `git log -p CLAUDE.md` shows exactly how the file evolved from the generated version.

### 1.2 Iterating on CLAUDE.md through an interview

Before the interview I ran `/clear` so it started from a clean context. [Screenshot: `/clear`]

Claude Code asked one question at a time, after reading `@docs/PRD.md`. Excerpt from question 4:

```
Question 4 of ~8: testing strategy

  You've said TDD unit tests with mocked callClaude and mocked Supabase, kept separate
  from the eval suite that hits the real API. Some details to pin down:
  …
  4. Eval fixtures: … who labels them: your group, or should I draft the labels for
     you to review?
```

**Annotation:** The interview turned vague intentions into concrete rules. One answer here mattered a lot: I decided humans label the eval fixtures, because if Claude drafted the labels, the eval would be grading Claude against its own judgment.

Before writing anything, Claude Code showed the full proposed CLAUDE.md as a diff and pointed out what it changed beyond my answers:

```
⏺ That covers everything, and I haven't written any files yet. The diff above is the
  proposed CLAUDE.md. Here's what changed beyond your answers:
  - Removed the npm run start command, the ESLint config details, and the font details.
    None of them would change how I work.
  - Imports @docs/PRD.md rather than copying it, as you asked.
```

**Commit:** `<hash> docs: refine CLAUDE.md via interview`

**Annotation:** This is the `/init` → iterate step. The `@docs/PRD.md` line is the required @import: the PRD loads as context in every session without being copied into CLAUDE.md.

### 1.3 Permissions: allow, ask, and deny

Claude Code proposed deny rules and was explicit about their limits:

```
  - Why the env files are listed by name: a blanket Read(./.env*) would also block
    .env.example, which I need to edit.
  - What this doesn't block: these rules stop my Read tool and npm run eval, but not
    every possible shell command. … the deny rules are a backstop, not a sandbox.
```

I added an allowlist for safe, frequent commands (`npm test`, `npm run lint`, `git status`, `git diff`, `git log`) and `ask` rules for `git commit` and `git push`.

**Commit:** `92b2178 chore: add Claude permission rules and unignore .env.example`

The `ask` rule then stopped Claude Code's own commit until I approved it, even in auto mode:

```
 Rule Bash(git commit *) from shared project settings overrides auto mode.

 Do you want to proceed?
 ❯ 1. Yes
```

[Screenshot: permission prompt]

**Annotation:** CLAUDE.md tells Claude what it should do; `.claude/settings.json` enforces what it can do. Here the configuration visibly took effect: nothing changes the git history without my approval.

### 1.4 Rules shaping behavior: refusing a risky shortcut

While installing Vitest, npm hit a peer-dependency conflict. Claude Code stopped instead of forcing it:

```
  I won't use --force or --legacy-peer-deps, because they install a combination npm
  says may be broken. CLAUDE.md says to ask before changing dependencies, so here are
  two fixes:
  1. Bump @types/node to ^24 and install Vitest 5 (recommended). …
  2. Keep @types/node@^20 and install vitest@^4. …
```

**Annotation:** The "never add a dependency without asking" rule from the interview directly changed what Claude Code did. It explained the trade-off and let me decide (option 1, matching my Node 24 install).

### 1.5 Keeping CLAUDE.md accurate when the plan changed

When we dropped Supabase to save time, Claude Code updated the PRD and CLAUDE.md together and flagged rules that no longer made sense:

```
  2. The auth and Server Action rules no longer work as written, so I changed them too.
     You didn't ask for this, so please check it:
     - Sign-in check: "Every Server Action verifies the signed-in user first" can't be
       done with a demo sign-in, since the server has nothing real to check. …
     - Storage access: Server Actions run on the server and can't read localStorage. …
```

**Commits:** `db556d9 docs: drop Supabase from PRD and CLAUDE.md`, `89dea90 chore: add .env.example`

**Annotation:** CLAUDE.md is a living document. Because Claude Code treats it and the PRD as the source of truth, leaving stale rules in either would have steered later sessions in the wrong direction.

### 1.6 Context management

| Strategy | Where it happened | Evidence |
|---|---|---|
| `/clear` | Before the interview, and between issues (#1 step 1, #1 step 2, #2, #3) | [Screenshot: `/clear`] |
| `/compact` | Late in the long #3 session | [Screenshot: `/compact` → "Compacted"] |
| `claude --continue` | After exiting the #3 session, resuming it from the terminal | [Screenshot: tab title `claude --continue` with restored conversation] |
| Durable context in files | CLAUDE.md, `@docs/PRD.md`, exploration notes and plans in `docs/` | Commits below |
| Removing the Status section | After a merge conflict in CLAUDE.md | `<hash> docs: remove Status section from CLAUDE.md to avoid merge conflicts` |

After `/compact`, Claude Code re-read the two files it needed to keep working:

```
❯ /compact
  ⎿ Compacted (ctrl+o to see full summary)
  ⎿ Read app/actions/selectExperiences.ts (29 lines)
  ⎿ Read docs/plans/03-experience-selector-plan.md (55 lines)
```

**Annotation:** Committing the plan to `docs/plans/` paid off here: compaction summarized the conversation, but the full plan was still on disk for Claude Code to reload.

---

## Part 2: Explore → Plan → Implement → Commit (issue #2, experience library)

### 2.1 Explore

Prompt: read issue #2 with `gh issue view 2`; use Glob, Grep, and Read to study `lib/types.ts`, `lib/storage/`, and `app/DemoSignIn.tsx`; write findings to `docs/notes/`; change no code.

Excerpt from the risks Claude Code found:

```
  - Silent data loss: loadLibrary returns [] if any single item fails the schema. The
    screen would then show an empty library, and the next save would overwrite
    everything. …
  - Infinite re-render: loadLibrary() returns a new array on every call. Passing it
    straight to useSyncExternalStore will re-render forever. …
```

It also listed nine open questions for me (route, IDs, bullet input, dates, sort order, and so on). I answered them, and my answers were added to the notes as a Decisions section.

**Commit:** `<hash> docs(library): add exploration notes for experience library (#2)`

**Annotation:** Exploring before planning caught a real data-loss bug in existing code. My decision, backing up unreadable data before any save can overwrite it, became its own TDD cycle in the implementation. Recording my decisions in the notes shows the Explore phase directly shaped the plan.

### 2.2 Plan

[Screenshot: Plan mode with the approved plan]

**Commit:** `<hash> docs(library): add implementation plan (#2)`

**Annotation:** Plan mode saves plans outside the repo, so I had Claude Code copy the approved plan into `docs/plans/` and commit it. Without that step, the Plan phase would be invisible in the git history.

### 2.3 Implement

Logic went into pure `lib/` modules built test-first; the screen came last:

```
  - Backup of unreadable data: a new loadLibraryWithBackup in lib/storage/storage.ts. …
  - Library editing: lib/library/libraryEdits.ts adds, updates, deletes and sorts items …
  - Form logic: lib/library/experienceForm.ts … Bullet IDs stay the same when you edit.
  - Screen: the /library route with its components …
```

Claude Code could not test the screen in a browser in this session, so it gave me a checklist instead. I ran all six checks manually: sign-in gating, persistence after reload, stable bullet IDs in DevTools, per-field error messages, delete confirmation, and the corrupted-data backup.

**Commits:** `<hash>` … `e00ace3 feat(library): experience library screen with add, edit, and delete`

### 2.4 Commit

**Annotation:** Each phase has its own commit: notes, then plan, then red/green implementation commits, then the screen. `git log --oneline` for #2 reads in the same order as the workflow.

---

## Part 3: TDD (issue #3, experience selector)

### 3.1 Tests planned from acceptance criteria

In Plan mode, Claude Code turned each acceptance criterion in issue #3 into a numbered test case before any code was written.

**Commit:** `<hash> docs(selector): add implementation plan (#3)`

### 3.2 Red → green → refactor

Example cycle (fill in from `git log`):

```
<hash> test(selector): [red] <behavior>
<hash> feat(selector): [green] <behavior>
```

Claude Code's summary of the result:

```
  - ID check (lib/pipeline/validate.ts): checkSelectionIds rejects IDs that aren't in
    the library and IDs that appear twice, and names the ID in each problem.
  - Selector (lib/pipeline/experienceSelector.ts): … Bad JSON, a schema failure, or an
    unknown or duplicate ID makes it retry the whole call once …
  …
  There was one refactor commit: I moved the JSON parsing and schema check out of the
  retry loop into a parseSelection helper …
```

**Annotation:** Every test ran against a mocked `callClaude`, so the suite is fast, free, and deterministic. 111 tests pass; lint and build are clean.

### 3.3 Tests that passed immediately

```
  Where I didn't follow red → green exactly: 6 of the 15 planned tests (4, 8, 11, 13,
  14, 15) passed as soon as I wrote them, because earlier green steps already covered
  them. I didn't fake a failure for these. They are committed as test(selector): …
  (already passing) with no [red] tag …
```

**Annotation:** These tests were still written before any new code, which is the core TDD requirement. Faking a failure just to get a `[red]` commit would have made the history look stricter while being less honest. They're labeled clearly so a reader understands why no green commit follows.

### 3.4 What unit tests can't prove

```
  - Test 8 only proves that our code passes an empty selection through without retrying
    or padding it. Whether Claude actually returns [] for a job that fits nothing has to
    be checked with the eval suite, which only you can run.
```

**Annotation:** Unit tests verify our code's handling of Claude's output, not the quality of Claude's judgment. That's why the project separates mocked unit tests from the human-labeled eval suite, and why the eval fixtures will include a job description that matches nothing.

---

## Team workflow (supporting evidence)

- **Issues created by Claude Code** with `gh`, split by pipeline stage so the only shared dependency is the schemas in `lib/types.ts`. [Screenshot: issues list]
- **Merge conflict handled during rebase:** both teammates had edited the CLAUDE.md Status section. Claude Code combined both versions, noted a commit that disappeared because my teammate had already deleted the same file, and confirmed all 42 tests passed afterward. We then removed the Status section so it couldn't conflict again.
