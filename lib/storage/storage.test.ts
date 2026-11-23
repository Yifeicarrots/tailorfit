import { describe, expect, it } from "vitest";
import {
  clearUserName,
  loadLibrary,
  loadLibraryWithBackup,
  loadUserName,
  saveLibrary,
  saveUserName,
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

  it("returns an empty library instead of throwing when data fails the schema", () => {
    const store = fakeStore();
    const noBullets = [{ ...library[0], bullets: [] }];
    store.data.set("tailorfit:library", JSON.stringify(noBullets));
    expect(loadLibrary(store)).toEqual([]);
  });
});

describe("loading the library with a backup of invalid data", () => {
  it("returns an empty library and no backup when nothing is stored", () => {
    const store = fakeStore();
    expect(loadLibraryWithBackup(store)).toEqual({ library: [], backedUp: false });
    expect(store.data.has("tailorfit:library:backup")).toBe(false);
  });

  it("returns a valid library without writing a backup", () => {
    const store = fakeStore();
    saveLibrary(store, library);
    expect(loadLibraryWithBackup(store)).toEqual({ library, backedUp: false });
    expect(store.data.has("tailorfit:library:backup")).toBe(false);
  });

  it("copies data that fails the schema to the backup key and reports it", () => {
    const store = fakeStore();
    const raw = JSON.stringify([{ ...library[0], bullets: [] }]);
    store.data.set("tailorfit:library", raw);
    expect(loadLibraryWithBackup(store)).toEqual({ library: [], backedUp: true });
    expect(store.data.get("tailorfit:library:backup")).toBe(raw);
  });

  it("copies corrupted JSON to the backup key instead of throwing", () => {
    const store = fakeStore();
    store.data.set("tailorfit:library", "{not valid json");
    expect(loadLibraryWithBackup(store)).toEqual({ library: [], backedUp: true });
    expect(store.data.get("tailorfit:library:backup")).toBe("{not valid json");
  });
});

describe("demo user name storage", () => {
  it("returns null when no name is stored", () => {
    expect(loadUserName(fakeStore())).toBeNull();
  });

  it("returns the saved name", () => {
    const store = fakeStore();
    saveUserName(store, "Avery Quinn");
    expect(loadUserName(store)).toBe("Avery Quinn");
  });

  it("returns null after the name is cleared", () => {
    const store = fakeStore();
    saveUserName(store, "Avery Quinn");
    clearUserName(store);
    expect(loadUserName(store)).toBeNull();
  });

  it("returns null instead of throwing on corrupted or invalid data", () => {
    const store = fakeStore();
    store.data.set("tailorfit:userName", "{not valid json");
    expect(loadUserName(store)).toBeNull();
    store.data.set("tailorfit:userName", JSON.stringify(42));
    expect(loadUserName(store)).toBeNull();
  });
});
