import "server-only";
import type { CallClaude } from "@/lib/claude";
import type { ExperienceLibrary, SelectionResult } from "@/lib/types";
import { buildSelectionPrompt, SELECTOR_SYSTEM_PROMPT } from "./prompts";

export type SelectionOutcome =
  | { ok: true; result: SelectionResult }
  | { ok: false; error: string };

export async function selectExperiences(
  input: { library: ExperienceLibrary; jobDescription: string },
  callClaude: CallClaude,
): Promise<SelectionOutcome> {
  await callClaude(
    SELECTOR_SYSTEM_PROMPT,
    buildSelectionPrompt(input.library, input.jobDescription),
  );
  return { ok: true, result: { selected: [] } };
}
