import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CartLine } from "@/components/cart-line";
import { getCart } from "@/lib/api/cart";
import { readCartToken } from "@/lib/cart-session";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the items in your Vercel Swag Store cart.",
  robots: { index: false, follow: false },
};

function EmptyCart() {
  return (
    <div className="border-foreground/15 rounded-2xl border border-dashed py-16 text-center">
      <p className="text-lg font-medium">Your cart is empty</p>
      <p className="text-foreground/70 mt-2 text-sm">Find something you love and add it here.</p>
      <Link
        href="/search"
        className="bg-foreground text-background focus-visible:outline-foreground mt-6 inline-flex h-11 items-center rounded-full px-6 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Continue shopping
      </Link>
    </div>
  );
}

async function CartContents() {
  const token = await readCartToken();
  const cart = token === null ? null : await getCart(token);

  if (cart === null || cart.items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <ul aria-label="Cart items" className="border-foreground/10 border-t">
        {cart.items.map((item) => (
          <CartLine key={item.productId} item={item} currency={cart.currency} />
        ))}
      </ul>
      <aside
        aria-labelledby="summary-heading"
        className="bg-foreground/5 h-fit space-y-4 rounded-2xl p-6"
      >
        <h2 id="summary-heading" className="text-lg font-semibold">
          Order summary
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Items</dt>
            <dd className="tabular-nums" data-testid="cart-total-items">
              {cart.totalItems}
            </dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Subtotal</dt>
            <dd className="tabular-nums" data-testid="cart-subtotal">
              {formatPrice(cart.subtotal, cart.currency)}
            </dd>
          </div>
        </dl>
        <p className="text-foreground/60 text-xs">Shipping and taxes are calculated at checkout.</p>
        <Link
          href="/search"
          className="focus-visible:outline-foreground block rounded-sm text-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="bg-foreground/5 h-28 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>
      <Suspense fallback={<CartSkeleton />}>
        <CartContents />
      </Suspense>
    </div>
  );
}
