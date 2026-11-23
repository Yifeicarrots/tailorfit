import type { ProvisionalRewriteResult } from "./provisionalRewrite";

export type ReviewBullet = {
  key: string;
  original: string;
  rewritten: string;
  flagged: boolean;
  flagReason?: string;
  status: "pending" | "accepted" | "edited";
  finalText: string | null;
};

export type ReviewState = {
  items: { id: string; title: string; bullets: ReviewBullet[] }[];
};

export type ReviewAction =
  | { type: "accept"; key: string }
  | { type: "edit"; key: string; text: string };

export function initReview(result: ProvisionalRewriteResult): ReviewState {
  return {
    items: result.items.map((item) => ({
      id: item.id,
      title: item.title,
      bullets: item.bullets.map((b, i) => ({
        ...b,
        key: `${item.id}:${i}`,
        status: "pending",
        finalText: null,
      })),
    })),
  };
}

export function reviewReducer(
  state: ReviewState,
  action: ReviewAction,
): ReviewState {
  return {
    items: state.items.map((item) => ({
      ...item,
      bullets: item.bullets.map((b) =>
        b.key !== action.key
          ? b
          : action.type === "edit"
            ? { ...b, status: "edited", finalText: action.text }
            : {
                ...b,
                status: "accepted",
                finalText: b.flagged ? b.original : b.rewritten,
              },
      ),
    })),
  };
}
