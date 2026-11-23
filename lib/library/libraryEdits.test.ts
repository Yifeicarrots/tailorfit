import { describe, expect, it } from "vitest";
import {
  addItem,
  deleteItem,
  sortLibrary,
  updateItem,
} from "@/lib/library/libraryEdits";
import type { Experience, ExperienceLibrary } from "@/lib/types";

// Fictional person.
function item(id: string, overrides: Partial<Experience> = {}): Experience {
  return {
    id,
    type: "experience",
    title: `Role ${id}`,
    organization: "Maplewood Robotics",
    startDate: "2025-06",
    endDate: "2025-08",
    bullets: [{ id: `${id}-b1`, text: "Built a telemetry dashboard" }],
    ...overrides,
  };
}

describe("addItem", () => {
  it("returns a new library with the item appended, leaving the input unchanged", () => {
    const library: ExperienceLibrary = [item("a")];
    const result = addItem(library, item("b"));
    expect(result).toEqual([item("a"), item("b")]);
    expect(library).toEqual([item("a")]);
  });
});

describe("updateItem", () => {
  it("replaces the item with the same id", () => {
    const library = [item("a"), item("b")];
    const edited = item("b", { title: "Renamed" });
    expect(updateItem(library, edited)).toEqual([item("a"), edited]);
  });

  it("leaves the library unchanged when the id is unknown", () => {
    const library = [item("a")];
    expect(updateItem(library, item("zzz"))).toEqual([item("a")]);
  });
});

describe("deleteItem", () => {
  it("removes the item with the given id", () => {
    expect(deleteItem([item("a"), item("b")], "a")).toEqual([item("b")]);
  });
});

describe("sortLibrary", () => {
  it("puts current items first, then sorts by start date, newest first", () => {
    const old = item("old", { startDate: "2022-01", endDate: "2022-05" });
    const recent = item("recent", { startDate: "2025-06", endDate: "2025-08" });
    const currentOld = item("currentOld", { startDate: "2021-09", endDate: null });
    const currentNew = item("currentNew", { startDate: "2024-01", endDate: null });
    const sorted = sortLibrary([old, currentOld, recent, currentNew]);
    expect(sorted.map((i) => i.id)).toEqual([
      "currentNew",
      "currentOld",
      "recent",
      "old",
    ]);
  });

  it("keeps the saved order for ties and doesn't change the input", () => {
    const first = item("first");
    const second = item("second");
    const library = [first, second];
    expect(sortLibrary(library).map((i) => i.id)).toEqual(["first", "second"]);
    expect(sortLibrary(library)).not.toBe(library);
  });
});
