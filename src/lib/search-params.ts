import { z } from "zod";

export const MAX_QUERY_LENGTH = 100;
/** Minimum characters before the search box auto-submits. */
export const MIN_AUTO_SEARCH_LENGTH = 3;
export const SEARCH_RESULT_LIMIT = 5;

export interface SearchState {
  q: string;
  category: string | null;
}

type RawParam = string | string[] | undefined;

const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

/** Normalizes free text: strips control chars, collapses whitespace, trims and caps length. */
export function normalizeQuery(value: string): string {
  return value
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .trim();
}

const firstValue = z.preprocess(
  (value: unknown) => (Array.isArray(value) ? (value as unknown[])[0] : value),
  z.string().optional().catch(undefined),
);

/** Parses URL search params; invalid values fall back to the defaults. */
export function parseSearchParams(
  raw: Readonly<Record<string, RawParam>>,
  knownCategories: readonly string[],
): SearchState {
  const q = normalizeQuery(firstValue.parse(raw["q"]) ?? "");
  const category = firstValue.parse(raw["category"]);
  return {
    q,
    category: category !== undefined && knownCategories.includes(category) ? category : null,
  };
}

export function buildSearchHref({ q, category }: SearchState): string {
  const params = new URLSearchParams();
  if (q !== "") {
    params.set("q", q);
  }
  if (category !== null) {
    params.set("category", category);
  }
  const query = params.toString();
  return query === "" ? "/search" : `/search?${query}`;
}
