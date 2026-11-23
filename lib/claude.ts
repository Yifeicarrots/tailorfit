import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/config";

type CreateParams = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
type BetaMessage = Anthropic.Beta.Messages.BetaMessage;

export type ClaudeClient = {
  beta: {
    messages: {
      create: (params: CreateParams) => Promise<BetaMessage>;
    };
  };
};

export type CallClaude = (system: string, prompt: string) => Promise<string>;

const MAX_TOKENS = 16000;

// Error messages never include prompt or response content.
export function createCallClaude(client: ClaudeClient): CallClaude {
  return async (system, prompt) => {
    const message = await client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: prompt }],
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    if (message.stop_reason === "refusal") {
      const category = message.stop_details?.category ?? "unknown";
      throw new Error(`Claude refused the request (category: ${category})`);
    }
    if (message.stop_reason === "max_tokens") {
      throw new Error("Claude response was cut off at max_tokens");
    }

    const text = message.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("");
    if (text === "") {
      throw new Error("Claude response contained no text");
    }
    return text;
  };
}

let defaultCallClaude: CallClaude | undefined;

export const callClaude: CallClaude = async (system, prompt) => {
  if (!defaultCallClaude) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.example).",
      );
    }
    defaultCallClaude = createCallClaude(new Anthropic({ apiKey }));
  }
  return defaultCallClaude(system, prompt);
};
