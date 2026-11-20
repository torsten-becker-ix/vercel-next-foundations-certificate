import { cacheLife } from "next/cache";

// Cache Components rejects new Date() outside "use cache"; refreshed daily.
// eslint-disable-next-line @typescript-eslint/require-await -- "use cache" needs an async function
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function SiteFooter() {
  return (
    <footer className="border-foreground/10 text-foreground/70 border-t text-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © <CurrentYear /> Vercel Swag Store. All rights reserved.
        </p>
        <p>A demo storefront built with Next.js.</p>
      </div>
    </footer>
  );
}
