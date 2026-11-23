import { describe, expect, it } from "vitest";
import {
  addBulletRow,
  emptyForm,
  experienceFromForm,
  formFromExperience,
  removeBulletRow,
} from "@/lib/library/experienceForm";
import type { Experience } from "@/lib/types";

function fakeNewId() {
  let n = 0;
  return () => `id-${++n}`;
}

// Fictional person.
const experience: Experience = {
  id: "exp-1",
  type: "experience",
  title: "Software Engineering Intern",
  organization: "Maplewood Robotics",
  startDate: "2025-06",
  endDate: "2025-08",
  bullets: [
    { id: "b-1", text: "Built a dashboard for warehouse robot telemetry" },
    { id: "b-2", text: "Cut test suite runtime from 12 to 4 minutes" },
  ],
};

describe("emptyForm", () => {
  it("starts a blank experience with a new id and one empty bullet row", () => {
    expect(emptyForm(fakeNewId())).toEqual({
      id: "id-1",
      type: "experience",
      title: "",
      organization: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [{ id: "id-2", text: "" }],
    });
  });
});

describe("formFromExperience", () => {
  it("fills the form from a saved item, keeping its item and bullet ids", () => {
    expect(formFromExperience(experience)).toEqual({
      id: "exp-1",
      type: "experience",
      title: "Software Engineering Intern",
      organization: "Maplewood Robotics",
      startDate: "2025-06",
      endDate: "2025-08",
      current: false,
      bullets: experience.bullets,
    });
  });

  it("ticks Current and blanks the organization for a current project", () => {
    const project: Experience = {
      id: "proj-1",
      type: "project",
      title: "Recipe Planner",
      startDate: "2024-01",
      endDate: null,
      bullets: [{ id: "b-3", text: "Wrote a meal planner in TypeScript" }],
    };
    const form = formFromExperience(project);
    expect(form.current).toBe(true);
    expect(form.endDate).toBe("");
    expect(form.organization).toBe("");
  });
});

describe("bullet rows", () => {
  it("adds an empty row with a new id", () => {
    const form = formFromExperience(experience);
    expect(addBulletRow(form, () => "new-b").bullets).toEqual([
      ...experience.bullets,
      { id: "new-b", text: "" },
    ]);
  });

  it("removes a row by id", () => {
    const form = formFromExperience(experience);
    expect(removeBulletRow(form, "b-1").bullets).toEqual([experience.bullets[1]]);
  });

  it("never removes the last row", () => {
    const form = emptyForm(fakeNewId());
    expect(removeBulletRow(form, "id-2").bullets).toEqual([{ id: "id-2", text: "" }]);
  });
});

describe("experienceFromForm with valid input", () => {
  it("round-trips a saved item unchanged", () => {
    expect(experienceFromForm(formFromExperience(experience))).toEqual({
      ok: true,
      experience,
    });
  });

  it("trims text, drops blank bullet rows, and keeps bullet ids", () => {
    const form = {
      ...formFromExperience(experience),
      title: "  Software Engineering Intern  ",
      organization: " Maplewood Robotics ",
      bullets: [
        { id: "b-1", text: "  Built a dashboard for warehouse robot telemetry " },
        { id: "blank", text: "   " },
        { id: "b-2", text: "Cut test suite runtime from 12 to 4 minutes" },
      ],
    };
    expect(experienceFromForm(form)).toEqual({ ok: true, experience });
  });

  it("turns an empty organization into no value", () => {
    const result = experienceFromForm({
      ...formFromExperience(experience),
      type: "project",
      organization: "  ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect("organization" in result.experience).toBe(false);
  });

  it("sets endDate to null when Current is ticked, ignoring any end month", () => {
    const result = experienceFromForm({
      ...formFromExperience(experience),
      current: true,
      endDate: "2025-08",
    });
    expect(result).toEqual({ ok: true, experience: { ...experience, endDate: null } });
  });
});

describe("experienceFromForm with invalid input", () => {
  const valid = formFromExperience(experience);

  function errorsFor(overrides: Partial<typeof valid>) {
    const result = experienceFromForm({ ...valid, ...overrides });
    expect(result.ok).toBe(false);
    return result.ok ? {} : result.errors;
  }

  it("asks for a title when it's blank", () => {
    expect(errorsFor({ title: "   " })).toEqual({ title: "Add a title." });
  });

  it("asks for a start month when it's missing", () => {
    expect(errorsFor({ startDate: "" })).toEqual({
      startDate: "Pick a start month.",
    });
  });

  it("asks for an end month or Current when the end is missing", () => {
    expect(errorsFor({ endDate: "", current: false })).toEqual({
      endDate: "Pick an end month, or tick Current.",
    });
  });

  it("rejects an end month before the start month", () => {
    expect(errorsFor({ startDate: "2025-06", endDate: "2025-01" })).toEqual({
      endDate: "End month can't be before the start month.",
    });
  });

  it("asks for at least one bullet when every row is blank", () => {
    expect(errorsFor({ bullets: [{ id: "b-1", text: "  " }] })).toEqual({
      bullets: "Add at least one bullet point.",
    });
  });

  it("reports every problem at once", () => {
    expect(
      errorsFor({ title: "", startDate: "", bullets: [{ id: "b-1", text: "" }] }),
    ).toEqual({
      title: "Add a title.",
      startDate: "Pick a start month.",
      bullets: "Add at least one bullet point.",
    });
  });
});
