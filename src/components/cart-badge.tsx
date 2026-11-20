import { getCart } from "@/lib/api/cart";
import { readCartToken } from "@/lib/cart-session";

/** Cart item count. Reads cookies, so render inside <Suspense>. Hidden on errors. */
export async function CartBadge() {
  let count = 0;
  try {
    const token = await readCartToken();
    count = token === null ? 0 : ((await getCart(token))?.totalItems ?? 0);
  } catch {
    return null;
  }
  if (count < 1) {
    return null;
  }
  return (
    <span
      data-testid="cart-count"
      className="bg-foreground text-background absolute -top-1.5 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold"
    >
      <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
      <span className="sr-only">{`${count} ${count === 1 ? "item" : "items"} in cart`}</span>
    </span>
  );
}
