import { describe, expect, it, vi } from "vitest";
import type { CallClaude } from "@/lib/claude";
import type { Experience } from "@/lib/types";
import { rewriteResume } from "./resumeRewriter";

// Fictional person and employer.
const experiences: Experience[] = [
  {
    id: "exp-cafe",
    type: "experience",
    title: "Barista",
    organization: "Juniper Street Cafe",
    startDate: "2024-05",
    endDate: null,
    bullets: [
      { id: "cafe-1", text: "Ran the register during weekend shifts" },
      { id: "cafe-2", text: "Trained 3 new baristas" },
    ],
  },
];

const jobDescription =
  "Front desk associate: greet guests, handle payments, and onboard new staff.";

function claudeReturns(response: unknown) {
  return vi.fn<CallClaude>(async () => JSON.stringify(response));
}

const validResponse = {
  items: [
    {
      id: "exp-cafe",
      bullets: [
        { id: "cafe-1", rewritten: "Handled customer payments during weekend shifts" },
        { id: "cafe-2", rewritten: "Onboarded 3 new staff members" },
      ],
    },
  ],
};

function claudeReturnsInOrder(...texts: string[]) {
  const callClaude = vi.fn<CallClaude>();
  texts.forEach((t) => callClaude.mockResolvedValueOnce(t));
  return callClaude;
}

describe("rewriteResume — valid response", () => {
  it("sends the job description and every bullet to Claude in one call", async () => {
    const callClaude = claudeReturns(validResponse);

    await rewriteResume({ experiences, jobDescription }, callClaude);

    expect(callClaude).toHaveBeenCalledTimes(1);
    const [, prompt] = callClaude.mock.calls[0];
    expect(prompt).toContain(jobDescription);
    expect(prompt).toContain("cafe-1");
    expect(prompt).toContain("Ran the register during weekend shifts");
    expect(prompt).toContain("cafe-2");
    expect(prompt).toContain("Trained 3 new baristas");
  });

  it("pairs each rewrite with its original bullet, unflagged", async () => {
    const outcome = await rewriteResume(
      { experiences, jobDescription },
      claudeReturns(validResponse),
    );

    expect(outcome).toEqual({
      ok: true,
      result: {
        items: [
          {
            id: "exp-cafe",
            bullets: [
              {
                id: "cafe-1",
                original: "Ran the register during weekend shifts",
                rewritten: "Handled customer payments during weekend shifts",
                flagged: false,
              },
              {
                id: "cafe-2",
                original: "Trained 3 new baristas",
                rewritten: "Onboarded 3 new staff members",
                flagged: false,
              },
            ],
          },
        ],
      },
    });
  });
});

describe("rewriteResume — invalid response", () => {
  const valid = JSON.stringify(validResponse);

  it("retries once when the response is not JSON, and uses the retry", async () => {
    const callClaude = claudeReturnsInOrder("Sure! Here are your bullets.", valid);

    const outcome = await rewriteResume({ experiences, jobDescription }, callClaude);

    expect(callClaude).toHaveBeenCalledTimes(2);
    expect(outcome.ok).toBe(true);
  });

  it("retries once when the response does not match the schema", async () => {
    const missingBullets = JSON.stringify({ items: [{ id: "exp-cafe" }] });
    const callClaude = claudeReturnsInOrder(missingBullets, valid);

    const outcome = await rewriteResume({ experiences, jobDescription }, callClaude);

    expect(callClaude).toHaveBeenCalledTimes(2);
    expect(outcome.ok).toBe(true);
  });

  it("treats an empty rewrite as a schema failure", async () => {
    const emptyRewrite = JSON.stringify({
      items: [
        {
          id: "exp-cafe",
          bullets: [
            { id: "cafe-1", rewritten: "" },
            { id: "cafe-2", rewritten: "Onboarded 3 new staff members" },
          ],
        },
      ],
    });
    const callClaude = claudeReturnsInOrder(emptyRewrite, valid);

    const outcome = await rewriteResume({ experiences, jobDescription }, callClaude);

    expect(callClaude).toHaveBeenCalledTimes(2);
    expect(outcome.ok).toBe(true);
  });

  it("returns an error without the response text after two invalid responses", async () => {
    const callClaude = claudeReturnsInOrder("not json at all", "still not json");

    const outcome = await rewriteResume({ experiences, jobDescription }, callClaude);

    expect(callClaude).toHaveBeenCalledTimes(2);
    expect(outcome).toEqual({ ok: false, error: expect.any(String) });
    expect(!outcome.ok && outcome.error).not.toContain("not json");
  });
});
