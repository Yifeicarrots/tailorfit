export type NoInventionResult = { ok: true } | { ok: false; problems: string[] };

export function checkNoInvention(
  original: string,
  rewritten: string,
): NoInventionResult {
  const originalNumbers = new Set(original.match(/\d+(?:[.,]\d+)*%?/g) ?? []);
  const problems = (rewritten.match(/\d+(?:[.,]\d+)*%?/g) ?? [])
    .filter((n) => !originalNumbers.has(n))
    .map((n) => `Invented number "${n}" is not in the original bullet`);

  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}
