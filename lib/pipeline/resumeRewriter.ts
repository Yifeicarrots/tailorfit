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

export async function rewriteResume(
  input: { experiences: Experience[]; jobDescription: string },
  callClaude: CallClaude,
): Promise<RewriteOutcome> {
  const prompt = buildRewritePrompt(input.experiences, input.jobDescription);

  let response: z.infer<typeof claudeRewriteSchema> | undefined;
  for (let attempt = 0; attempt < 2 && !response; attempt++) {
    const text = await callClaude(REWRITER_SYSTEM_PROMPT, prompt);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      continue;
    }
    const parsed = claudeRewriteSchema.safeParse(json);
    if (parsed.success) response = parsed.data;
  }
  if (!response) {
    return {
      ok: false,
      error: "Claude returned an invalid rewrite response twice",
    };
  }

  return {
    ok: true,
    result: {
      items: input.experiences.map((experience) => {
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
    },
  };
}
