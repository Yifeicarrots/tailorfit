import type { Experience, ExperienceLibrary } from "@/lib/types";

export function addItem(library: ExperienceLibrary, item: Experience): ExperienceLibrary {
  return [...library, item];
}

export function updateItem(library: ExperienceLibrary, item: Experience): ExperienceLibrary {
  return library.map((existing) => (existing.id === item.id ? item : existing));
}

export function deleteItem(library: ExperienceLibrary, id: string): ExperienceLibrary {
  return library.filter((existing) => existing.id !== id);
}
