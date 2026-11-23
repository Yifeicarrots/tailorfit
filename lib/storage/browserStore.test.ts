import { afterEach, expect, it, vi } from "vitest";
import { browserStore } from "@/lib/storage/browserStore";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("returns the browser's localStorage", () => {
  const fake = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
  vi.stubGlobal("localStorage", fake);
  expect(browserStore()).toBe(fake);
});
