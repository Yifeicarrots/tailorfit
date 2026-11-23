import { describe, expect, it } from "vitest";
import {
  finalBullets,
  initReview,
  isComplete,
  reviewReducer,
  type ReviewAction,
  type ReviewState,
} from "./bulletReview";
import type { ProvisionalRewriteResult } from "./provisionalRewrite";

const result: ProvisionalRewriteResult = {
  items: [
    {
      id: "a",
      title: "Item A",
      bullets: [
        { original: "Did x", rewritten: "Delivered x", flagged: false },
        {
          original: "Did y",
          rewritten: "Did y",
          flagged: true,
          flagReason: 'Invented number "5" is not in the original bullet',
        },
      ],
    },
    {
      id: "b",
      title: "Item B",
      bullets: [{ original: "Did z", rewritten: "Drove z", flagged: false }],
    },
  ],
};

function bullet(state: ReviewState, key: string) {
  return state.items.flatMap((item) => item.bullets).find((b) => b.key === key);
}

describe("initReview", () => {
  it("creates one pending bullet per original, keyed by item ID and index", () => {
    const state = initReview(result);

    expect(state.items.map((item) => item.bullets.map((b) => b.key))).toEqual([
      ["a:0", "a:1"],
      ["b:0"],
    ]);
    expect(bullet(state, "a:1")).toMatchObject({
      original: "Did y",
      flagged: true,
      flagReason: 'Invented number "5" is not in the original bullet',
      status: "pending",
      finalText: null,
    });
  });
});

describe("accept", () => {
  it("uses the rewrite as the final text", () => {
    const state = reviewReducer(initReview(result), { type: "accept", key: "a:0" });

    expect(bullet(state, "a:0")).toMatchObject({
      status: "accepted",
      finalText: "Delivered x",
    });
  });

  it("keeps the original as the final text for a flagged bullet", () => {
    const state = reviewReducer(initReview(result), { type: "accept", key: "a:1" });

    expect(bullet(state, "a:1")).toMatchObject({
      status: "accepted",
      finalText: "Did y",
    });
  });

  it("leaves the other bullets pending", () => {
    const state = reviewReducer(initReview(result), { type: "accept", key: "a:0" });

    expect(bullet(state, "a:1")?.status).toBe("pending");
    expect(bullet(state, "b:0")?.status).toBe("pending");
  });
});

describe("edit", () => {
  it("uses the user's text as the final text", () => {
    const state = reviewReducer(initReview(result), {
      type: "edit",
      key: "b:0",
      text: "Led z end to end",
    });

    expect(bullet(state, "b:0")).toMatchObject({
      status: "edited",
      finalText: "Led z end to end",
    });
  });

  it("replaces an earlier accept", () => {
    const accepted = reviewReducer(initReview(result), { type: "accept", key: "a:0" });
    const state = reviewReducer(accepted, {
      type: "edit",
      key: "a:0",
      text: "Shipped x",
    });

    expect(bullet(state, "a:0")).toMatchObject({
      status: "edited",
      finalText: "Shipped x",
    });
  });
});

function decideAll(): ReviewState {
  const actions: ReviewAction[] = [
    { type: "accept", key: "a:0" },
    { type: "accept", key: "a:1" },
    { type: "edit", key: "b:0", text: "Led z end to end" },
  ];
  return actions.reduce(reviewReducer, initReview(result));
}

describe("isComplete", () => {
  it("is false while any bullet is pending", () => {
    const state = reviewReducer(initReview(result), { type: "accept", key: "a:0" });

    expect(isComplete(state)).toBe(false);
  });

  it("is true once every bullet is accepted or edited", () => {
    expect(isComplete(decideAll())).toBe(true);
  });
});

describe("finalBullets", () => {
  it("lists each item's final text in the original order", () => {
    expect(finalBullets(decideAll())).toEqual([
      { id: "a", title: "Item A", bullets: ["Delivered x", "Did y"] },
      { id: "b", title: "Item B", bullets: ["Led z end to end"] },
    ]);
  });
});
