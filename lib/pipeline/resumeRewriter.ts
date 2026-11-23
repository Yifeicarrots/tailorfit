import "server-only";
import { z } from "zod";
import type { CallClaude } from "@/lib/claude";
import type { Experience, RewriteResult } from "@/lib/types";
import {
  buildRewritePrompt,
  buildRewriteRetryPrompt,
  REWRITER_SYSTEM_PROMPT,
} from "./prompts";
import { checkNoInvention } from "./validate";

export type RewriteOutcome =
  | { ok: true; result: RewriteResult }
  | { ok: false; error: string };

// Claude's raw response. `original` and `flagged` are added by our code.
const claudeRewriteSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      bullets: z.array(
        z.object({
          id: z.string().min(1),
          rewritten: z.string().min(1),
        }),
      ),
    }),
  ),
});

type ClaudeRewrite = z.infer<typeof claudeRewriteSchema>;

function parseClaudeRewrite(text: string): ClaudeRewrite | undefined {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return undefined;
  }
  const parsed = claudeRewriteSchema.safeParse(json);
  return parsed.success ? parsed.data : undefined;
}

function bulletKey(itemId: string, bulletId: string): string {
  return `${itemId}:${bulletId}`;
}

// Maps each bullet key in the response to its rewrite.
function rewritesByKey(response: ClaudeRewrite): Map<string, string> {
  return new Map(
    response.items.flatMap((i) =>
      i.bullets.map((b) => [bulletKey(i.id, b.id), b.rewritten] as const),
    ),
  );
}

// True when the response has exactly the input's experience and bullet IDs.
function matchesInput(
  experiences: Experience[],
  response: ClaudeRewrite,
): boolean {
  const expected = new Set(
    experiences.flatMap((e) => e.bullets.map((b) => bulletKey(e.id, b.id))),
  );
  const received = new Set(rewritesByKey(response).keys());
  return (
    expected.size === received.size &&
    [...expected].every((key) => received.has(key))
  );
}

// Calls Claude up to twice, returning the first response that parses and
// matches the input's IDs.
async function requestRewrite(
  callClaude: CallClaude,
  prompt: string,
  experiences: Experience[],
): Promise<ClaudeRewrite | undefined> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = parseClaudeRewrite(
      await callClaude(REWRITER_SYSTEM_PROMPT, prompt),
    );
    if (response && matchesInput(experiences, response)) return response;
  }
  return undefined;
}

// Builds the result from the experiences, so originals and order always come
// from the user's data rather than from Claude. matchesInput has already
// checked that every bullet has a rewrite.
function toRewriteResult(
  experiences: Experience[],
  response: ClaudeRewrite,
): RewriteResult {
  const rewrites = rewritesByKey(response);
  return {
    items: experiences.map((experience) => ({
      id: experience.id,
      bullets: experience.bullets.map((bullet) => ({
        id: bullet.id,
        original: bullet.text,
        rewritten: rewrites.get(bulletKey(experience.id, bullet.id)) ?? "",
        flagged: false,
      })),
    })),
  };
}

type RewriteBullet = RewriteResult["items"][number]["bullets"][number];
type Feedback = { itemId: string; bulletId: string; problems: string[] };

// One entry per bullet whose rewrite fails the no-invention check.
function findInventions(result: RewriteResult): Feedback[] {
  return result.items.flatMap((item) =>
    item.bullets.flatMap((b) => {
      const check = checkNoInvention(b.original, b.rewritten);
      return check.ok
        ? []
        : [{ itemId: item.id, bulletId: b.id, problems: check.problems }];
    }),
  );
}

// The experiences cut down to just the bullets named in the feedback.
function onlyFailingBullets(
  experiences: Experience[],
  feedback: Feedback[],
): Experience[] {
  const failing = new Set(feedback.map((f) => bulletKey(f.itemId, f.bulletId)));
  return experiences
    .map((e) => ({
      ...e,
      bullets: e.bullets.filter((b) => failing.has(bulletKey(e.id, b.id))),
    }))
    .filter((e) => e.bullets.length > 0);
}

// For a bullet that failed the check: use the retry's rewrite if it passes,
// otherwise keep the original and flag it with the latest problems.
function settleBullet(
  bullet: RewriteBullet,
  retryRewrite: string | undefined,
  problems: string[],
): RewriteBullet {
  let latest = problems;
  if (retryRewrite !== undefined) {
    const check = checkNoInvention(bullet.original, retryRewrite);
    if (check.ok) return { ...bullet, rewritten: retryRewrite };
    latest = check.problems;
  }
  return {
    ...bullet,
    rewritten: bullet.original,
    flagged: true,
    flagReason: latest.join("; "),
  };
}

export async function rewriteResume(
  input: { experiences: Experience[]; jobDescription: string },
  callClaude: CallClaude,
): Promise<RewriteOutcome> {
  const response = await requestRewrite(
    callClaude,
    buildRewritePrompt(input.experiences, input.jobDescription),
    input.experiences,
  );
  if (!response) {
    return {
      ok: false,
      error: "Claude returned an invalid rewrite response twice",
    };
  }
  const result = toRewriteResult(input.experiences, response);
  const feedback = findInventions(result);
  if (feedback.length === 0) return { ok: true, result };

  const failing = onlyFailingBullets(input.experiences, feedback);
  const retry = await requestRewrite(
    callClaude,
    buildRewriteRetryPrompt(failing, input.jobDescription, feedback),
    failing,
  );
  const retryRewrites = retry ? rewritesByKey(retry) : new Map<string, string>();
  const problemsByKey = new Map(
    feedback.map((f) => [bulletKey(f.itemId, f.bulletId), f.problems]),
  );

  return {
    ok: true,
    result: {
      items: result.items.map((item) => ({
        ...item,
        bullets: item.bullets.map((bullet) => {
          const key = bulletKey(item.id, bullet.id);
          const problems = problemsByKey.get(key);
          return problems
            ? settleBullet(bullet, retryRewrites.get(key), problems)
            : bullet;
        }),
      })),
    },
  };
}
