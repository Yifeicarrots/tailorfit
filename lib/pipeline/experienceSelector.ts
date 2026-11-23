import "server-only";
import type { CallClaude } from "@/lib/claude";
import {
  selectionResultSchema,
  type ExperienceLibrary,
  type SelectionResult,
} from "@/lib/types";
import { buildSelectionPrompt, SELECTOR_SYSTEM_PROMPT } from "./prompts";

export type SelectionOutcome =
  | { ok: true; result: SelectionResult }
  | { ok: false; error: string };

export async function selectExperiences(
  input: { library: ExperienceLibrary; jobDescription: string },
  callClaude: CallClaude,
): Promise<SelectionOutcome> {
  const prompt = buildSelectionPrompt(input.library, input.jobDescription);
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await callClaude(SELECTOR_SYSTEM_PROMPT, prompt);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      continue;
    }
    const parsed = selectionResultSchema.safeParse(json);
    if (parsed.success) return { ok: true, result: parsed.data };
  }
  return { ok: false, error: "Claude returned an invalid selection response twice" };
}
