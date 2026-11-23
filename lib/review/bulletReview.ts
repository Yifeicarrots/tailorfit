import type { Experience, RewriteResult } from "@/lib/types";

export type ReviewBullet = {
  key: string;
  id: string;
  original: string;
  rewritten: string;
  flagged: boolean;
  flagReason?: string;
  status: "pending" | "accepted" | "edited";
  finalText: string | null;
};

export type ReviewState = {
  items: {
    id: string;
    title: string;
    organization?: string;
    bullets: ReviewBullet[];
  }[];
};

export type ReviewAction =
  | { type: "accept"; key: string }
  | { type: "edit"; key: string; text: string };

export function initReview(
  result: RewriteResult,
  experiences: Experience[],
): ReviewState {
  return {
    items: result.items.map((item) => {
      const experience = experiences.find((e) => e.id === item.id);
      if (!experience) {
        throw new Error(`Unknown experience ID "${item.id}"`);
      }
      return {
        id: item.id,
        title: experience.title,
        organization: experience.organization,
        bullets: item.bullets.map((b) => ({
          ...b,
          key: `${item.id}:${b.id}`,
          status: "pending",
          finalText: null,
        })),
      };
    }),
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

export function isComplete(state: ReviewState): boolean {
  return state.items.every((item) =>
    item.bullets.every((b) => b.status !== "pending"),
  );
}

export function finalBullets(
  state: ReviewState,
): { id: string; title: string; bullets: string[] }[] {
  return state.items.map((item) => ({
    id: item.id,
    title: item.title,
    bullets: item.bullets.map((b) => b.finalText ?? b.original),
  }));
}
