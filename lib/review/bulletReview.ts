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

// Accepting a flagged bullet keeps its original, since its rewrite failed
// the no-invention check.
function applyAction(bullet: ReviewBullet, action: ReviewAction): ReviewBullet {
  switch (action.type) {
    case "accept":
      return {
        ...bullet,
        status: "accepted",
        finalText: bullet.flagged ? bullet.original : bullet.rewritten,
      };
    case "edit":
      return { ...bullet, status: "edited", finalText: action.text };
  }
}

export function reviewReducer(
  state: ReviewState,
  action: ReviewAction,
): ReviewState {
  return {
    items: state.items.map((item) => ({
      ...item,
      bullets: item.bullets.map((b) =>
        b.key === action.key ? applyAction(b, action) : b,
      ),
    })),
  };
}
