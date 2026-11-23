import "server-only";
import type { CallClaude } from "@/lib/claude";
import type { Experience, RewriteResult } from "@/lib/types";
import { buildRewritePrompt, REWRITER_SYSTEM_PROMPT } from "./prompts";

export type RewriteOutcome =
  | { ok: true; result: RewriteResult }
  | { ok: false; error: string };

type ClaudeRewrite = {
  items: { id: string; bullets: { id: string; rewritten: string }[] }[];
};

export async function rewriteResume(
  input: { experiences: Experience[]; jobDescription: string },
  callClaude: CallClaude,
): Promise<RewriteOutcome> {
  const text = await callClaude(
    REWRITER_SYSTEM_PROMPT,
    buildRewritePrompt(input.experiences, input.jobDescription),
  );
  const response = JSON.parse(text) as ClaudeRewrite;

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
