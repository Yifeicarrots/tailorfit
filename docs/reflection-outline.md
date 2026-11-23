# Reflection outline (draft, not the final reflection)

The final reflection should be 1–2 pages, about 600–900 words. The **Facts** under each section come from the session logs and git history, so you can cite them. The **Your take** prompts are for you (and Yanni, if it's a joint reflection) to answer in your own words. Delete this file, or rename it to `reflection.md` and replace the outline with prose, once it's written.

Evidence to point the reader to:
- `docs/session-logs/01-claude-md-interview.txt` (Yanni: `/init` refined through an interview)
- `docs/session-logs/02-shared-schemas-and-callclaude.txt` and `03-storage-and-demo-sign-in.txt` (Yanni: #1, TDD on schemas, callClaude, storage)
- `docs/session-logs/04-tdd-and-plan-mode.txt` (annotated: TDD, plan mode, permissions)
- `docs/plans/2026-11-22-bullet-comparison.md` (the approved plan)
- `git log`

---

## 1. Before: how we worked previously (about 1 paragraph)

**Your take:**
- How did you usually start a feature before? Straight into code? Prompting a chat assistant and pasting code back?
- When did you write tests, if ever?
- What tended to go wrong: rework, unclear scope, code that worked but didn't match what was needed?

## 2. Explore → Plan → Implement → Commit compared with that (about half a page)

**Facts:**
- **Explore.** Before designing #7, Claude read the scaffold, `globals.css`, `validate.ts`, and the bundled Next 16 docs. AGENTS.md warns that this Next.js version differs from training data. Two findings shaped the design:
  - pages are Server Components, with `"use client"` only on interactive leaves
  - `validate.ts`'s problem sentences could be shown directly as the flag reason
- **Plan.** Plan mode is read-only, and it ended with two questions for me:
  - Question 1 showed that #1's schema might not include `flagReason`, a field the screen needs for story 7. I commented on #1 before Yanni finalized the schema, rather than finding out at integration.
  - Question 2 put the review state in a pure reducer in `lib/`, which brought it under strict TDD.
- **The plan was committed** (`232237b`), so it's part of the history, not just the chat.
- **Implement deviated once**, and that was stated openly: the type and fixture had to come before the TDD cycles because the tests import the type.
- **A visual check caught a problem no test would.** Disabled buttons looked active, which was fixed before the commit.
- **Commit.** Conventional Commits with `[red]`/`[green]` markers. I made 17 commits this session, each small and with one purpose.

**Your take:**
- What did planning first save you? Was the `flagReason` catch something you'd have hit later?
- What did it cost? Slower start, more back-and-forth?
- Did having the plan written down change how much you trusted or checked the output?
- Would you use plan mode for every feature, or only for some? Where's the line?

## 3. TDD through Claude Code (short paragraph; supports section 2)

**Facts:**
- 5 red → green cycles, with 3 refactor commits. In 2 cycles the refactor was skipped explicitly, with no empty commits.
- In the skills red commit, 2 of the 7 new tests passed immediately. They were guard tests against over-flagging, and the commit message says so.
- Writing tests first forced a design decision up front: Claude stopped and asked how to detect invented skills before writing any implementation.
- Known heuristic gaps were listed rather than hidden: lowercase skills, a capital after a full stop, and multi-word employers.

**Your take:**
- Did the tests feel like a specification you controlled, or like paperwork?
- How did you know Claude wasn't changing tests to make them pass? (CLAUDE.md forbids it. Did you check the diffs?)

## 4. Context management: what worked best (about half a page)

**Facts:**
- **CLAUDE.md with `@imports`** (`@AGENTS.md`, `@docs/PRD.md`). Log 04 opens with a one-paragraph prompt and no explanation of the stack or rules, yet Claude followed the TDD commit format, the `pull --rebase` rule and the dependency rule.
- **`/init`, then an interview** (`517ffa2` → `8c892fe`). The generated file had 3 sections (Status, Commands, Stack). The refined one has 7, adding Architecture, Conventions, Testing and Git: 54 lines added and 13 removed.
- **`/clear`** at the start of log 01 gave the CLAUDE.md interview a clean context.
- **`/compact`** was run after exporting log 04. It kept a summary of the session and let the same thread continue with the next task (annotating that log). Worth checking: what did the summary keep, and what did it lose?
- **`--continue`**: *not yet used. Do this next session (`claude --continue`) and note what it restored.*
- **Durable context on disk that survives `/clear` and `/compact`:**
  - the committed plan file
  - CLAUDE.md's Status section, updated at the end of #7
  - comments on the GitHub issues
- **Issues as context boundaries.** One issue per session kept each conversation focused.
- **Permissions as context.** The `deny` rules (`npm run eval`, `.env*`) mean you don't have to repeat "don't do X" in every session. Separately, the auto-mode classifier blocked a port-kill command, and Claude chose a safer approach (log 04, `[PERMISSIONS]`).

**Your take:**
- Rank the strategies by how much they actually helped. Which would you set up first on a new project?
- When is `/clear` better than `/compact`, and when is `/compact` better than a new session?
- Anything that didn't work? For example, the export collapses shell output, and some setup friction didn't belong in CLAUDE.md (the lockfile).

## 5. What we'd do differently (short closing paragraph)

**Your take:** one or two concrete changes. Some starting points:
- fix the lockfile early
- add a `--continue` habit
- merge the shared types (#1) before starting the dependent issues
- export a session log at the end of every session

---

*Before writing: check with the instructor whether it's one reflection per pair or one each.*
