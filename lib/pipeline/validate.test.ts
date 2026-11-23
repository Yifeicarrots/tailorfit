import { describe, expect, it } from "vitest";
import { checkNoInvention } from "./validate";

describe("checkNoInvention — numbers", () => {
  it("accepts a rewrite that adds no numbers", () => {
    const result = checkNoInvention(
      "Built a dashboard for the campus food bank",
      "Developed an inventory dashboard for a campus food bank",
    );

    expect(result).toEqual({ ok: true });
  });

  it("accepts a rewrite that reuses the original's numbers", () => {
    const result = checkNoInvention(
      "Tutored 12 students in calculus over 2 semesters",
      "Mentored 12 students in calculus across 2 semesters",
    );

    expect(result).toEqual({ ok: true });
  });

  it("rejects a rewrite that adds a number absent from the original", () => {
    const result = checkNoInvention(
      "Sped up the checkout page",
      "Cut checkout page load time by 40%",
    );

    expect(result.ok).toBe(false);
    expect(!result.ok && result.problems).toEqual([
      expect.stringContaining("40%"),
    ]);
  });

  it("names every invented number, not just the first", () => {
    const result = checkNoInvention(
      "Organized a hackathon",
      "Organized a 3-day hackathon for 150 participants",
    );

    expect(!result.ok && result.problems).toEqual([
      expect.stringContaining("3"),
      expect.stringContaining("150"),
    ]);
  });
});
