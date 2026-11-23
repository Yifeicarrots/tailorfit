import type { Experience, SelectionResult } from "@/lib/types";

export type NoInventionResult = { ok: true } | { ok: false; problems: string[] };

const NUMBER_PATTERN = /\d+(?:[.,]\d+)*%?/g;

function extractNumbers(text: string): string[] {
  return text.match(NUMBER_PATTERN) ?? [];
}

// Splits on whitespace, hyphens, and slashes, then trims surrounding
// punctuation while keeping the + and # in names like C++ and C#.
function tokenize(text: string): string[] {
  return text
    .split(/[\s\-/]+/)
    .map((t) => t.replace(/^[^\w]+|[^\w+#]+$/g, ""))
    .filter((t) => t.length > 0);
}

// Heuristic for skills and employers: symbols (C++, Node.js), acronyms,
// or a capital letter anywhere but the bullet's first word.
function looksLikeSkillOrEmployer(token: string, index: number): boolean {
  if (/^\d/.test(token)) return false;
  return (
    /[+#]/.test(token) ||
    /\w\.\w/.test(token) ||
    /^[A-Z]{2,}$/.test(token) ||
    (index > 0 && /^[A-Z]/.test(token))
  );
}

function findInventedNumbers(original: string, rewritten: string): string[] {
  const originalNumbers = new Set(extractNumbers(original));
  return extractNumbers(rewritten)
    .filter((n) => !originalNumbers.has(n))
    .map((n) => `Invented number "${n}" is not in the original bullet`);
}

function findInventedTerms(original: string, rewritten: string): string[] {
  const originalTerms = new Set(tokenize(original).map((t) => t.toLowerCase()));
  return tokenize(rewritten)
    .filter(
      (t, i) =>
        looksLikeSkillOrEmployer(t, i) && !originalTerms.has(t.toLowerCase()),
    )
    .map(
      (t) =>
        `Possible invented skill or employer "${t}" is not in the original bullet`,
    );
}

export function checkNoInvention(
  original: string,
  rewritten: string,
): NoInventionResult {
  const problems = [
    ...findInventedNumbers(original, rewritten),
    ...findInventedTerms(original, rewritten),
  ];
  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}

export type SelectionIdsResult = { ok: true } | { ok: false; problems: string[] };

export function checkSelectionIds(
  selection: SelectionResult,
  library: Experience[],
): SelectionIdsResult {
  const libraryIds = new Set(library.map((e) => e.id));
  const seen = new Set<string>();
  const problems: string[] = [];
  for (const pick of selection.selected) {
    if (!libraryIds.has(pick.id)) {
      problems.push(`Selected ID "${pick.id}" is not in the library`);
    } else if (seen.has(pick.id)) {
      problems.push(`Selected ID "${pick.id}" appears more than once`);
    }
    seen.add(pick.id);
  }
  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}
