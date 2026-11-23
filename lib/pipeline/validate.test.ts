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

describe("checkNoInvention — skills and employers", () => {
  it("does not flag a new capitalized word at the start of the bullet", () => {
    const result = checkNoInvention(
      "made posters for club events",
      "Designed posters for club events",
    );

    expect(result).toEqual({ ok: true });
  });

  it("rejects a capitalized technology absent from the original", () => {
    const result = checkNoInvention(
      "Built a website for a local bakery",
      "Built a React website for a local bakery",
    );

    expect(!result.ok && result.problems).toEqual([
      expect.stringContaining("React"),
    ]);
  });

  it("rejects an acronym absent from the original, even as the first word", () => {
    const result = checkNoInvention(
      "Analyzed survey results",
      "SQL-driven analysis of survey results",
    );

    expect(!result.ok && result.problems).toEqual([
      expect.stringContaining("SQL"),
    ]);
  });

  it("rejects technology names written with symbols", () => {
    const result = checkNoInvention(
      "Wrote backend services",
      "Wrote Node.js backend services in C++",
    );

    expect(!result.ok && result.problems).toEqual([
      expect.stringContaining("Node.js"),
      expect.stringContaining("C++"),
    ]);
  });

  it("rejects an employer absent from the original", () => {
    const result = checkNoInvention(
      "Interned on the data team",
      "Interned on the data team at Northwind",
    );

    expect(!result.ok && result.problems).toEqual([
      expect.stringContaining("Northwind"),
    ]);
  });

  it("accepts terms from the original regardless of case or punctuation", () => {
    const result = checkNoInvention(
      "Built a react app with firebase.",
      "Shipped a React app backed by Firebase",
    );

    expect(result).toEqual({ ok: true });
  });

  it("reports invented numbers and skills together", () => {
    const result = checkNoInvention(
      "Improved the search page",
      "Improved search page speed by 30% using Redis",
    );

    expect(!result.ok && result.problems).toEqual([
      expect.stringContaining("30%"),
      expect.stringContaining("Redis"),
    ]);
  });
});
