import Link from "next/link";
import { LibraryScreen } from "./LibraryScreen";

export default function LibraryPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold">Your experience library</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Save every experience and project once. TailorFit picks from these
          for each job.
        </p>
      </header>
      <LibraryScreen />
    </main>
  );
}
