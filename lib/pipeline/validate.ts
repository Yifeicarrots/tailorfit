export type NoInventionResult = { ok: true } | { ok: false; problems: string[] };

const NUMBER_PATTERN = /\d+(?:[.,]\d+)*%?/g;

function extractNumbers(text: string): string[] {
  return text.match(NUMBER_PATTERN) ?? [];
}

export function checkNoInvention(
  original: string,
  rewritten: string,
): NoInventionResult {
  const originalNumbers = new Set(extractNumbers(original));
  const problems = extractNumbers(rewritten)
    .filter((n) => !originalNumbers.has(n))
    .map((n) => `Invented number "${n}" is not in the original bullet`);

  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}
