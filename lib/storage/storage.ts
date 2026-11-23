import type { ExperienceLibrary } from "@/lib/types";

export type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const LIBRARY_KEY = "tailorfit:library";

export function saveLibrary(store: KeyValueStore, library: ExperienceLibrary): void {
  store.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function loadLibrary(store: KeyValueStore): ExperienceLibrary {
  const raw = store.getItem(LIBRARY_KEY);
  if (raw === null) return [];
  return JSON.parse(raw) as ExperienceLibrary;
}
