import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/api/schemas";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  /** Preload the image for above-the-fold cards. */
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const [image] = product.images;
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="bg-foreground/5 relative aspect-square overflow-hidden rounded-xl">
        {image !== undefined && (
          <Image
            src={image}
            alt={product.name}
            fill
            preload={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium">
          {/* Stretched link: the whole card is clickable. */}
          <Link
            href={`/products/${product.slug}`}
            className="focus-visible:outline-foreground rounded-sm after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-foreground/80 shrink-0 text-sm tabular-nums">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </article>
  );
}
