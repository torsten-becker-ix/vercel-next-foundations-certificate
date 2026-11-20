# Vercel Swag Store

A small storefront for Vercel-branded merchandise, built with Next.js 16 and **Cache Components**. It has a home page with a hero, promotion and featured products, product pages with live stock, search with category filter, and a session-based shopping cart. All data comes from the Vercel Swag Store API.

## Stack

- [Next.js](https://nextjs.org) 16.4.6 (App Router, `cacheComponents: true`, Turbopack), React 19.3
- TypeScript in strict mode, ESLint with `--max-warnings=0`, Prettier
- Tailwind CSS v4, `geist` font package
- [zod](https://zod.dev) for env and API response validation
- Vitest (unit tests) and Playwright (end-to-end tests)
- pnpm

## Requirements

- Node.js **>= 20.9**
- [pnpm](https://pnpm.io)

## Setup

```bash
pnpm install
cp .env.example .env.local
# edit .env.local and set SWAG_API_BYPASS_TOKEN (see the API docs)
pnpm dev
```

Open <http://localhost:3000>.

Environment variables (all server-side only, see `.env.example`):

| Variable                | Required | Description                                                                                                           |
| ----------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `SWAG_API_BASE_URL`     | yes      | Base URL of the Swag Store API, e.g. `https://vercel-swag-store-api.vercel.app/api`.                                  |
| `SWAG_API_BYPASS_TOKEN` | yes      | Deployment-protection bypass token sent by the server with every API request. Never exposed to the browser.           |
| `SITE_URL`              | no       | Canonical origin for metadata (OG URLs). Falls back to `VERCEL_PROJECT_PRODUCTION_URL`, then `http://localhost:3000`. |

`.env.local` is git-ignored. Never commit it.

## Scripts

| Script              | Command                                                         | Purpose                                      |
| ------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| `pnpm dev`          | `next dev`                                                      | Start the development server.                |
| `pnpm build`        | `next build`                                                    | Production build.                            |
| `pnpm start`        | `next start`                                                    | Serve the production build.                  |
| `pnpm lint`         | `eslint --max-warnings=0 .`                                     | Lint. Any warning fails.                     |
| `pnpm typecheck`    | `next typegen && tsc --noEmit`                                  | Type-check with strict TypeScript.           |
| `pnpm format`       | `prettier --write .`                                            | Format all files.                            |
| `pnpm format:check` | `prettier --check .`                                            | Verify formatting.                           |
| `pnpm test`         | `vitest run`                                                    | Unit tests.                                  |
| `pnpm test:watch`   | `vitest`                                                        | Unit tests in watch mode.                    |
| `pnpm test:e2e`     | `playwright test`                                               | End-to-end tests (needs `pnpm build` first). |
| `pnpm check`        | `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` | All static checks plus unit tests.           |

End-to-end tests run against a production server, so build first. In containers where Playwright's bundled Chromium can't run, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

## Project structure

```
.
├── e2e/smoke.spec.ts          Playwright end-to-end tests
├── src/
│   ├── app/
│   │   ├── layout.tsx         Root layout, metadata, header, footer, skip link
│   │   ├── page.tsx           Home: hero, promotion, featured products
│   │   ├── products/[slug]/   Product detail (live stock, add to cart) and not-found UI
│   │   ├── search/            Search page and error boundary
│   │   ├── cart/page.tsx      Cart view
│   │   └── actions/cart.ts    Server Actions: add, update, remove
│   ├── components/            Header, footer, cart badge, product card, search form, cart line, ...
│   └── lib/
│       ├── api/               Server-only API client, zod schemas, catalog and cart calls
│       ├── cart-session.ts    Cart token cookie helpers
│       ├── env.ts             Validated server env
│       ├── images.ts          Allowed product image host
│       └── quantity.ts, search-input.ts, search-params.ts, format.ts
├── next.config.ts             Cache Components, security headers and CSP, image hosts
├── eslint.config.mjs          Strict lint configuration
└── .env.example               Environment variable template
```

Unit tests sit next to the code they test (`*.test.ts`).

## Deploy to Vercel

1. Import the repository in Vercel (framework preset: Next.js, package manager: pnpm).
2. Add these environment variables for Production (and Preview if wanted):
   - `SWAG_API_BASE_URL`
   - `SWAG_API_BYPASS_TOKEN`
   - `SITE_URL` (your production origin, e.g. `https://your-domain.com`). Optional.
3. Deploy. Don't prefix any of the variables with `NEXT_PUBLIC_`.
