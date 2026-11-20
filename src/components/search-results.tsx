import { getProducts } from "@/lib/api/catalog";
import { ProductCard } from "@/components/product-card";
import { SEARCH_RESULT_LIMIT } from "@/lib/search-params";

interface SearchResultsProps {
  q: string;
  category: string | null;
}

export async function SearchResults({ q, category }: SearchResultsProps) {
  const { products, pagination } = await getProducts({
    limit: SEARCH_RESULT_LIMIT,
    ...(q === "" ? {} : { search: q }),
    ...(category === null ? {} : { category }),
  });
  // In case the API ignores the limit.
  const shown = products.slice(0, SEARCH_RESULT_LIMIT);

  let summary: string;
  if (shown.length === 0) {
    summary = q === "" ? "No products found" : `No products found for "${q}"`;
  } else {
    const total = Math.max(pagination.total, shown.length);
    const noun = total === 1 ? "product" : "products";
    const showing =
      total > shown.length ? `Showing ${shown.length} of ${total} ${noun}` : `${total} ${noun}`;
    summary = q === "" ? showing : `${showing} for "${q}"`;
  }

  return (
    <div>
      <p aria-live="polite" role="status" className="text-foreground/70 mb-4 text-sm">
        {summary}
      </p>
      {shown.length > 0 ? (
        <ul
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
          data-testid="search-results"
        >
          {shown.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} priority={index < 2} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
