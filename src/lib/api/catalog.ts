import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { apiRequest, apiRequestWithMeta, ApiError } from "@/lib/api/client";
import {
  CategoryListSchema,
  IdentifierSchema,
  ProductListMetaSchema,
  ProductListSchema,
  ProductSchema,
  PromotionSchema,
  StockSchema,
  type Category,
  type Product,
  type Promotion,
  type Stock,
} from "@/lib/api/schemas";
import { MAX_QUERY_LENGTH, normalizeQuery } from "@/lib/search-params";

export type Pagination = ReturnType<typeof ProductListMetaSchema.parse>["pagination"];

export interface ProductList {
  products: Product[];
  pagination: Pagination;
}

export interface GetProductsParams {
  search?: string;
  category?: string;
  limit?: number;
  page?: number;
}

const MAX_LIMIT = 100;

/** Featured products for the home page. */
export async function getFeaturedProducts(limit = 3): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", "products:featured");

  const { data } = await apiRequestWithMeta(
    { path: ["products"], query: { featured: "true", limit: clampLimit(limit) } },
    ProductListSchema,
    ProductListMetaSchema,
  );
  return data;
}

/** Product list and search. Params come from the URL, so validate them again. */
export async function getProducts(params: GetProductsParams = {}): Promise<ProductList> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const search = normalizeQuery(params.search ?? "").slice(0, MAX_QUERY_LENGTH);
  const category = IdentifierSchema.safeParse(params.category);
  const { data, meta } = await apiRequestWithMeta(
    {
      path: ["products"],
      query: {
        search: search === "" ? undefined : search,
        category: category.success ? category.data : undefined,
        limit: clampLimit(params.limit ?? 20),
        page: clampPage(params.page ?? 1),
      },
    },
    ProductListSchema,
    ProductListMetaSchema,
  );
  return { products: data, pagination: meta.pagination };
}

/** One product by slug (or id). Returns `null` when it doesn't exist. */
export async function getProduct(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("hours");

  // Slugs come from the URL; validate before using one in a cache tag.
  const parsed = IdentifierSchema.safeParse(slug);
  if (!parsed.success) {
    return null;
  }
  cacheTag("products", `product:${parsed.data}`);
  try {
    return await apiRequest({ path: ["products", parsed.data] }, ProductSchema);
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not_found") {
      return null;
    }
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("days");
  cacheTag("categories");

  return apiRequest({ path: ["categories"] }, CategoryListSchema);
}

/** The API returns a random active promotion; cache briefly so it still rotates. */
export async function getActivePromotion(): Promise<Promotion | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("promotion");

  try {
    const promotion = await apiRequest({ path: ["promotions"] }, PromotionSchema);
    return promotion.active ? promotion : null;
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not_found") {
      return null;
    }
    throw error;
  }
}

/** Live stock. Not cached: it changes on every request. */
export async function getStock(slug: string): Promise<Stock | null> {
  const parsed = IdentifierSchema.safeParse(slug);
  if (!parsed.success) {
    return null;
  }
  try {
    return await apiRequest({ path: ["products", parsed.data, "stock"] }, StockSchema);
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not_found") {
      return null;
    }
    throw error;
  }
}

function clampLimit(limit: number): number {
  return Math.min(Math.max(Number.isFinite(limit) ? Math.trunc(limit) : 1, 1), MAX_LIMIT);
}

function clampPage(page: number): number {
  return Math.max(Number.isFinite(page) ? Math.trunc(page) : 1, 1);
}
