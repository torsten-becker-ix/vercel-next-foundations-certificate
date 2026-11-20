import { describe, expect, it } from "vitest";
import { MAX_QUERY_LENGTH } from "@/lib/search-params";
import { decideInputAction, SEARCH_DEBOUNCE_MS } from "@/lib/search-input";

describe("decideInputAction", () => {
  it("waits for at least 3 characters", () => {
    expect(decideInputAction("a", "")).toBe("none");
    expect(decideInputAction("ab", "")).toBe("none");
    expect(decideInputAction("abc", "")).toBe("debounce");
  });

  it("does not count padding whitespace towards the minimum", () => {
    expect(decideInputAction("  ab  ", "")).toBe("none");
    expect(decideInputAction("a   b", "")).toBe("debounce"); // normalizes to "a b" (3 chars)
  });

  it("clears only when the URL actually has a query", () => {
    expect(decideInputAction("", "shirt")).toBe("clear");
    expect(decideInputAction("   ", "shirt")).toBe("clear");
    expect(decideInputAction("", "")).toBe("none");
  });

  it("skips searching for what is already in the URL", () => {
    expect(decideInputAction("shirt", "shirt")).toBe("none");
    expect(decideInputAction(" shirt ", "shirt")).toBe("none");
    expect(decideInputAction("shirts", "shirt")).toBe("debounce");
  });

  it("keeps a short edit of a committed query idle", () => {
    expect(decideInputAction("sh", "shirt")).toBe("none");
  });

  it("handles very long input", () => {
    expect(decideInputAction("x".repeat(MAX_QUERY_LENGTH * 3), "")).toBe("debounce");
  });

  it("uses a ~300ms debounce", () => {
    expect(SEARCH_DEBOUNCE_MS).toBe(300);
  });
});
