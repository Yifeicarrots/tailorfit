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

  const tokenize = (text: string) =>
    text
      .split(/[\s\-/]+/)
      .map((t) => t.replace(/^[^\w]+|[^\w+#]+$/g, ""))
      .filter((t) => t.length > 0);

  const originalTerms = new Set(tokenize(original).map((t) => t.toLowerCase()));
  tokenize(rewritten).forEach((term, i) => {
    if (/^\d/.test(term)) return;
    const looksLikeTerm =
      /[+#]/.test(term) ||
      /\w\.\w/.test(term) ||
      /^[A-Z]{2,}$/.test(term) ||
      (i > 0 && /^[A-Z]/.test(term));
    if (looksLikeTerm && !originalTerms.has(term.toLowerCase())) {
      problems.push(
        `Possible invented skill or employer "${term}" is not in the original bullet`,
      );
    }
  });

  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}
