import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchForm } from "@/components/search-form";
import { SearchResults } from "@/components/search-results";
import { SearchResultsSkeleton } from "@/components/search-results-skeleton";
import { getCategories } from "@/lib/api/catalog";
import { parseSearchParams } from "@/lib/search-params";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = parseSearchParams(await searchParams, []);
  if (q === "") {
    return { title: "Search", description: "Search the Vercel Swag Store catalog." };
  }
  return {
    title: `Results for "${q}"`,
    description: `Vercel Swag Store products matching "${q}".`,
    // Don't index arbitrary search URLs.
    robots: { index: false, follow: true },
  };
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
      {/* Only needs cached categories, so it stays outside the dynamic boundary. */}
      <Suspense fallback={<div className="h-[4.5rem]" aria-hidden="true" />}>
        <SearchFormSection />
      </Suspense>
      <section aria-label="Search results">
        <Suspense fallback={<SearchResultsSkeleton />}>
          <KeyedResults searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}

async function SearchFormSection() {
  const categories = await getCategories();
  return <SearchForm categories={categories.map(({ slug, name }) => ({ slug, name }))} />;
}

async function KeyedResults({
  searchParams,
}: {
  searchParams: PageProps<"/search">["searchParams"];
}) {
  const categories = await getCategories();
  const { q, category } = parseSearchParams(
    await searchParams,
    categories.map((item) => item.slug),
  );

  return (
    // New key per search, so the skeleton shows again.
    <Suspense key={JSON.stringify([q, category])} fallback={<SearchResultsSkeleton />}>
      <SearchResults q={q} category={category} />
    </Suspense>
  );
}
