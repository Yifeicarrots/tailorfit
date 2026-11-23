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

  const feedback = result.items.flatMap((item) =>
    item.bullets.flatMap((b) => {
      const check = checkNoInvention(b.original, b.rewritten);
      return check.ok
        ? []
        : [{ itemId: item.id, bulletId: b.id, problems: check.problems }];
    }),
  );
  if (feedback.length === 0) return { ok: true, result };

  const failingKeys = new Set(feedback.map((f) => bulletKey(f.itemId, f.bulletId)));
  const failingExperiences = input.experiences
    .map((e) => ({
      ...e,
      bullets: e.bullets.filter((b) => failingKeys.has(bulletKey(e.id, b.id))),
    }))
    .filter((e) => e.bullets.length > 0);
  const retry = await requestRewrite(
    callClaude,
    buildRewriteRetryPrompt(failingExperiences, input.jobDescription, feedback),
    failingExperiences,
  );
  const retryRewrites = retry ? rewritesByKey(retry) : new Map<string, string>();

  for (const f of feedback) {
    const key = bulletKey(f.itemId, f.bulletId);
    const bullet = result.items
      .find((i) => i.id === f.itemId)
      ?.bullets.find((b) => b.id === f.bulletId);
    if (!bullet) continue;
    const candidate = retryRewrites.get(key);
    const check = candidate
      ? checkNoInvention(bullet.original, candidate)
      : { ok: false as const, problems: f.problems };
    if (candidate && check.ok) {
      bullet.rewritten = candidate;
    } else {
      bullet.rewritten = bullet.original;
      bullet.flagged = true;
      bullet.flagReason = (check.ok ? f.problems : check.problems).join("; ");
    }
  }
  return { ok: true, result };
}
