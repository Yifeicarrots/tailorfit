# Reflection: The Claude Code Workflow on TailorFit

Yang Zhang · P3 Claude Code workflow assignment · November 2026

We chose this project because we both have more work experience and projects than fit on one resume, and every job description calls for a different selection and different wording. Tailoring a resume by hand for each application is slow, so we decided to build an app that stores all of our experiences and projects in one place. When we apply for a job, we paste in the job description, and the app picks the most relevant items and rewrites the bullet points to match. That app is TailorFit.

It runs locally as a Next.js app that picks a job seeker's most relevant experiences for a job description and rewrites their bullet points without inventing skills, employers or numbers. Yanni and I split the work into GitHub issues. Yanni took setup and storage, the experience library, the experience selector, and the selection screen (#1, #2, #3, #5). I took the resume rewriter (#6) and the bullet comparison screen (#7). The evidence for everything below is in `docs/session-logs/` (logs 04, 05 and 06 are mine and are annotated) and in `git log`.

## Before: how I used to work

Before this project, I usually started a feature by opening the files I thought were relevant and writing code straight away, and I used a chat assistant by pasting code in and copying answers back. Tests came last, if at all, and mostly checked what I had already built. The usual problems were rework when I found a missing requirement halfway through, and code that worked but didn't quite match what the feature needed.

## Explore → Plan → Implement → Commit

The biggest difference was that mistakes that would have been expensive in code were caught in the plan instead. For #7, Claude explored before designing. It read the scaffold, the existing `validate.ts`, and the Next.js 16 docs bundled in `node_modules`, because our AGENTS.md warns that this version differs from what models were trained on. It then entered plan mode, which is read-only, and asked me two questions. The first showed that the shared rewrite schema in #1, which Yanni hadn't merged yet, might not have a `flagReason` field. Without that field, the screen can't tell the user why a bullet was flagged, which is user story 7. I commented on #1 before Yanni finalized the schema, and when it merged, `flagReason` was in it. Without the plan, I would have found this at integration time and had to ask her to change a shared contract. The second question moved the accept/edit logic into a pure reducer in `lib/`, which brought it under strict TDD instead of leaving it buried in a React component.

The plan was committed to the repo before any code, so the history shows the workflow and not just the result. Implementation didn't follow the plan perfectly. The type and fixture had to come before the tests because the tests import the type, and Claude said so rather than quietly reordering. Driving the real page in a headless browser also caught something no unit test would: disabled buttons looked clickable. It was fixed before the commit.

The cost was a slower start and more back-and-forth: several turns passed before the first line of feature code.

## TDD through Claude Code

I built ten red → green cycles across four pieces: the no-invention check, the review reducer, switching the screen to Yanni's shared types, and the rewriter's retry logic. Seven of the cycles also have a refactor commit. Each step is its own commit, marked `[red]` or `[green]`, so anyone can see that every test failed before its implementation existed.

Three moments made TDD feel like a specification I controlled rather than paperwork. First, writing the test first forced a decision: Claude stopped and asked me how to detect "invented skills" before writing any code, because that's a judgment call rather than a mechanical rule. Second, when two of seven new tests passed immediately, it explained why (they were guards against flagging too much) and wrote that in the commit message instead of hiding it. Third, when one red test failed with a TypeError instead of a clear assertion, Claude tightened the test before committing it. The rule in CLAUDE.md that the green step never modifies the test kept this honest, and the per-step commits made it easy to check. The weak spot is that the no-invention heuristic has known gaps. They're listed rather than hidden, but tests only cover the rules we thought of.

## Context management: what worked best

1. **CLAUDE.md with `@imports`.** This mattered most. It imports `@AGENTS.md` and `@docs/PRD.md`, so my sessions started with a one-paragraph prompt and no explanation of the stack. Claude still followed our commit format, the `git pull --rebase` rule, the "ask before adding a dependency" rule and "never log Claude responses", which even became a test. Yanni built it with `/init` and then an interview (log 01), and the refined version went from 3 sections to 7. The interview mattered more than `/init`: it added the architecture decisions, the testing rules and the validation behavior the generated file couldn't have known.
2. **Context that lives on disk.** The committed plan, comments on GitHub issues, and the commit history all survive any reset. When Yanni pushed 24 commits mid-session, Claude fetched them, read the new schemas and the CLAUDE.md changes, and spotted that our session-log numbers clashed, all without me explaining what she had done.
3. **`/compact`** (log 05). It let one long session carry on through several more tasks. Afterwards Claude re-read the files it was working on, referenced the plan file, and remembered the background dev server. What it lost was detail, such as exact shell output, but everything needed came back from disk.
4. **`/clear`** (log 01) gave the CLAUDE.md interview a clean start.
5. **`claude --continue`** (log 06). It reopened the conversation after I'd closed the terminal, and Claude answered "what's left?" with the exact remaining work.

My rule of thumb: use `/clear` when switching to an unrelated task, `/compact` when the same task has run long, and `--continue` when coming back after closing the terminal. Permissions also acted as context. The deny rules on `npm run eval` and `.env` files mean nobody has to repeat "don't" every session, and the auto-mode safety check blocked a command that would have killed whatever was running on port 3000, so Claude found a safer way (log 04).

## What I'd do differently

Two things. First, fix shared setup problems on day one: our `package-lock.json` was out of sync the whole time, so every install needed a workaround. Second, merge the shared types (#1) before starting the issues that depend on them. A provisional type worked, but it cost a whole extra TDD cycle to swap it out.
