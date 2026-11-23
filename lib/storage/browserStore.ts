import type { KeyValueStore } from "@/lib/storage/storage";

// The only place in the app that references localStorage. Browser-only:
// call it from client components, never from server code.
export function browserStore(): KeyValueStore {
  return localStorage;
}
