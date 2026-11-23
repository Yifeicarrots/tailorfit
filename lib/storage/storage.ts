import { z } from "zod";
import { experienceLibrarySchema, type ExperienceLibrary } from "@/lib/types";

export type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const LIBRARY_KEY = "tailorfit:library";
const LIBRARY_BACKUP_KEY = "tailorfit:library:backup";
const USER_NAME_KEY = "tailorfit:userName";

const userNameSchema = z.string().min(1);

// Reads a JSON value and validates it; missing, corrupted, or invalid data
// returns the fallback instead of throwing.
function readJson<T>(
  store: KeyValueStore,
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  const raw = store.getItem(key);
  if (raw === null) return fallback;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }
  const result = schema.safeParse(parsed);
  return result.success ? result.data : fallback;
}

export function saveLibrary(store: KeyValueStore, library: ExperienceLibrary): void {
  store.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function loadLibrary(store: KeyValueStore): ExperienceLibrary {
  return readJson(store, LIBRARY_KEY, experienceLibrarySchema, []);
}

export function loadLibraryWithBackup(store: KeyValueStore): {
  library: ExperienceLibrary;
  backedUp: boolean;
} {
  const raw = store.getItem(LIBRARY_KEY);
  if (raw === null) return { library: [], backedUp: false };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  const result = experienceLibrarySchema.safeParse(parsed);
  if (result.success) return { library: result.data, backedUp: false };
  store.setItem(LIBRARY_BACKUP_KEY, raw);
  return { library: [], backedUp: true };
}

export function saveUserName(store: KeyValueStore, name: string): void {
  store.setItem(USER_NAME_KEY, JSON.stringify(name));
}

export function loadUserName(store: KeyValueStore): string | null {
  return readJson(store, USER_NAME_KEY, userNameSchema, null);
}

export function clearUserName(store: KeyValueStore): void {
  store.removeItem(USER_NAME_KEY);
}
