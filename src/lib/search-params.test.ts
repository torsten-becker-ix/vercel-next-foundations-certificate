import { describe, expect, it } from "vitest";
import { MAX_QUERY_LENGTH, buildSearchHref, parseSearchParams } from "@/lib/search-params";

const categories = ["hats", "t-shirts", "mugs"] as const;

describe("parseSearchParams", () => {
  it("returns empty state when nothing is provided", () => {
    expect(parseSearchParams({}, categories)).toEqual({ q: "", category: null });
  });

  it("trims and collapses whitespace in q", () => {
    expect(parseSearchParams({ q: "  black   hat " }, categories)).toEqual({
      q: "black hat",
      category: null,
    });
  });

  it("truncates q to the max length", () => {
    const { q } = parseSearchParams({ q: "a".repeat(500) }, categories);
    expect(q).toHaveLength(MAX_QUERY_LENGTH);
  });

  it("strips control characters", () => {
    expect(parseSearchParams({ q: "mu\u0000g\u001f" }, categories).q).toBe("mug");
  });

  it("uses the first value when params are repeated", () => {
    expect(
      parseSearchParams({ q: ["mug", "hat"], category: ["hats", "mugs"] }, categories),
    ).toEqual({ q: "mug", category: "hats" });
  });

  it("accepts known categories and rejects unknown ones", () => {
    expect(parseSearchParams({ category: "mugs" }, categories).category).toBe("mugs");
    expect(parseSearchParams({ category: "bogus" }, categories).category).toBeNull();
    expect(parseSearchParams({ category: "__proto__" }, categories).category).toBeNull();
  });
});

describe("buildSearchHref", () => {
  it("omits empty params", () => {
    expect(buildSearchHref({ q: "", category: null })).toBe("/search");
  });

  it("encodes params", () => {
    expect(buildSearchHref({ q: "a&b c", category: "hats" })).toBe(
      "/search?q=a%26b+c&category=hats",
    );
  });
});
