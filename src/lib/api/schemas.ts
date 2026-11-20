import { z } from "zod";
import { PRODUCT_IMAGE_HOSTNAME, PRODUCT_IMAGE_PATH_PREFIX } from "@/lib/images";

// All API responses are parsed with these. Unknown keys are stripped, not rejected.

/** Product ids, slugs and category slugs: lowercase alnum plus `-`/`_`. */
export const IdentifierSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9][a-z0-9_-]*$/i);

const CentsSchema = z.number().int().nonnegative().max(100_000_000);
const CurrencySchema = z.string().regex(/^[A-Z]{3}$/);
const IsoDateSchema = z.iso.datetime({ offset: true });

/** Only https images on the known blob host are allowed through. */
const ProductImageSchema = z.url({ protocol: /^https$/ }).refine(
  (value) => {
    const url = new URL(value);
    return (
      url.hostname === PRODUCT_IMAGE_HOSTNAME && url.pathname.startsWith(PRODUCT_IMAGE_PATH_PREFIX)
    );
  },
  { message: "Unexpected image origin or path" },
);

export const ProductSchema = z.object({
  id: IdentifierSchema,
  name: z.string().min(1).max(200),
  slug: IdentifierSchema,
  description: z.string().max(5000),
  price: CentsSchema,
  currency: CurrencySchema,
  category: IdentifierSchema,
  images: z.array(ProductImageSchema).min(1),
  tags: z.array(z.string().max(50)),
  featured: z.boolean(),
  createdAt: IsoDateSchema,
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductListSchema = z.array(ProductSchema);

export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const ProductListMetaSchema = z.object({ pagination: PaginationSchema });

export const StockSchema = z.object({
  productId: IdentifierSchema,
  stock: z.number().int().nonnegative(),
  inStock: z.boolean(),
  lowStock: z.boolean(),
});
export type Stock = z.infer<typeof StockSchema>;

export const CategorySchema = z.object({
  slug: IdentifierSchema,
  name: z.string().min(1).max(100),
  productCount: z.number().int().nonnegative(),
});
export type Category = z.infer<typeof CategorySchema>;
export const CategoryListSchema = z.array(CategorySchema);

export const PromotionSchema = z.object({
  id: IdentifierSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  discountPercent: z.number().min(0).max(100),
  code: z.string().max(50),
  validFrom: IsoDateSchema,
  validUntil: IsoDateSchema,
  active: z.boolean(),
});
export type Promotion = z.infer<typeof PromotionSchema>;

export const CartTokenSchema = z.uuid();

export const CartItemSchema = z.object({
  productId: IdentifierSchema,
  quantity: z.number().int().min(1),
  addedAt: IsoDateSchema,
  product: ProductSchema,
  lineTotal: CentsSchema,
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  token: CartTokenSchema,
  items: z.array(CartItemSchema),
  totalItems: z.number().int().nonnegative(),
  subtotal: CentsSchema,
  currency: CurrencySchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});
export type Cart = z.infer<typeof CartSchema>;

export function successEnvelope<T extends z.ZodType>(data: T) {
  return z.object({ success: z.literal(true), data });
}

export function successEnvelopeWithMeta<T extends z.ZodType, M extends z.ZodType>(
  data: T,
  meta: M,
) {
  return z.object({ success: z.literal(true), data, meta });
}

export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string().max(100),
    message: z.string().max(1000),
  }),
});
