// Provisional shape of the rewrite result until #1 adds the real Zod schema
// to lib/types.ts. Replace this with the z.infer type once it merges.
// `title` comes from the selected experience, merged in at integration.
export type ProvisionalRewriteResult = {
  items: {
    id: string;
    title: string;
    bullets: {
      original: string;
      rewritten: string;
      flagged: boolean;
      flagReason?: string;
    }[];
  }[];
};
