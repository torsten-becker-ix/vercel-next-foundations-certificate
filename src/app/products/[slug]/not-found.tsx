import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Product not found",
  robots: { index: false, follow: false },
};

export default function ProductNotFound() {
  return (
    <section className="py-16 text-center">
      <p className="text-foreground/60 text-sm font-medium tracking-widest uppercase">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Product not found</h1>
      <p className="text-foreground/70 mt-3">
        We couldn&apos;t find that product. It may have been removed or the link is incorrect.
      </p>
      <Link
        href="/search"
        className="bg-foreground text-background focus-visible:outline-foreground mt-6 inline-flex h-11 items-center rounded-full px-6 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Browse all products
      </Link>
    </section>
  );
}
