import { vi } from "vitest";

// `server-only` throws when imported outside a React Server environment.
// Mock it once here so server modules can be unit-tested.
vi.mock("server-only", () => ({}));
