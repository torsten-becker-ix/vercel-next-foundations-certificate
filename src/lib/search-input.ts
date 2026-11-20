import { MIN_AUTO_SEARCH_LENGTH, normalizeQuery } from "@/lib/search-params";

/** Delay between the last keystroke and the automatic search. */
export const SEARCH_DEBOUNCE_MS = 300;

export type InputAction = "clear" | "debounce" | "none";

/**
 * What to do after the search text changes: clear the query, start the debounce, or nothing.
 * Uses the normalized text, so spaces don't count toward the minimum length.
 */
export function decideInputAction(rawValue: string, committedQuery: string): InputAction {
  const query = normalizeQuery(rawValue);
  if (query === "") {
    return committedQuery === "" ? "none" : "clear";
  }
  if (query.length < MIN_AUTO_SEARCH_LENGTH || query === committedQuery) {
    return "none";
  }
  return "debounce";
}
