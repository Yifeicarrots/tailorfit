"use client";

import { useId, useState, type FormEvent } from "react";
import {
  addBulletRow,
  experienceFromForm,
  removeBulletRow,
  type ExperienceFormValues,
  type FormErrors,
  type FormField,
  type NewId,
} from "@/lib/library/experienceForm";
import type { Experience } from "@/lib/types";

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900";
const primaryButton =
  "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
const secondaryButton =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-700 dark:hover:bg-zinc-800";

type Props = {
  heading: string;
  initialValues: ExperienceFormValues;
  newId: NewId;
  onSave: (experience: Experience) => void;
  onCancel: () => void;
};

export function ExperienceForm({
  heading,
  initialValues,
  newId,
  onSave,
  onCancel,
}: Props) {
  const [values, setValues] = useState(initialValues);
  // null = no failed save yet.
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const idPrefix = useId();
  const fieldId = (name: string) => `${idPrefix}-${name}`;
  const errorId = (field: FormField) => `${idPrefix}-${field}-error`;

  function update(patch: Partial<ExperienceFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  function setBulletText(id: string, text: string) {
    setValues((current) => ({
      ...current,
      bullets: current.bullets.map((b) => (b.id === id ? { ...b, text } : b)),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = experienceFromForm(values);
    if (result.ok) {
      onSave(result.experience);
    } else {
      setErrors(result.errors);
    }
  }

  function errorProps(field: FormField) {
    return errors?.[field]
      ? { "aria-invalid": true, "aria-describedby": errorId(field) }
      : {};
  }

  function errorText(field: FormField) {
    const message = errors?.[field];
    if (!message) return null;
    return (
      <p id={errorId(field)} className="text-sm text-red-600 dark:text-red-400">
        {message}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-zinc-300 p-4 dark:border-zinc-700"
    >
      <h2 className="font-semibold">{heading}</h2>

      <fieldset className="flex gap-4">
        <legend className="mb-1 text-sm font-medium">Type</legend>
        {(["experience", "project"] as const).map((type) => (
          <label key={type} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={fieldId("type")}
              checked={values.type === type}
              onChange={() => update({ type })}
            />
            {type === "experience" ? "Experience" : "Project"}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId("title")} className="text-sm font-medium">
          Title
        </label>
        <input
          id={fieldId("title")}
          value={values.title}
          onChange={(e) => update({ title: e.target.value })}
          className={inputClass}
          {...errorProps("title")}
        />
        {errorText("title")}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId("organization")} className="text-sm font-medium">
          Organization <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <input
          id={fieldId("organization")}
          value={values.organization}
          onChange={(e) => update({ organization: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={fieldId("start")} className="text-sm font-medium">
            Start month
          </label>
          <input
            id={fieldId("start")}
            type="month"
            value={values.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
            className={inputClass}
            {...errorProps("startDate")}
          />
          {errorText("startDate")}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={fieldId("end")} className="text-sm font-medium">
            End month
          </label>
          <input
            id={fieldId("end")}
            type="month"
            value={values.endDate}
            disabled={values.current}
            onChange={(e) => update({ endDate: e.target.value })}
            className={inputClass}
            {...errorProps("endDate")}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.current}
              onChange={(e) => update({ current: e.target.checked })}
            />
            Current
          </label>
          {errorText("endDate")}
        </div>
      </div>

      <fieldset className="flex flex-col gap-2" {...errorProps("bullets")}>
        <legend className="mb-1 text-sm font-medium">Bullet points</legend>
        {values.bullets.map((bullet, index) => (
          <div key={bullet.id} className="flex gap-2">
            <input
              aria-label={`Bullet ${index + 1}`}
              value={bullet.text}
              onChange={(e) => setBulletText(bullet.id, e.target.value)}
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              className={secondaryButton}
              disabled={values.bullets.length <= 1}
              onClick={() => setValues((v) => removeBulletRow(v, bullet.id))}
            >
              Remove
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => setValues((v) => addBulletRow(v, newId))}
          >
            Add bullet
          </button>
        </div>
        {errorText("bullets")}
      </fieldset>

      {errors && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t save yet. Fix the problems above, then save again.
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" className={primaryButton}>
          Save
        </button>
        <button type="button" className={secondaryButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
