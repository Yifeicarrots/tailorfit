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
