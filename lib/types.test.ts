import { describe, expect, it } from "vitest";
import {
  experienceLibrarySchema,
  experienceSchema,
  rewriteResultSchema,
  selectionResultSchema,
} from "@/lib/types";

const validExperience = {
  id: "exp-1",
  type: "experience",
  title: "Software Engineering Intern",
  organization: "Fictional Widgets Co.",
  startDate: "2025-06",
  endDate: "2025-08",
  bullets: [
    { id: "b-1", text: "Built an internal dashboard in React." },
    { id: "b-2", text: "Wrote unit tests for the billing service." },
  ],
};

const validRewriteResult = {
  items: [
    {
      id: "exp-1",
      bullets: [
        {
          id: "b-1",
          original: "Built an internal dashboard in React.",
          rewritten: "Built a React dashboard used by the internal ops team.",
          flagged: false,
        },
        {
          id: "b-2",
          original: "Wrote unit tests for the billing service.",
          rewritten: "Wrote unit tests for the billing service.",
          flagged: true,
          flagReason: "Rewrite added a number not in the original.",
        },
      ],
    },
  ],
};

describe("experienceSchema", () => {
  it("accepts a valid experience", () => {
    expect(experienceSchema.safeParse(validExperience).success).toBe(true);
  });

  it("accepts a project without an organization", () => {
    const project: Record<string, unknown> = {
      ...validExperience,
      type: "project",
    };
    delete project.organization;
    expect(experienceSchema.safeParse(project).success).toBe(true);
  });

  it("accepts a null endDate for a current role", () => {
    expect(
      experienceSchema.safeParse({ ...validExperience, endDate: null }).success,
    ).toBe(true);
  });

  it("rejects an unknown type", () => {
    expect(
      experienceSchema.safeParse({ ...validExperience, type: "job" }).success,
    ).toBe(false);
  });

  it("rejects dates that are not YYYY-MM", () => {
    for (const startDate of ["2025", "2025-6", "2025-13", "June 2025", ""]) {
      expect(
        experienceSchema.safeParse({ ...validExperience, startDate }).success,
      ).toBe(false);
    }
    expect(
      experienceSchema.safeParse({ ...validExperience, endDate: "2025-00" })
        .success,
    ).toBe(false);
  });

  it("rejects an experience with no bullets", () => {
    expect(
      experienceSchema.safeParse({ ...validExperience, bullets: [] }).success,
    ).toBe(false);
  });

  it("rejects a bullet without an id or with empty text", () => {
    expect(
      experienceSchema.safeParse({
        ...validExperience,
        bullets: [{ text: "No id here." }],
      }).success,
    ).toBe(false);
    expect(
      experienceSchema.safeParse({
        ...validExperience,
        bullets: [{ id: "b-1", text: "" }],
      }).success,
    ).toBe(false);
  });

  it("rejects an empty id or title", () => {
    expect(
      experienceSchema.safeParse({ ...validExperience, id: "" }).success,
    ).toBe(false);
    expect(
      experienceSchema.safeParse({ ...validExperience, title: "" }).success,
    ).toBe(false);
  });
});

describe("experienceLibrarySchema", () => {
  it("accepts an empty library and a list of experiences", () => {
    expect(experienceLibrarySchema.safeParse([]).success).toBe(true);
    expect(experienceLibrarySchema.safeParse([validExperience]).success).toBe(
      true,
    );
  });

  it("rejects a library containing an invalid item", () => {
    expect(
      experienceLibrarySchema.safeParse([{ ...validExperience, bullets: [] }])
        .success,
    ).toBe(false);
  });
});

describe("selectionResultSchema", () => {
  it("accepts selected IDs with reasons", () => {
    expect(
      selectionResultSchema.safeParse({
        selected: [{ id: "exp-1", reason: "Matches the React requirement." }],
      }).success,
    ).toBe(true);
  });

  it("rejects an empty reason or missing id", () => {
    expect(
      selectionResultSchema.safeParse({
        selected: [{ id: "exp-1", reason: "" }],
      }).success,
    ).toBe(false);
    expect(
      selectionResultSchema.safeParse({ selected: [{ reason: "Relevant." }] })
        .success,
    ).toBe(false);
  });
});

describe("rewriteResultSchema", () => {
  it("accepts a valid rewrite result, with and without flagReason", () => {
    expect(rewriteResultSchema.safeParse(validRewriteResult).success).toBe(
      true,
    );
  });

  it("rejects a bullet missing flagged", () => {
    const bullet = { id: "b-1", original: "a", rewritten: "b" };
    expect(
      rewriteResultSchema.safeParse({ items: [{ id: "exp-1", bullets: [bullet] }] })
        .success,
    ).toBe(false);
  });

  it("rejects a non-string rewritten", () => {
    const bullet = { id: "b-1", original: "a", rewritten: 42, flagged: false };
    expect(
      rewriteResultSchema.safeParse({ items: [{ id: "exp-1", bullets: [bullet] }] })
        .success,
    ).toBe(false);
  });

  it("rejects an item without an id", () => {
    expect(
      rewriteResultSchema.safeParse({
        items: [{ bullets: validRewriteResult.items[0].bullets }],
      }).success,
    ).toBe(false);
  });
});
