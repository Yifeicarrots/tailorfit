import { describe, expect, it } from "vitest";
import type { Experience, RewriteResult } from "@/lib/types";
import {
  finalBullets,
  initReview,
  isComplete,
  reviewReducer,
  type ReviewAction,
  type ReviewState,
} from "./bulletReview";

const experiences: Experience[] = [
  {
    id: "a",
    type: "experience",
    title: "Item A",
    organization: "Org A",
    startDate: "2025-01",
    endDate: null,
    bullets: [
      { id: "a1", text: "Did x" },
      { id: "a2", text: "Did y" },
    ],
  },
  {
    id: "b",
    type: "project",
    title: "Item B",
    startDate: "2024-09",
    endDate: "2024-12",
    bullets: [{ id: "b1", text: "Did z" }],
  },
];

const result: RewriteResult = {
  items: [
    {
      id: "a",
      bullets: [
        { id: "a1", original: "Did x", rewritten: "Delivered x", flagged: false },
        {
          id: "a2",
          original: "Did y",
          rewritten: "Did y",
          flagged: true,
          flagReason: 'Invented number "5" is not in the original bullet',
        },
      ],
    },
    {
      id: "b",
      bullets: [
        { id: "b1", original: "Did z", rewritten: "Drove z", flagged: false },
      ],
    },
  ],
};

function start(): ReviewState {
  return initReview(result, experiences);
}

function bullet(state: ReviewState, key: string) {
  return state.items.flatMap((item) => item.bullets).find((b) => b.key === key);
}

describe("initReview", () => {
  it("creates one pending bullet per original, keyed by item ID and bullet ID", () => {
    const state = start();

    expect(state.items.map((item) => item.bullets.map((b) => b.key))).toEqual([
      ["a:a1", "a:a2"],
      ["b:b1"],
    ]);
    expect(bullet(state, "a:a2")).toMatchObject({
      original: "Did y",
      flagged: true,
      flagReason: 'Invented number "5" is not in the original bullet',
      status: "pending",
      finalText: null,
    });
  });

  it("takes each item's title and organization from its experience", () => {
    const state = start();

    expect(
      state.items.map(({ id, title, organization }) => ({ id, title, organization })),
    ).toEqual([
      { id: "a", title: "Item A", organization: "Org A" },
      { id: "b", title: "Item B", organization: undefined },
    ]);
  });

  it("throws when an item's ID is not in the experiences", () => {
    expect(() => initReview(result, experiences.slice(0, 1))).toThrow(
      'Unknown experience ID "b"',
    );
  });
});

describe("accept", () => {
  it("uses the rewrite as the final text", () => {
    const state = reviewReducer(start(), { type: "accept", key: "a:a1" });

    expect(bullet(state, "a:a1")).toMatchObject({
      status: "accepted",
      finalText: "Delivered x",
    });
  });

  it("keeps the original as the final text for a flagged bullet", () => {
    const state = reviewReducer(start(), { type: "accept", key: "a:a2" });

    expect(bullet(state, "a:a2")).toMatchObject({
      status: "accepted",
      finalText: "Did y",
    });
  });

  it("leaves the other bullets pending", () => {
    const state = reviewReducer(start(), { type: "accept", key: "a:a1" });

    expect(bullet(state, "a:a2")?.status).toBe("pending");
    expect(bullet(state, "b:b1")?.status).toBe("pending");
  });
});

describe("edit", () => {
  it("uses the user's text as the final text", () => {
    const state = reviewReducer(start(), {
      type: "edit",
      key: "b:b1",
      text: "Led z end to end",
    });

    expect(bullet(state, "b:b1")).toMatchObject({
      status: "edited",
      finalText: "Led z end to end",
    });
  });

  it("replaces an earlier accept", () => {
    const accepted = reviewReducer(start(), { type: "accept", key: "a:a1" });
    const state = reviewReducer(accepted, {
      type: "edit",
      key: "a:a1",
      text: "Shipped x",
    });

    expect(bullet(state, "a:a1")).toMatchObject({
      status: "edited",
      finalText: "Shipped x",
    });
  });
});

function decideAll(): ReviewState {
  const actions: ReviewAction[] = [
    { type: "accept", key: "a:a1" },
    { type: "accept", key: "a:a2" },
    { type: "edit", key: "b:b1", text: "Led z end to end" },
  ];
  return actions.reduce(reviewReducer, start());
}

describe("isComplete", () => {
  it("is false while any bullet is pending", () => {
    const state = reviewReducer(start(), { type: "accept", key: "a:a1" });

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
