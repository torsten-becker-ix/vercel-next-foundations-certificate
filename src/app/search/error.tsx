"use client";

export default function SearchError({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <div role="alert" className="py-12 text-center">
      <h2 className="text-xl font-semibold">Search is unavailable</h2>
      <p className="text-foreground/70 mt-2 text-sm">
        We couldn&apos;t load products right now. Please try again.
      </p>
      <button
        type="button"
        onClick={() => {
          unstable_retry();
        }}
        className="bg-foreground text-background focus-visible:outline-foreground mt-4 h-10 rounded-md px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
