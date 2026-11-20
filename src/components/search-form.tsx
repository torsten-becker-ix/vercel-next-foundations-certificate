"use client";

import { useEffect, useRef, useState, type ChangeEvent, type SubmitEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { decideInputAction, SEARCH_DEBOUNCE_MS } from "@/lib/search-input";
import { buildSearchHref, MAX_QUERY_LENGTH, normalizeQuery } from "@/lib/search-params";

interface CategoryOption {
  slug: string;
  name: string;
}

const controlClass =
  "border-foreground/20 bg-background h-11 rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function SearchForm({ categories }: { categories: readonly CategoryOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQuery = normalizeQuery(searchParams.get("q") ?? "");
  const rawCategory = searchParams.get("category") ?? "";
  // Ignore unknown categories from the URL.
  const category = categories.some((option) => option.slug === rawCategory) ? rawCategory : "";

  const [value, setValue] = useState(urlQuery);
  // Last query we navigated to, to tell our own URL updates apart from back/forward.
  const [committedQuery, setCommittedQuery] = useState(urlQuery);
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    if (urlQuery !== committedQuery) {
      // Back/forward or header link: sync the input.
      setCommittedQuery(urlQuery);
      setValue(urlQuery);
    }
  }

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelPending() {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  useEffect(() => cancelPending, []);

  function navigate(query: string, nextCategory: string) {
    cancelPending();
    setCommittedQuery(query);
    router.replace(
      buildSearchHref({ q: query, category: nextCategory === "" ? null : nextCategory }),
      { scroll: false },
    );
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setValue(next);
    cancelPending();
    const action = decideInputAction(next, committedQuery);
    if (action === "clear") {
      navigate("", category);
    } else if (action === "debounce") {
      timer.current = setTimeout(() => {
        timer.current = null;
        navigate(normalizeQuery(next), category);
      }, SEARCH_DEBOUNCE_MS);
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(normalizeQuery(value), category);
  }

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    navigate(normalizeQuery(value), event.target.value);
  }

  return (
    // Plain GET form still works without JS.
    <form
      action="/search"
      method="get"
      role="search"
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="search-q" className="text-sm font-medium">
          Search products
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          value={value}
          onChange={handleChange}
          maxLength={MAX_QUERY_LENGTH}
          autoComplete="off"
          placeholder="Search for shirts, mugs, stickers"
          className={controlClass}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:w-56">
        <label htmlFor="search-category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="search-category"
          name="category"
          value={category}
          onChange={handleCategoryChange}
          className={controlClass}
        >
          <option value="">All categories</option>
          {categories.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="bg-foreground text-background focus-visible:outline-foreground h-11 rounded-md px-5 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Search
      </button>
    </form>
  );
}
