"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { browserStore } from "@/lib/storage/browserStore";
import { loadUserName } from "@/lib/storage/storage";
import { LibraryEditor } from "./LibraryEditor";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

// undefined = not read yet (server render and hydration), null = signed out.
const readUserName = () => loadUserName(browserStore());
const unknown = () => undefined;

export function LibraryScreen() {
  const userName = useSyncExternalStore(subscribe, readUserName, unknown);

  if (userName === undefined) {
    return <p className="text-zinc-500">Loading…</p>;
  }

  if (userName === null) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Please sign in first.{" "}
        <Link href="/" className="font-medium underline">
          Go to sign-in
        </Link>
      </p>
    );
  }

  // Only rendered on the client, so LibraryEditor can read storage while
  // initializing its state.
  return <LibraryEditor />;
}
