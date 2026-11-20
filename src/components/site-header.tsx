import Link from "next/link";
import { Suspense } from "react";
import { CartBadge } from "@/components/cart-badge";

const linkClass =
  "rounded-md px-2 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function SiteHeader() {
  return (
    <header className="border-foreground/10 bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="focus-visible:outline-foreground flex items-center gap-2 rounded-md text-base font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <svg aria-hidden="true" viewBox="0 0 76 65" className="h-4 w-4 fill-current">
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
          </svg>
          <span>Vercel Swag Store</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          <Link href="/" className={linkClass}>
            Home
          </Link>
          <Link href="/search" className={linkClass}>
            Search
          </Link>
          <Link href="/cart" className={`${linkClass} relative ml-1`}>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="inline h-5 w-5 fill-none stroke-current"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6.2" />
              <circle cx="9.5" cy="20" r="1" />
              <circle cx="17.5" cy="20" r="1" />
            </svg>
            <span className="sr-only">Cart</span>
            <Suspense fallback={null}>
              <CartBadge />
            </Suspense>
          </Link>
        </nav>
      </div>
    </header>
  );
}
