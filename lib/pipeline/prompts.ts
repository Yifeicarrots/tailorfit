import type { Experience } from "@/lib/types";

export const REWRITER_SYSTEM_PROMPT = `You rewrite resume bullet points so they read as relevant to a specific job description.

Rules:
- Rewrite every bullet you are given, exactly once, keeping its id.
- Use the job description's wording where it honestly fits what the bullet already says.
- Never add skills, tools, employers, or numbers that are not in the original bullet.
- Keep each bullet's meaning, and keep it about as long as the original.

Respond with only JSON in this shape, and nothing else:
{"items":[{"id":"<experience id>","bullets":[{"id":"<bullet id>","rewritten":"<rewritten bullet>"}]}]}`;

export function buildRewritePrompt(
  experiences: Experience[],
  jobDescription: string,
): string {
  const items = experiences.map((e) => ({
    id: e.id,
    title: e.title,
    bullets: e.bullets.map((b) => ({ id: b.id, text: b.text })),
  }));
  return `<job_description>
${jobDescription}
</job_description>

<experiences>
${JSON.stringify(items, null, 2)}
</experiences>`;
}

// `feedback` holds one entry per bullet that failed the no-invention check.
export function buildRewriteRetryPrompt(
  experiences: Experience[],
  jobDescription: string,
  feedback: { itemId: string; bulletId: string; problems: string[] }[],
): string {
  const lines = feedback.map(
    (f) => `- ${f.itemId} / ${f.bulletId}: ${f.problems.join("; ")}`,
  );
  return `${buildRewritePrompt(experiences, jobDescription)}

<feedback>
Your previous rewrites of these bullets added content that is not in the original bullet. Rewrite them again without adding it.
${lines.join("\n")}
</feedback>`;
}
