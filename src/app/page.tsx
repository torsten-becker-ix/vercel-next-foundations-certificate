import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { getActivePromotion, getFeaturedProducts } from "@/lib/api/catalog";

export const metadata: Metadata = {
  title: { absolute: "Vercel Swag Store | Apparel, bottles & desk gear" },
  description:
    "Shop the Vercel Swag Store: minimal black apparel, bottles, bags and desk gear shipped from the edge.",
  alternates: { canonical: "/" },
};

const FEATURED_LIMIT = 12;

async function PromoBanner() {
  const promotion = await getActivePromotion().catch(() => null);
  if (promotion === null) {
    return null;
  }
  return (
    <aside
      aria-label="Current promotion"
      className="bg-foreground text-background rounded-xl px-5 py-3 text-sm sm:flex sm:items-center sm:justify-between sm:gap-4"
    >
      <p>
        <strong className="font-semibold">{promotion.title}</strong>
        <span className="mx-2" aria-hidden="true">
          &middot;
        </span>
        {promotion.description}
      </p>
      {promotion.code !== "" && (
        <p className="mt-2 sm:mt-0">
          Use code{" "}
          <code className="bg-background/15 rounded px-2 py-0.5 font-mono font-semibold">
            {promotion.code}
          </code>
        </p>
      )}
    </aside>
  );
}

function PromoBannerSkeleton() {
  return <div aria-hidden="true" className="bg-foreground/10 h-12 animate-pulse rounded-xl" />;
}

async function HeroImage() {
  const [featured] = await getFeaturedProducts(FEATURED_LIMIT).catch(() => []);
  const heroImage = featured?.images[0];
  if (featured === undefined || heroImage === undefined) {
    return null;
  }
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl">
      <Image
        src={heroImage}
        alt={`${featured.name}, featured product`}
        fill
        preload
        sizes="(min-width: 768px) 40vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="bg-foreground/5 grid items-center gap-8 overflow-hidden rounded-2xl p-6 sm:p-10 md:grid-cols-2"
    >
      <div className="space-y-5">
        <p className="text-foreground/60 text-sm font-medium tracking-widest uppercase">
          Vercel Swag Store
        </p>
        <h1 id="hero-heading" className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Gear for people who ship.
        </h1>
        <p className="text-foreground/70 max-w-md text-lg">
          Minimal, durable, unmistakably black. Apparel, bottles, bags and desk gear for your next
          deploy.
        </p>
        <Link
          href="/search"
          className="bg-foreground text-background focus-visible:outline-foreground inline-flex h-11 items-center rounded-full px-6 text-sm font-medium transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Shop all products
        </Link>
      </div>
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="bg-foreground/10 aspect-square animate-pulse rounded-xl"
          />
        }
      >
        <HeroImage />
      </Suspense>
    </section>
  );
}

async function FeaturedGrid() {
  const products = await getFeaturedProducts(FEATURED_LIMIT);
  if (products.length === 0) {
    return <p className="text-foreground/70">No featured products right now. Check back soon.</p>;
  }
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < 3} />
        </li>
      ))}
    </ul>
  );
}

function FeaturedGridSkeleton() {
  return (
    <ul aria-hidden="true" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index} className="space-y-3">
          <div className="bg-foreground/5 aspect-square animate-pulse rounded-xl" />
          <div className="bg-foreground/5 h-4 w-2/3 animate-pulse rounded" />
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-10">
      <Suspense fallback={<PromoBannerSkeleton />}>
        <PromoBanner />
      </Suspense>
      <Hero />
      <section aria-labelledby="featured-heading" className="space-y-6">
        <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight">
          Featured products
        </h2>
        <Suspense fallback={<FeaturedGridSkeleton />}>
          <FeaturedGrid />
        </Suspense>
      </section>
    </div>
  );
}
