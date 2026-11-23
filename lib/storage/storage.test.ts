import { describe, expect, it } from "vitest";
import {
  loadLibrary,
  saveLibrary,
  type KeyValueStore,
} from "@/lib/storage/storage";
import type { ExperienceLibrary } from "@/lib/types";

function fakeStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

// Fictional person.
const library: ExperienceLibrary = [
  {
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
  },
  {
    id: "proj-1",
    type: "project",
    title: "Recipe Planner",
    startDate: "2024-01",
    endDate: null,
    bullets: [{ id: "b-3", text: "Wrote a meal planner in TypeScript" }],
  },
];

describe("experience library storage", () => {
  it("returns the same library after saving and loading it", () => {
    const store = fakeStore();
    saveLibrary(store, library);
    expect(loadLibrary(store)).toEqual(library);
  });

  it("returns an empty library when nothing is stored", () => {
    expect(loadLibrary(fakeStore())).toEqual([]);
  });

  it("returns an empty library instead of throwing on corrupted JSON", () => {
    const store = fakeStore();
    store.data.set("tailorfit:library", "{not valid json");
    expect(loadLibrary(store)).toEqual([]);
  });
});
