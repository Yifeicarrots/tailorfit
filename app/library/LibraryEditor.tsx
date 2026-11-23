"use client";

import { useState } from "react";
import {
  emptyForm,
  formFromExperience,
  type ExperienceFormValues,
} from "@/lib/library/experienceForm";
import {
  addItem,
  deleteItem,
  sortLibrary,
  updateItem,
} from "@/lib/library/libraryEdits";
import { browserStore } from "@/lib/storage/browserStore";
import { loadLibraryWithBackup, saveLibrary } from "@/lib/storage/storage";
import type { Experience, ExperienceLibrary } from "@/lib/types";
import { ExperienceForm } from "./ExperienceForm";

const newId = () => crypto.randomUUID();

const primaryButton =
  "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
const secondaryButton =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

type Editing = { mode: "add" | "edit"; values: ExperienceFormValues } | null;

function formatRange(item: Experience) {
  return `${item.startDate} – ${item.endDate ?? "Present"}`;
}

export function LibraryEditor() {
  const [initial] = useState(() => loadLibraryWithBackup(browserStore()));
  const [library, setLibrary] = useState<ExperienceLibrary>(initial.library);
  const [editing, setEditing] = useState<Editing>(null);

  function persist(next: ExperienceLibrary) {
    saveLibrary(browserStore(), next);
    setLibrary(next);
  }

  function handleSave(experience: Experience) {
    if (!editing) return;
    persist(
      editing.mode === "add"
        ? addItem(library, experience)
        : updateItem(library, experience),
    );
    setEditing(null);
  }

  function handleDelete(item: Experience) {
    if (!window.confirm(`Delete “${item.title}”? This can't be undone.`)) return;
    persist(deleteItem(library, item.id));
    if (editing?.values.id === item.id) setEditing(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {initial.backedUp && (
        <p
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
        >
          Some saved library data couldn&apos;t be read, so the library is
          starting empty. A copy of the old data was kept in this browser
          under <code>tailorfit:library:backup</code>.
        </p>
      )}

      {editing?.mode === "add" ? (
        <ExperienceForm
          heading="Add an item"
          initialValues={editing.values}
          newId={newId}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div>
          <button
            type="button"
            className={primaryButton}
            onClick={() => setEditing({ mode: "add", values: emptyForm(newId) })}
          >
            Add an experience or project
          </button>
        </div>
      )}

      {library.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          Your library is empty. Add your first experience or project.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sortLibrary(library).map((item) =>
            editing?.mode === "edit" && editing.values.id === item.id ? (
              <li key={item.id}>
                <ExperienceForm
                  heading={`Edit “${item.title}”`}
                  initialValues={editing.values}
                  newId={newId}
                  onSave={handleSave}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {item.type === "project" ? "Project" : "Experience"}
                      </span>
                      <h2 className="font-semibold">{item.title}</h2>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {item.organization ? `${item.organization} · ` : ""}
                      {formatRange(item)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() =>
                        setEditing({ mode: "edit", values: formFromExperience(item) })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() => handleDelete(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <ul className="list-disc pl-5 text-sm">
                  {item.bullets.map((bullet) => (
                    <li key={bullet.id}>{bullet.text}</li>
                  ))}
                </ul>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
