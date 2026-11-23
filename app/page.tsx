import { DemoSignIn } from "./DemoSignIn";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">TailorFit</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Tailor your resume to each job, using the experiences you save once.
        </p>
      </header>
      <DemoSignIn />
    </main>
  );
}
