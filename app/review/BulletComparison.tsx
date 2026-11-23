"use client";

import { useReducer, useState } from "react";
import {
  finalBullets,
  initReview,
  isComplete,
  reviewReducer,
  type ReviewBullet,
} from "@/lib/review/bulletReview";
import type { ProvisionalRewriteResult } from "@/lib/review/provisionalRewrite";

const statusStyles: Record<ReviewBullet["status"], string> = {
  pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  accepted:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  edited: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
};

const buttonClass =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-700 dark:hover:bg-zinc-800";

export function BulletComparison({
  result,
}: {
  result: ProvisionalRewriteResult;
}) {
  const [state, dispatch] = useReducer(reviewReducer, result, initReview);
  const [editing, setEditing] = useState<{ key: string; text: string } | null>(
    null,
  );

  const allBullets = state.items.flatMap((item) => item.bullets);
  const reviewed = allBullets.filter((b) => b.status !== "pending").length;
  const complete = isComplete(state);

  function saveEdit() {
    if (!editing || editing.text.trim() === "") return;
    dispatch({ type: "edit", key: editing.key, text: editing.text.trim() });
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        {reviewed} of {allBullets.length} bullets reviewed
      </p>

      {state.items.map((item) => (
        <section key={item.id} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{item.title}</h2>

          <div className="hidden grid-cols-2 gap-4 px-4 text-xs font-medium uppercase tracking-wide text-zinc-500 sm:grid">
            <span>Original</span>
            <span>Rewrite</span>
          </div>

          {item.bullets.map((b) => {
            const isEditing = editing?.key === b.key;
            const shown = b.finalText ?? (b.flagged ? b.original : b.rewritten);

            return (
              <article
                key={b.key}
                className={`flex flex-col gap-3 rounded-lg border p-4 ${
                  b.flagged
                    ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                {b.flagged && (
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    <span className="font-semibold">Original kept:</span> the
                    rewrite added something that isn&apos;t in your bullet.
                    {b.flagReason && (
                      <span className="mt-1 block text-amber-800 dark:text-amber-300">
                        {b.flagReason}
                      </span>
                    )}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <span className="text-xs font-medium uppercase text-zinc-500 sm:hidden">
                      Original
                    </span>
                    <p className="text-zinc-700 dark:text-zinc-300">
                      {b.original}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-zinc-500 sm:hidden">
                      Rewrite
                    </span>
                    {isEditing ? (
                      <textarea
                        aria-label="Edit bullet"
                        className="w-full rounded-md border border-zinc-300 bg-transparent p-2 dark:border-zinc-700"
                        rows={3}
                        value={editing.text}
                        onChange={(e) =>
                          setEditing({ key: b.key, text: e.target.value })
                        }
                        autoFocus
                      />
                    ) : (
                      <p className="font-medium">{shown}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[b.status]}`}
                  >
                    {b.status}
                  </span>
                  <span className="flex-1" />
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={`${buttonClass} bg-foreground text-background hover:bg-foreground/80 dark:hover:bg-foreground/80`}
                        onClick={saveEdit}
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() => setEditing({ key: b.key, text: shown })}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() => dispatch({ type: "accept", key: b.key })}
                        disabled={b.status === "accepted"}
                      >
                        {b.flagged ? "Accept original" : "Accept"}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ))}

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Final version</h2>
        {complete ? (
          <div className="mt-3 flex flex-col gap-4">
            {finalBullets(state).map((item) => (
              <div key={item.id}>
                <h3 className="font-medium">{item.title}</h3>
                <ul className="mt-1 list-disc pl-5">
                  {item.bullets.map((text, i) => (
                    <li key={i}>{text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            Accept or edit every bullet to see your final version.
          </p>
        )}
      </section>
    </div>
  );
}
