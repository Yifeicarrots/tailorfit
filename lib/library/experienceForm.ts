import { experienceSchema, type Experience } from "@/lib/types";

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

export type FormField = "title" | "organization" | "startDate" | "endDate" | "bullets";
export type FormErrors = Partial<Record<FormField, string>>;

export type FormResult =
  | { ok: true; experience: Experience }
  | { ok: false; errors: FormErrors };

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

export function experienceFromForm(values: ExperienceFormValues): FormResult {
  const organization = values.organization.trim();
  const candidate = {
    id: values.id,
    type: values.type,
    title: values.title.trim(),
    ...(organization ? { organization } : {}),
    startDate: values.startDate,
    endDate: values.current ? null : values.endDate,
    bullets: values.bullets
      .map((b) => ({ id: b.id, text: b.text.trim() }))
      .filter((b) => b.text !== ""),
  };
  const result = experienceSchema.safeParse(candidate);
  if (result.success) return { ok: true, experience: result.data };
  return { ok: false, errors: {} };
}
