import { z } from "zod";
import { experienceLibrarySchema, type ExperienceLibrary } from "@/lib/types";

export type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const LIBRARY_KEY = "tailorfit:library";
const USER_NAME_KEY = "tailorfit:userName";

const userNameSchema = z.string().min(1);

export function saveLibrary(store: KeyValueStore, library: ExperienceLibrary): void {
  store.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function loadLibrary(store: KeyValueStore): ExperienceLibrary {
  const raw = store.getItem(LIBRARY_KEY);
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const result = experienceLibrarySchema.safeParse(parsed);
  return result.success ? result.data : [];
}

export function saveUserName(store: KeyValueStore, name: string): void {
  store.setItem(USER_NAME_KEY, JSON.stringify(name));
}

export function loadUserName(store: KeyValueStore): string | null {
  const raw = store.getItem(USER_NAME_KEY);
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = userNameSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export function clearUserName(store: KeyValueStore): void {
  store.removeItem(USER_NAME_KEY);
}
