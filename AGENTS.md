<!-- BEGIN:nextjs-agent-rules -->
# Repository Guidelines

This is **NOT** the Next.js you know. The project pins `next@16.2.0` / `eslint-config-next@16.2.0`. APIs, conventions, and file structure may differ from training data. The vendored `node_modules/next/dist/docs/` referenced in earlier guidance is **absent on disk** — verify against the resolved `next@16.2.0` source, the package's bundled README/type defs, or upstream Next 16 docs before relying on any familiar API. Heed deprecation notices on server actions, route handlers, and dynamic params.

---

## Project Overview

**Fresitte** — boutique children's fashion ecommerce (Spanish, "Moda infantil con amor"). Customers browse a small capsule catalog with category, size, and search filters; checkout is hand-rolled as a preformatted **WhatsApp** message (no payment gateway). A private admin area manages **categories** and **products**, with images uploaded to **Cloudflare R2** (S3-compatible). Authentication is single-role (`admin`) via NextAuth Credentials — public visitors do not sign in.

## Architecture & Data Flow

Three top-level App Router surfaces, no global middleware file:

- **Public storefront** (`app/page.tsx`, server component) → queries Drizzle directly → renders `CatalogGrid` (client component holding the entire cart as local `useState`). Filtering/pagination uses URL `searchParams` (`page`, `category`, `size`, `search`). WhatsApp contact link uses `env.WHATSAPP_NUMBER`.
- **`(admin)` route group** (`app/(admin)/admin/**`) → `layout.tsx` calls `await requireAdmin()` from `@/lib/auth` before rendering; the index page redirects to `/admin/products`. CRUD is implemented with **Server Actions** declared `"use server"` in sibling `actions.ts` files — there are no API routes for catalog writes.
- **`/login`** (`app/login/page.tsx`, client) → calls `next-auth/react`'s `signIn("credentials", …)`; on success navigates to `/admin`. NextAuth catch-all lives at `app/api/auth/[...nextauth]/route.ts` (GET + POST).
- **Caching/state**: `app/providers.tsx` mounts a `@tanstack/react-query` `QueryClientProvider` globally. **React Query is installed but unused** — no `useQuery`/`useMutation` exists. **Zustand is installed but unused** — the cart lives as local `useState` inside `components/catalog/catalog-grid.tsx`. Treat both as available infrastructure, not current usage.

Data flow for admin writes: `<form action={serverAction}>` → `requireAdmin()` → `zod` parse → optional `uploadImageToR2()` → Drizzle insert/update/delete → `revalidatePath(...)` → `redirect(...)` with `?status=success|error&message=...` consumed by the parent page for inline feedback banners.

## Key Directories

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router. Subtrees: `(admin)/admin/{products,categories,sizes}/` (CRUD), `login/`, `api/auth/[...nextauth]/`. Server actions live in `actions.ts` siblings of their page. |
| `app/(admin)/admin/_components/` | Route-group-private components (admin shell widgets). Underscore prefix keeps them off the route surface. |
| `components/catalog/` | Client-side storefront: `catalog-grid.tsx` (cart + sheet), `product-card.tsx`, `product-filters.tsx`. |
| `components/admin/` | Admin-only client components (`sign-out-button.tsx`). |
| `components/admin/use-sortable-order.ts` | Shared drag & drop reorder hook used by the categories and sizes lists. |
| `components/landing/` | Homepage hero/value props client components. |
| `components/ui/` | **shadcn primitives only** (`button`, `input`, `select`, `textarea`, `badge`, `card`, `sheet`, `accordion`, `navigation-menu`). Add new primitives via `npx shadcn@latest add <name>`; do not hand-author. |
| `lib/` | Cross-cutting helpers: `db.ts` (singleton Drizzle), `env.ts` (Zod-validated env), `auth.ts` (session helpers + `requireAdmin`), `password.ts` (scrypt), `r2.ts` (R2 upload), `utils.ts` (`cn`), `sizes.ts` (size registry loader + `syncProductSizes`), `size-tokens.ts` (pure size-key helpers). |
| `db/schema.ts` | Drizzle SQLite schema: `users`, `categories`, `products`, `productImages`, `sizes` + relations. Snake-case casing. |
| `migrations/` | Generated Drizzle SQL output (`0001_old_zodiak.sql`, `meta/`). `drizzle/` is journal-only. |
| `scripts/seed-admin.ts` | Standalone `tsx` script that inserts the admin user (idempotent by email). |
| `scripts/seed-sizes.ts` | Registers the sizes used by the products that are missing from the registry (idempotent). |
| `types/next-auth.d.ts` | Module augmentation: `Session.user.id/role`, `User.id/role`, `JWT.role?`. |
| `auth.config.ts` | NextAuth `authOptions` (Credentials provider, JWT session strategy, role callbacks). Imported by the catch-all route handler. |
| `proxy.ts` | Edge-style route guard for `/admin/:path*` and `/login`. **Note**: filename is `proxy.ts`, not Next.js's conventional `middleware.ts`; verify Next 16 picks it up before relying on it. The auth gate inside `app/(admin)/admin/layout.tsx` is the authoritative guard. |
| `public/` | Static SVGs only. Product/category imagery lives on R2. |
| `example.env` | Required env template (see Runtime/Tooling). |

There is **no `hooks/` directory**. "Hooks" in code means React/Next built-ins only.

## Development Commands

```bash
npm run dev          # next dev
npm run start         # next start (after build)
npm run build        # next build
npm run lint         # eslint (flat config; .next, out, build, next-env.d.ts ignored)

npm run db:generate  # drizzle-kit generate (emits SQL into ./migrations)
npm run db:migrate   # drizzle-kit push (applies schema to Turso)
npm run db:studio    # drizzle-kit studio --port 8787
npm run db:seed      # tsx scripts/seed-admin.ts (creates admin from .env)
npm run db:seed-sizes # tsx scripts/seed-sizes.ts (registers the catalog sizes)
```

First-run provisioning: create Turso DB → fill `.env` from `example.env` → `db:generate` + `db:migrate` → `db:seed` → `npm run dev`. Login at `/login` with the seeded admin.

## Code Conventions & Common Patterns

- **TypeScript strict, ES2017 target**, path alias `@/* → ./*` (see `tsconfig.json`). Use the alias for all imports; never use relative `../../../`.
- **Server actions are the only mutation surface.** They live in `actions.ts` siblings of the page that consumes them, start with `"use server"`, validate input with Zod, gate on `requireAdmin()`, and finish with `revalidatePath(...)` + `redirect(...?status=...&message=...)`. **They never `throw` to the UI** — feedback flows through query params.
- **Validation:** Zod everywhere (`auth.config.ts`, env, server actions). `lib/env.ts` throws on invalid env at boot.
- **Slugification:** `app/(admin)/admin/{products,categories}/actions.ts` slugify names client-side before insert/update; DB enforces `slug` UNIQUE.
- **Size registry:** the `sizes` table is the ordered list the admin edits at `/admin/sizes`. `name` is the customer-facing label, `matchKey` is the canonical key every spelling resolves to (`normalizeSizeToken` in `lib/size-tokens.ts`), and `displayOrder` drives the storefront filter. Product sizes stay free text in `products.sizes` (CSV); `syncProductSizes()` (`lib/sizes.ts`) registers unknown sizes at the end of the list and rewrites each token with the registry label. The `sizes` cache tag is expired by every write that touches the registry or a product's sizes.
- **Casing:** schema columns are `snake_case` via Drizzle's `casing: "snake_case"` in `lib/db.ts`. Always reference TypeScript fields in `camelCase` (`passwordHash`, `coverImageUrl`, `priceCents`).
- **Auth flow:** NextAuth v4 credentials provider, JWT sessions. `auth.config.ts` defines `authOptions`; `app/api/auth/[...nextauth]/route.ts` instantiates `NextAuth(authOptions)`. `lib/auth.ts` exposes React-`cache`-memoized `getSession`, `getCurrentUser`, `requireAdmin`. **Always** call `requireAdmin()` at the top of admin server actions, even though the layout also gates — defense in depth.
- **Role augmentation** is declared in `types/next-auth.d.ts`; the `jwt`/`session` callbacks in `auth.config.ts` propagate `role`. Treat `session.user.role` as `"admin" | "customer"`.
- **Client components** must opt in with `"use client"` at the top. Server components are the default — keep page bodies server-side and only mark interactive children as client.
- **Forms:** plain `<form action={serverAction}>` (no `react-hook-form`/`fetch` wiring in the admin pages). `useFormStatus`/`useTransition` style is acceptable for progress indicators; `react-hook-form` is installed but unused.
- **Styling:** Tailwind v4 via PostCSS only; design tokens (`background`, `foreground`, `font-sans/heading/mono`, `primary`, `ring`, `radius`) live in `app/globals.css` under `@theme`. Brand palette: coral/cream/leaf/cocoa. Compose primitives with `cn(...)` from `@/lib/utils` (clsx + tailwind-merge).
- **Error handling:** server actions never `throw` into the UI; UI banners come from `?status=&message=`. `requireAdmin()` throws internally — let it bubble. `lib/env.ts` throws at module load on missing required env. `uploadImageToR2` returns `null` for empty files; server actions treat that as "skip upload".
- **Logging:** Spanish copy for user-facing messages; English for developer logs (e.g. `[drizzle] DATABASE_URL is not defined.`).
- **Async/state:** all data access is async; cache Drizzle via React's `cache()` when crossing server→server helpers. State management today is React local state; if introducing persistence, **prefer Zustand** (already installed) over ad-hoc `localStorage` wrappers, and gate the store behind a hydration check (`isClient` pattern already used in `catalog-grid.tsx`).
- **No barrel files.** Import directly from the module that owns the export.

## Important Files

| File | Why it matters |
|---|---|
| `app/layout.tsx` | Root layout, fonts (Baloo_2 / Nunito / Space_Mono), `<html lang="es">`, `<Providers>`, site metadata. |
| `app/providers.tsx` | Single `QueryClientProvider`; the only consumer-of-React-Query entry point. |
| `app/page.tsx` | Storefront server component — the public surface. |
| `app/(admin)/admin/layout.tsx` | **Authoritative auth gate** (`requireAdmin`) + admin chrome. |
| `app/(admin)/admin/{products,categories,sizes}/page.tsx` + sibling `actions.ts` | CRUD pairs; both are coupled — edit both sides together. |
| `app/login/page.tsx` | Client-side `signIn("credentials", …)`. |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth GET/POST handler. |
| `auth.config.ts` | NextAuth `authOptions` (Credentials + JWT + role callbacks). |
| `lib/db.ts` | Singleton Drizzle client (HMR-memoized on `globalThis`). |
| `lib/env.ts` | Zod env schema; throws on invalid. |
| `lib/auth.ts` | `getSession` / `getCurrentUser` / `requireAdmin`. |
| `lib/password.ts` | scrypt hash + constant-time verify. |
| `lib/r2.ts` | `uploadImageToR2({ keyPrefix: "categories" \| "products", file })`. |
| `lib/sizes.ts` | `loadSizes()` (cached registry) + `syncProductSizes()` (registers unknown sizes, rewrites the product CSV). |
| `lib/size-tokens.ts` | Pure helpers: `normalizeSizeToken`, `deriveSizeKey`, `splitSizeTokens`, `replaceSizeToken`, `collectSizeFilters`, `defaultSizeRank`. |
| `db/schema.ts` | Source of truth for tables/relations. Edit here, then `db:generate` + `db:migrate`. |
| `types/next-auth.d.ts` | Module augmentation for `Session.user.role`, `JWT.role?`. |
| `drizzle.config.ts` | `dialect: "turso"`, schema `./db/schema.ts`, out `./migrations`. |
| `next.config.ts` | `experimental.serverActions.bodySizeLimit: "30mb"`, `images.remotePatterns: [{ https, "*" }]`. |
| `proxy.ts` | Edge guard for `/admin/:path*` and `/login`; belt-and-braces alongside `requireAdmin`. |
| `scripts/seed-admin.ts` | Idempotent admin seeder — uses `AUTH_ADMIN_EMAIL`/`AUTH_ADMIN_PASSWORD` from `.env`. |
| `scripts/seed-sizes.ts` | Idempotent size-registry seeder — registers the sizes the catalog uses. |

## Runtime/Tooling Preferences

- **Runtime**: **Node.js 20+** (declared in `README.md`); `tsx` for the seed script; `next` CLI for everything else. There is no Bun/specific-runtime expectation — stick to npm.
- **Package manager**: npm (lockfile is `package-lock.json`; no `pnpm-lock.yaml`/`yarn.lock`/`bun.lockb`).
- **Required `.env`** (full list — `lib/env.ts` validates at boot):
  - `DATABASE_URL`, `DATABASE_AUTH_TOKEN` — Turso/libSQL.
  - `AUTH_SECRET` — NextAuth JWT signing.
  - `AUTH_ADMIN_EMAIL`, `AUTH_ADMIN_PASSWORD` — consumed **only** by `scripts/seed-admin.ts` (env schema marks them optional; the script throws if absent at run time).
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` — Cloudflare R2 (S3-compatible).
  - `R2_PUBLIC_BASE_URL` *(optional)* — custom media domain; falls back to `https://${R2_BUCKET}.r2.dev`.
  - `WHATSAPP_NUMBER` *(optional)* — used by the storefront for the contact/checkout link.
- **Lint config**: ESLint v9 flat config extending `eslint-config-next/core-web-vitals` + `typescript`. No custom rules — keep imports clean, no `any`, no unused exports.
- **Tailwind v4**: no `tailwind.config.*` file; tokens live in `app/globals.css` `@theme` block. `components.json` (shadcn) sets `"tailwind.config": ""` — preserve this convention.
- **No commit hooks, no Husky, no lint-staged.** Lint runs only via `npm run lint`.
- **shadcn CLI**: `npx shadcn@latest add <name>` for new primitives; never hand-author `components/ui/*`.

## Testing & QA

- **No test framework is configured.** No `vitest`/`jest`/`playwright`/`cypress`/`@testing-library` dependency, no `tests/`/`__tests__/`/`e2e/` directory, no `*.test.*`/`*.spec.*` files, no CI (no `.github/`). Treat verification as **running the actual app**: `npm run dev` → exercise the changed surface in a browser. For admin flows, sign in via `/login` and CRUD a row. For storefront, hit `/` and confirm filters/pagination/WhatsApp link.
- **Coverage expectations**: not enforced — no coverage tooling. Rely on Drizzle's type-safe queries and Zod validation as the main correctness backstops.
- **Smoke test on every change**: `npm run lint` (must pass clean) + manual smoke of the touched route. For DB-touching changes, also `npm run db:generate` and confirm a migration is emitted (or that none is needed).
- **Future test setup guidance** (if introduced later): Vitest is the cheapest fit (ESM, fast, plays well with `tsx`); colocate as `*.test.ts(x)` next to the file under test, with `@/lib/env` mocked to a known-good fixture.