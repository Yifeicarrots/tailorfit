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

// Current items (endDate null) first, then newest start date first.
// Array.prototype.toSorted is stable, so ties keep their saved order.
export function sortLibrary(library: ExperienceLibrary): ExperienceLibrary {
  return library.toSorted((a, b) => {
    const aCurrent = a.endDate === null ? 1 : 0;
    const bCurrent = b.endDate === null ? 1 : 0;
    if (aCurrent !== bCurrent) return bCurrent - aCurrent;
    return b.startDate.localeCompare(a.startDate);
  });
}
