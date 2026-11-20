import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("formats integer cents as USD", () => {
    expect(formatPrice(3000, "USD")).toBe("$30.00");
    expect(formatPrice(1999, "USD")).toBe("$19.99");
    expect(formatPrice(0, "USD")).toBe("$0.00");
  });

  it("groups thousands", () => {
    expect(formatPrice(123456789, "USD")).toBe("$1,234,567.89");
  });

  it("supports other ISO currencies", () => {
    expect(formatPrice(1000, "EUR")).toBe("€10.00");
  });
});
