"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addItem, createCart, getCart, removeItem, updateItem } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import { getStock } from "@/lib/api/catalog";
import { IdentifierSchema, type Cart } from "@/lib/api/schemas";
import { clearCartToken, readCartToken, writeCartToken } from "@/lib/cart-session";
import { MAX_QUANTITY } from "@/lib/quantity";

export type CartActionResult = { ok: true; totalItems: number } | { ok: false; message: string };

const QuantitySchema = z.number().int().min(1).max(MAX_QUANTITY);
const AddInput = z.object({ productId: IdentifierSchema, quantity: QuantitySchema });
const UpdateInput = z.object({ itemId: IdentifierSchema, quantity: QuantitySchema });
const RemoveInput = z.object({ itemId: IdentifierSchema });

const INVALID_INPUT: CartActionResult = { ok: false, message: "That request was not valid." };

/** Re-renders the layout so the header badge and cart page show the change. */
function refreshCartViews(): void {
  revalidatePath("/", "layout");
}

function failure(error: unknown): CartActionResult {
  if (error instanceof ApiError) {
    return { ok: false, message: error.message };
  }
  // Log on the server only; the client gets a generic message.
  console.error("Unexpected cart action error", error instanceof Error ? error.name : "unknown");
  return { ok: false, message: "Something went wrong. Please try again." };
}

/** Existing token if the API still knows it, otherwise a freshly created cart. */
async function ensureCartToken(): Promise<string> {
  const existing = await readCartToken();
  if (existing !== null && (await getCart(existing)) !== null) {
    return existing;
  }
  const cart = await createCart();
  await writeCartToken(cart.token);
  return cart.token;
}

/** Runs a mutation; retries once on a new cart if the old one expired. */
async function withCart(
  run: (token: string) => Promise<Cart>,
  allowRecreate: boolean,
): Promise<Cart> {
  const token = await ensureCartToken();
  try {
    return await run(token);
  } catch (error) {
    if (error instanceof ApiError && error.kind === "cart_expired") {
      await clearCartToken();
      if (allowRecreate) {
        const cart = await createCart();
        await writeCartToken(cart.token);
        return run(cart.token);
      }
    }
    throw error;
  }
}

/** Largest line quantity the shopper may hold for a product, per live stock. */
async function allowedQuantity(productId: string): Promise<number | null> {
  const stock = await getStock(productId);
  return stock === null ? null : Math.min(stock.stock, MAX_QUANTITY);
}

export async function addToCart(productId: string, quantity: number): Promise<CartActionResult> {
  const input = AddInput.safeParse({ productId, quantity });
  if (!input.success) return INVALID_INPUT;

  try {
    const limit = await allowedQuantity(input.data.productId);
    if (limit === null) return { ok: false, message: "That product could not be found." };
    if (limit < 1) return { ok: false, message: "Sorry, this item is out of stock." };

    let cart = await withCart(
      (token) => addItem(token, input.data.productId, input.data.quantity),
      true,
    );
    // The API sums quantities and ignores stock, so clamp afterwards.
    const line = cart.items.find((item) => item.productId === input.data.productId);
    if (line !== undefined && line.quantity > limit) {
      cart = await updateItem(cart.token, input.data.productId, limit);
      refreshCartViews();
      return { ok: false, message: `Only ${limit} available. Your cart was adjusted.` };
    }
    refreshCartViews();
    return { ok: true, totalItems: cart.totalItems };
  } catch (error) {
    return failure(error);
  }
}

export async function updateCartItem(itemId: string, quantity: number): Promise<CartActionResult> {
  const input = UpdateInput.safeParse({ itemId, quantity });
  if (!input.success) return INVALID_INPUT;

  try {
    const limit = await allowedQuantity(input.data.itemId);
    if (limit !== null && input.data.quantity > limit) {
      return { ok: false, message: `Only ${limit} available.` };
    }
    const cart = await withCart(
      (token) => updateItem(token, input.data.itemId, input.data.quantity),
      false,
    );
    refreshCartViews();
    return { ok: true, totalItems: cart.totalItems };
  } catch (error) {
    return failure(error);
  }
}

export async function removeCartItem(itemId: string): Promise<CartActionResult> {
  const input = RemoveInput.safeParse({ itemId });
  if (!input.success) return INVALID_INPUT;

  try {
    const cart = await withCart((token) => removeItem(token, input.data.itemId), false);
    refreshCartViews();
    return { ok: true, totalItems: cart.totalItems };
  } catch (error) {
    return failure(error);
  }
}
