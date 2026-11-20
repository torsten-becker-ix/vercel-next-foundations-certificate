import "server-only";
import { cookies } from "next/headers";
import { CartTokenSchema } from "@/lib/api/schemas";

/** Name of the cookie holding the opaque cart token issued by the Swag API. */
export const CART_COOKIE_NAME = "swag_cart";

/** Cart token from the cookie, or null. Reads cookies, so use inside <Suspense>. */
export async function readCartToken(): Promise<string | null> {
  const value = (await cookies()).get(CART_COOKIE_NAME)?.value;
  const parsed = CartTokenSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** HttpOnly session cookie (no maxAge). Only works in Server Actions and Route Handlers. */
export async function writeCartToken(token: string): Promise<void> {
  (await cookies()).set(CART_COOKIE_NAME, CartTokenSchema.parse(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/** Drops the cookie (e.g. once the API reports the cart as expired). */
export async function clearCartToken(): Promise<void> {
  (await cookies()).delete(CART_COOKIE_NAME);
}
