import { describe, expect, it, vi } from "vitest";
import type { CallClaude } from "@/lib/claude";
import type { Experience } from "@/lib/types";
import { selectExperiences } from "./experienceSelector";

// Fictional person and employers.
const library: Experience[] = [
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
  {
    id: "proj-garden",
    type: "project",
    title: "Community garden website",
    startDate: "2023-09",
    endDate: "2024-01",
    bullets: [{ id: "garden-1", text: "Built a volunteer sign-up page" }],
  },
];

const jobDescription =
  "Front desk associate: greet guests, handle payments, and onboard new staff.";

const validResponse = {
  selected: [{ id: "exp-cafe", reason: "Handled payments and trained staff" }],
};

function claudeReturns(response: unknown) {
  return vi.fn<CallClaude>(async () => JSON.stringify(response));
}

describe("selectExperiences — prompt", () => {
  it("sends the job description and every library item to Claude in one call", async () => {
    const callClaude = claudeReturns(validResponse);

    await selectExperiences({ library, jobDescription }, callClaude);

    expect(callClaude).toHaveBeenCalledTimes(1);
    const [, prompt] = callClaude.mock.calls[0];
    expect(prompt).toContain(jobDescription);
    for (const item of library) {
      expect(prompt).toContain(item.id);
      expect(prompt).toContain(item.title);
      for (const bullet of item.bullets) {
        expect(prompt).toContain(bullet.text);
      }
    }
  });
});
