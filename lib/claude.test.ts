import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import { callClaude, createCallClaude, type ClaudeClient } from "@/lib/claude";
import { CLAUDE_MODEL } from "@/lib/config";

type BetaMessage = Anthropic.Beta.Messages.BetaMessage;
type CreateParams = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;

function fakeMessage(
  content: Array<Record<string, unknown>>,
  stopReason: BetaMessage["stop_reason"] = "end_turn",
): BetaMessage {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: CLAUDE_MODEL,
    content,
    stop_reason: stopReason,
    stop_sequence: null,
  } as unknown as BetaMessage;
}

function fakeClient(message: BetaMessage) {
  const create = vi.fn<(params: CreateParams) => Promise<BetaMessage>>(
    async () => message,
  );
  const client: ClaudeClient = { beta: { messages: { create } } };
  return { client, create };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createCallClaude", () => {
  it("sends the configured model, system prompt, and user prompt with refusal fallbacks", async () => {
    const { client, create } = fakeClient(
      fakeMessage([{ type: "text", text: "ok" }]),
    );

    await createCallClaude(client)("SYSTEM", "PROMPT");

    expect(create).toHaveBeenCalledTimes(1);
    const params = create.mock.calls[0][0];
    expect(params.model).toBe(CLAUDE_MODEL);
    expect(params.system).toBe("SYSTEM");
    expect(params.messages).toEqual([{ role: "user", content: "PROMPT" }]);
    expect(params.max_tokens).toBeGreaterThan(0);
    expect(params.betas).toContain("server-side-fallback-2026-07-01");
    expect(params.fallbacks).toBe("default");
  });

  it("joins text blocks and ignores non-text blocks", async () => {
    const { client } = fakeClient(
      fakeMessage([
        { type: "thinking", thinking: "", signature: "sig" },
        { type: "text", text: '{"a":' },
        { type: "text", text: "1}" },
      ]),
    );

    await expect(createCallClaude(client)("s", "p")).resolves.toBe('{"a":1}');
  });

  it("throws on a refusal", async () => {
    const { client } = fakeClient(
      fakeMessage([{ type: "text", text: "partial" }], "refusal"),
    );

    await expect(createCallClaude(client)("s", "p")).rejects.toThrow(/refus/i);
  });

  it("throws when the response hit max_tokens", async () => {
    const { client } = fakeClient(
      fakeMessage([{ type: "text", text: '{"trunc' }], "max_tokens"),
    );

    await expect(createCallClaude(client)("s", "p")).rejects.toThrow(
      /max_tokens/,
    );
  });

  it("throws when the response has no text", async () => {
    const { client } = fakeClient(fakeMessage([]));

    await expect(createCallClaude(client)("s", "p")).rejects.toThrow(
      /no text/i,
    );
  });
});

describe("callClaude", () => {
  it("throws a clear error when ANTHROPIC_API_KEY is not set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    await expect(callClaude("s", "p")).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });
});
