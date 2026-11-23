import { sampleExperiences, sampleRewrite } from "@/lib/review/sampleRewrite";
import { BulletComparison } from "./BulletComparison";

// Uses fixture data until the rewriter's Server Action exists (#6).
export default function ReviewPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Review your rewrites</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Compare each original bullet with its rewrite. Accept it or edit it
          so it still sounds like you.
        </p>
      </header>
      <BulletComparison
        result={sampleRewrite}
        experiences={sampleExperiences}
      />
    </main>
  );
}
