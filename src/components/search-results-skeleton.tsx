import { SEARCH_RESULT_LIMIT } from "@/lib/search-params";

export function SearchResultsSkeleton() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Loading results...
      </p>
      <div className="bg-foreground/10 mb-4 h-5 w-40 animate-pulse rounded" aria-hidden="true" />
      <ul
        aria-hidden="true"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        data-testid="search-skeleton"
      >
        {Array.from({ length: SEARCH_RESULT_LIMIT }, (_, index) => (
          <li key={index} className="border-foreground/10 overflow-hidden rounded-lg border">
            <div className="bg-foreground/10 aspect-square animate-pulse" />
            <div className="space-y-2 p-3">
              <div className="bg-foreground/10 h-4 w-3/4 animate-pulse rounded" />
              <div className="bg-foreground/10 h-3 w-1/3 animate-pulse rounded" />
              <div className="bg-foreground/10 h-4 w-1/4 animate-pulse rounded" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
