"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { browserStore } from "@/lib/storage/browserStore";
import {
  clearUserName,
  loadLibrary,
  loadUserName,
  saveUserName,
} from "@/lib/storage/storage";

// Re-read storage after this component saves or clears the name, and when
// another tab changes it.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

// undefined = not read yet (server render and hydration), null = signed out.
const readUserName = () => loadUserName(browserStore());
const readLibraryCount = () => loadLibrary(browserStore()).length;
const unknown = () => undefined;

const buttonClass =
  "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export function DemoSignIn() {
  const userName = useSyncExternalStore(subscribe, readUserName, unknown);
  const libraryCount = useSyncExternalStore(subscribe, readLibraryCount, unknown);
  const [name, setName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    saveUserName(browserStore(), trimmed);
    setName("");
    notify();
  }

  function handleSignOut() {
    clearUserName(browserStore());
    notify();
  }

  if (userName === undefined) {
    return <p className="text-zinc-500">Loading…</p>;
  }

  if (userName !== null) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Welcome back, {userName}</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          {libraryCount === 0
            ? "Your library is empty."
            : `Your library has ${libraryCount} saved ${libraryCount === 1 ? "item" : "items"}.`}
        </p>
        <div className="flex gap-2">
          <Link href="/library" className={buttonClass}>
            Manage your library
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="demo-name" className="text-sm font-medium">
        Your name
      </label>
      <input
        id="demo-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoComplete="name"
        className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div>
        <button type="submit" disabled={!name.trim()} className={buttonClass}>
          Continue as demo user
        </button>
      </div>
      <p className="text-sm text-zinc-500">
        Demo sign-in: no password. Your data stays in this browser only.
      </p>
    </form>
  );
}
