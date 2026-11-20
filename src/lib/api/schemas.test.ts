import { describe, expect, it } from "vitest";
import {
  CartSchema,
  CartTokenSchema,
  CategoryListSchema,
  ErrorEnvelopeSchema,
  ProductSchema,
  PromotionSchema,
  StockSchema,
  successEnvelope,
} from "@/lib/api/schemas";

const product = {
  id: "tshirt_001",
  name: "Black Crewneck T-Shirt",
  slug: "black-crewneck-t-shirt",
  description: "Plain black crewneck tee.",
  price: 3000,
  currency: "USD",
  category: "t-shirts",
  images: [
    "https://i8qy5y6gxkdgdcv9.public.blob.vercel-storage.com/storefront/black-crewneck-t-shirt.png",
  ],
  tags: ["black"],
  featured: true,
  createdAt: "2026-02-10T16:00:00Z",
};

describe("ProductSchema", () => {
  it("accepts a valid product and strips unknown keys", () => {
    const parsed = ProductSchema.parse({ ...product, injected: "<script>" });
    expect(parsed).toEqual(product);
  });

  it("rejects images from unexpected hosts or protocols", () => {
    expect(
      ProductSchema.safeParse({ ...product, images: ["https://evil.example.com/a.png"] }).success,
    ).toBe(false);
    expect(
      ProductSchema.safeParse({
        ...product,
        images: ["http://i8qy5y6gxkdgdcv9.public.blob.vercel-storage.com/storefront/a.png"],
      }).success,
    ).toBe(false);
  });

  it("rejects non-integer or negative prices", () => {
    expect(ProductSchema.safeParse({ ...product, price: 12.5 }).success).toBe(false);
    expect(ProductSchema.safeParse({ ...product, price: -1 }).success).toBe(false);
  });

  it("rejects ids/slugs with unsafe characters", () => {
    expect(ProductSchema.safeParse({ ...product, id: "../etc" }).success).toBe(false);
    expect(ProductSchema.safeParse({ ...product, slug: "a/b" }).success).toBe(false);
  });
});

describe("StockSchema", () => {
  it("accepts stock info", () => {
    expect(
      StockSchema.parse({ productId: "tshirt_001", stock: 10, inStock: true, lowStock: false }),
    ).toMatchObject({ stock: 10 });
  });

  it("rejects negative stock", () => {
    expect(
      StockSchema.safeParse({ productId: "x", stock: -1, inStock: false, lowStock: false }).success,
    ).toBe(false);
  });
});

describe("envelopes", () => {
  it("parses success envelopes with typed data", () => {
    const parsed = successEnvelope(CategoryListSchema).parse({
      success: true,
      data: [{ slug: "hats", name: "Hats", productCount: 3 }],
    });
    expect(parsed.data[0]?.slug).toBe("hats");
  });

  it("parses error envelopes", () => {
    expect(
      ErrorEnvelopeSchema.parse({
        success: false,
        error: { code: "NOT_FOUND", message: "nope" },
      }).error.code,
    ).toBe("NOT_FOUND");
  });

  it("does not treat an error envelope as success", () => {
    expect(
      successEnvelope(CategoryListSchema).safeParse({
        success: false,
        error: { code: "X", message: "y" },
      }).success,
    ).toBe(false);
  });
});

describe("PromotionSchema", () => {
  it("accepts a promotion", () => {
    expect(
      PromotionSchema.parse({
        id: "promo_002",
        title: "Free Stickers",
        description: "Free stickers.",
        discountPercent: 0,
        code: "AUTO",
        validFrom: "2025-01-01T00:00:00Z",
        validUntil: "2025-12-31T00:00:00Z",
        active: true,
      }).title,
    ).toBe("Free Stickers");
  });
});

describe("Cart schemas", () => {
  const token = "53b5f37c-5c02-4e4f-a64f-360b8dbbfa2a";

  it("validates cart tokens as UUIDs", () => {
    expect(CartTokenSchema.safeParse(token).success).toBe(true);
    expect(CartTokenSchema.safeParse("not-a-token").success).toBe(false);
    expect(CartTokenSchema.safeParse("").success).toBe(false);
  });

  it("accepts a cart with items", () => {
    const cart = CartSchema.parse({
      token,
      items: [
        {
          productId: "tshirt_001",
          quantity: 2,
          addedAt: "2026-11-18T12:51:12.378Z",
          product,
          lineTotal: 6000,
        },
      ],
      totalItems: 2,
      subtotal: 6000,
      currency: "USD",
      createdAt: "2026-11-18T12:51:12.012Z",
      updatedAt: "2026-11-18T12:51:12.378Z",
    });
    expect(cart.items).toHaveLength(1);
  });
});
