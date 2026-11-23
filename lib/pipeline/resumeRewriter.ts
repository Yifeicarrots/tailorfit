import "server-only";
import { z } from "zod";
import type { CallClaude } from "@/lib/claude";
import type { Experience, RewriteResult } from "@/lib/types";
import { buildRewritePrompt, REWRITER_SYSTEM_PROMPT } from "./prompts";

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

// True when the response has exactly the input's experience and bullet IDs.
function matchesInput(
  experiences: Experience[],
  response: ClaudeRewrite,
): boolean {
  const expected = new Set(
    experiences.flatMap((e) => e.bullets.map((b) => `${e.id}:${b.id}`)),
  );
  const received = new Set(
    response.items.flatMap((i) => i.bullets.map((b) => `${i.id}:${b.id}`)),
  );
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
// from the user's data rather than from Claude.
function toRewriteResult(
  experiences: Experience[],
  response: ClaudeRewrite,
): RewriteResult {
  return {
    items: experiences.map((experience) => {
      const item = response.items.find((i) => i.id === experience.id);
      return {
        id: experience.id,
        bullets: experience.bullets.map((bullet) => ({
          id: bullet.id,
          original: bullet.text,
          rewritten:
            item?.bullets.find((b) => b.id === bullet.id)?.rewritten ?? "",
          flagged: false,
        })),
      };
    }),
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
  return { ok: true, result: toRewriteResult(input.experiences, response) };
}
