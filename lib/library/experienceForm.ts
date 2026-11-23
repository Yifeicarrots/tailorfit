import type { Experience } from "@/lib/types";

// Form state for adding or editing one library item. Strings hold exactly what
// the inputs show; conversion to an Experience trims and validates them.
export type ExperienceFormValues = {
  id: string;
  type: Experience["type"];
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: { id: string; text: string }[];
};

export type NewId = () => string;

export function emptyForm(newId: NewId): ExperienceFormValues {
  return {
    id: newId(),
    type: "experience",
    title: "",
    organization: "",
    startDate: "",
    endDate: "",
    current: false,
    bullets: [{ id: newId(), text: "" }],
  };
}

export function formFromExperience(experience: Experience): ExperienceFormValues {
  return {
    id: experience.id,
    type: experience.type,
    title: experience.title,
    organization: experience.organization ?? "",
    startDate: experience.startDate,
    endDate: experience.endDate ?? "",
    current: experience.endDate === null,
    bullets: experience.bullets.map((b) => ({ id: b.id, text: b.text })),
  };
}

export function addBulletRow(
  values: ExperienceFormValues,
  newId: NewId,
): ExperienceFormValues {
  return { ...values, bullets: [...values.bullets, { id: newId(), text: "" }] };
}

export function removeBulletRow(
  values: ExperienceFormValues,
  bulletId: string,
): ExperienceFormValues {
  if (values.bullets.length <= 1) return values;
  return { ...values, bullets: values.bullets.filter((b) => b.id !== bulletId) };
}
