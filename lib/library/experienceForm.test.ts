import { describe, expect, it } from "vitest";
import {
  addBulletRow,
  emptyForm,
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
