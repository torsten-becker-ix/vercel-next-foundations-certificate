import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/add-to-cart";
import { getProduct, getProducts, getStock } from "@/lib/api/catalog";
import type { Product } from "@/lib/api/schemas";
import { formatPrice } from "@/lib/format";

const META_DESCRIPTION_MAX = 160;

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 3).trimEnd()}...`;
}

/** Prerender known products; others render on demand. */
export async function generateStaticParams() {
  const { products } = await getProducts({ limit: 100 });
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (product === null) {
    return { title: "Product not found", robots: { index: false } };
  }
  const description = truncate(product.description, META_DESCRIPTION_MAX);
  const url = `/products/${product.slug}`;
  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: product.name,
      description,
      images: product.images.map((image) => ({ url: image, alt: product.name })),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.images,
    },
  };
}

/** Live stock, not cached. Also caps the quantity selector. */
async function LiveStock({ productId, productName }: { productId: string; productName: string }) {
  let stock;
  try {
    stock = await getStock(productId);
  } catch {
    return (
      <p role="status" className="text-sm text-red-600 dark:text-red-400">
        Stock information is temporarily unavailable. Please refresh to try again.
      </p>
    );
  }
  if (stock === null) {
    return <p className="text-sm">Stock information is unavailable for this product.</p>;
  }
  return (
    <div className="space-y-6">
      <p data-testid="stock-status" className="flex items-center gap-2 text-sm font-medium">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${stock.inStock ? (stock.lowStock ? "bg-amber-500" : "bg-green-500") : "bg-red-500"}`}
        />
        {stock.inStock ? `In stock: ${stock.stock}` : "Out of stock"}
        {stock.inStock && stock.lowStock && (
          <span className="text-amber-700 dark:text-amber-400">(low stock)</span>
        )}
      </p>
      <AddToCart productId={productId} productName={productName} stock={stock.stock} />
    </div>
  );
}

function LiveStockSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="bg-foreground/10 h-5 w-32 animate-pulse rounded" />
      <div className="bg-foreground/10 h-12 w-full animate-pulse rounded-full sm:w-64" />
    </div>
  );
}

function ProductDetails({ product }: { product: Product }) {
  const [image] = product.images;

  return (
    <article className="grid gap-8 md:grid-cols-2 md:gap-12">
      <div className="bg-foreground/5 relative aspect-square overflow-hidden rounded-2xl">
        {image !== undefined && (
          <Image
            src={image}
            alt={product.name}
            fill
            preload
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-foreground/60 text-sm">
          <Link href="/search" className="underline-offset-4 hover:underline">
            All products
          </Link>
          <span aria-hidden="true"> / </span>
          <Link
            href={`/search?category=${encodeURIComponent(product.category)}`}
            className="capitalize underline-offset-4 hover:underline"
          >
            {product.category}
          </Link>
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
        <p className="text-2xl tabular-nums">{formatPrice(product.price, product.currency)}</p>
        <p className="text-foreground/80 leading-relaxed">{product.description}</p>
        <Suspense fallback={<LiveStockSkeleton />}>
          <LiveStock productId={product.id} productName={product.name} />
        </Suspense>
      </div>
    </article>
  );
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  // Outside Suspense, so notFound() runs before streaming starts and sets a 404 status.
  const product = await getProduct(slug);
  if (product === null) {
    notFound();
  }
  return <ProductDetails product={product} />;
}
