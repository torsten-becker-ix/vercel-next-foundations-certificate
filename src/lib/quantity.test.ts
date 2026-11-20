import { describe, expect, it } from "vitest";
import { MAX_QUANTITY, clampQuantity, maxSelectable } from "@/lib/quantity";

describe("clampQuantity", () => {
  it("keeps values inside the range", () => {
    expect(clampQuantity(3, 10)).toBe(3);
  });

  it("clamps to the lower bound of 1", () => {
    expect(clampQuantity(0, 10)).toBe(1);
    expect(clampQuantity(-5, 10)).toBe(1);
  });

  it("clamps to the max", () => {
    expect(clampQuantity(11, 10)).toBe(10);
  });

  it("truncates fractions and treats NaN/Infinity as 1 / max", () => {
    expect(clampQuantity(2.9, 10)).toBe(2);
    expect(clampQuantity(Number.NaN, 10)).toBe(1);
    expect(clampQuantity(Number.POSITIVE_INFINITY, 10)).toBe(10);
  });

  it("never returns less than 1 even if max is 0", () => {
    expect(clampQuantity(5, 0)).toBe(1);
  });
});

describe("maxSelectable", () => {
  it("caps stock at MAX_QUANTITY", () => {
    expect(maxSelectable(500)).toBe(MAX_QUANTITY);
    expect(maxSelectable(4)).toBe(4);
    expect(maxSelectable(0)).toBe(0);
  });
});
