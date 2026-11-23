import "server-only";
import type { CallClaude } from "@/lib/claude";
import {
  selectionResultSchema,
  type ExperienceLibrary,
  type SelectionResult,
} from "@/lib/types";
import { buildSelectionPrompt, SELECTOR_SYSTEM_PROMPT } from "./prompts";
import { checkSelectionIds } from "./validate";

export type SelectionOutcome =
  | { ok: true; result: SelectionResult }
  | { ok: false; error: string };

const MAX_ATTEMPTS = 2;

// Returns undefined when the text is not JSON or fails the schema.
function parseSelection(text: string): SelectionResult | undefined {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return undefined;
  }
  const parsed = selectionResultSchema.safeParse(json);
  return parsed.success ? parsed.data : undefined;
}

// Calls Claude up to twice with the same prompt, returning the first
// selection that parses and names only library items, each once.
export async function selectExperiences(
  input: { library: ExperienceLibrary; jobDescription: string },
  callClaude: CallClaude,
): Promise<SelectionOutcome> {
  const prompt = buildSelectionPrompt(input.library, input.jobDescription);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const selection = parseSelection(
      await callClaude(SELECTOR_SYSTEM_PROMPT, prompt),
    );
    if (selection && checkSelectionIds(selection, input.library).ok) {
      return { ok: true, result: selection };
    }
  }
  return {
    ok: false,
    error: "Claude returned an invalid selection response twice",
  };
}
