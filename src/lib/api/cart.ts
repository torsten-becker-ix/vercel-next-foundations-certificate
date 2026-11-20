import "server-only";
import { ApiError, apiRequest } from "@/lib/api/client";
import { CartSchema, CartTokenSchema, IdentifierSchema, type Cart } from "@/lib/api/schemas";

// Per-user cart calls, never cached. An unknown token means the cart expired.

export function createCart(): Promise<Cart> {
  return apiRequest({ method: "POST", path: ["cart", "create"] }, CartSchema);
}

/** Returns `null` when the token is malformed, unknown or expired. */
export async function getCart(token: string): Promise<Cart | null> {
  const parsed = CartTokenSchema.safeParse(token);
  if (!parsed.success) {
    return null;
  }
  try {
    return await apiRequest({ path: ["cart"], cartToken: parsed.data }, CartSchema);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.kind === "not_found" || error.kind === "unauthorized")
    ) {
      return null;
    }
    throw error;
  }
}

export function addItem(token: string, productId: string, quantity: number): Promise<Cart> {
  return mutate(token, productId, (cartToken, id) =>
    apiRequest(
      { method: "POST", path: ["cart"], cartToken, body: { productId: id, quantity } },
      CartSchema,
    ),
  );
}

export function updateItem(token: string, productId: string, quantity: number): Promise<Cart> {
  return mutate(token, productId, (cartToken, id) =>
    apiRequest({ method: "PATCH", path: ["cart", id], cartToken, body: { quantity } }, CartSchema),
  );
}

export function removeItem(token: string, productId: string): Promise<Cart> {
  return mutate(token, productId, (cartToken, id) =>
    apiRequest({ method: "DELETE", path: ["cart", id], cartToken }, CartSchema),
  );
}

/** The API returns 404 for an unknown cart and an unknown item; check which one it was. */
async function mutate(
  token: string,
  productId: string,
  run: (cartToken: string, productId: string) => Promise<Cart>,
): Promise<Cart> {
  const cartToken = CartTokenSchema.safeParse(token);
  if (!cartToken.success) {
    throw new ApiError("cart_expired");
  }
  const id = IdentifierSchema.safeParse(productId);
  if (!id.success) {
    throw new ApiError("invalid_request");
  }
  try {
    return await run(cartToken.data, id.data);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.kind === "not_found" || error.kind === "unauthorized")
    ) {
      if ((await getCart(cartToken.data)) === null) {
        throw new ApiError("cart_expired", error.status, error.code);
      }
    }
    throw error;
  }
}
