import { Suspense } from "react";
import { connection } from "next/server";

import { loadCategories } from "@/lib/categories";
import { loadVisibleProducts, type StorefrontProductRecord } from "@/lib/products";
import { loadSizes } from "@/lib/sizes";
import {
  collectSizeFilters,
  normalizeSizeToken,
  sizeKeysFromCsv,
  type SizeRegistryEntry,
} from "@/lib/size-tokens";
import type { CatalogProduct } from "@/components/catalog/product-card";
import type { FilterOption } from "@/components/catalog/product-filters";
import { env } from "@/lib/env";
import { CatalogSection } from "@/components/landing/catalog-section";

const PAGE_SIZE = 9;

type StorefrontSearchParams = {
  page?: string;
  category?: string;
  search?: string;
  /** Repeated params (`?size=2A&size=3A`) or a comma separated list. */
  size?: string | string[];
};

/** Fallback size for products without a `sizes` value (matches the product card). */
const SIZE_FALLBACK_LABEL = "Única";

/** Canonical key of the fallback size. */
const SIZE_FALLBACK_KEY = "ÚNICA";

// ----------------------------------------------------------------------------
// Storefront data fetchers.
//
// `loadCategories()` / `loadVisibleProducts()` live in `@/lib/*` and are
// wrapped in Next 16's `"use cache"`, so repeated home-page hits reuse the
// same cached snapshot instead of hammering Turso. Server actions on the admin
// side call `updateTag("categories")` / `updateTag("catalog")` to drop the
// corresponding cache entries whenever a row changes.
//
// We cache the *raw* visible dataset (categories + products w/ their joined
// categories) and do filtering / pagination in memory: the catalog is a small
// boutique, so the cost is negligible and the cache key stays trivial.
// ----------------------------------------------------------------------------

export default function Home({
  searchParams,
}: {
  searchParams?: Promise<StorefrontSearchParams>;
}) {
  // With `cacheComponents` enabled, this page streams its dynamic parts
  // instead of blocking the whole tree on the catalog query. The page
  // itself stays a synchronous server component shell; the async work
  // (searchParams + filtered products) lives inside <CatalogView>, wrapped
  // in <Suspense> with a skeleton fallback so the user sees the layout
  // immediately and the catalog streams in once resolved.
  return (
    <main className="flex w-full flex-1 flex-col">
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogView searchParams={searchParams ?? Promise.resolve({})} />
      </Suspense>
    </main>
  );
}

async function CatalogView({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<StorefrontSearchParams>;
}) {
  // Dynamic boundary: resolves searchParams + cached loaders. Marks the
  // subtree as dynamic so Next 16 streams it without warning.
  await connection();
  const resolvedParams = (await searchParamsPromise) ?? {};
  const requestedPage = Math.max(1, Number(resolvedParams.page ?? "1") || 1);
  const requestedCategory = resolvedParams.category?.trim() ?? "";
  const searchQuery = resolvedParams.search?.trim() ?? "";
  const requestedSizes = parseSizeParams(resolvedParams.size);

  const [categoryRows, visibleProducts, sizeRegistry] = await Promise.all([
    loadCategories(),
    loadVisibleProducts(),
    loadSizes(),
  ]);

  const matchedCategory = requestedCategory
    ? categoryRows.find((category) => category.slug === requestedCategory)
    : null;

  const invalidCategoryFilter = Boolean(requestedCategory) && !matchedCategory;

  // Apply all storefront filters in memory over the cached visible-products
  // snapshot. The dataset is small (boutique catalog) so this stays cheap.
  const categoryAndSearchFiltered = invalidCategoryFilter
    ? []
    : visibleProducts.filter((product) => {
        if (matchedCategory) {
          const inCategory = (product.productCategories ?? []).some(
            (link) => link.categoryId === matchedCategory.id,
          );
          if (!inCategory) return false;
        }
        if (searchQuery) {
          const needle = searchQuery.toLowerCase();
          const haystack = [
            product.name,
            product.summary ?? "",
            product.description ?? "",
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        return true;
      });

  // Sizes are scoped to the current category/search result set: a shoe size
  // is useless for the flannel tops that live in another category, so the
  // option only shows up when at least one product in scope carries it.
  // The order comes from the registry the admin maintains in
  // `/admin/sizes`; sizes that are not registered keep a natural order at
  // the end.
  const sizeFilters: FilterOption[] = collectSizeFilters(
    categoryAndSearchFiltered,
    sizeRegistry,
    SIZE_FALLBACK_KEY,
  ).map((size) => ({ value: size.key, label: size.label }));

  const availableSizes = new Set(sizeFilters.map((option) => option.value));
  // A size that does not exist in the current scope cannot narrow anything
  // down, so it is dropped instead of emptying the catalog.
  const selectedSizes = requestedSizes.filter((size) =>
    availableSizes.has(size),
  );

  const filtered = selectedSizes.length
    ? categoryAndSearchFiltered.filter((product) =>
        productSizeKeys(product).some((key) => selectedSizes.includes(key)),
      )
    : categoryAndSearchFiltered;

  const totalProducts = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(offset, offset + PAGE_SIZE);

  const catalogProducts: CatalogProduct[] = pageRows.map((product) =>
    toCatalogProduct(product, sizeRegistry),
  );

  const categoryFilters: FilterOption[] = categoryRows.map((category) => ({
    value: category.slug,
    label: category.name,
    color: category.highlightColor ?? undefined,
  }));

  return (
    <CatalogSection
      products={catalogProducts}
      categories={categoryFilters}
      sizes={sizeFilters}
      selectedSizes={selectedSizes}
      totalItems={totalProducts}
      pageSize={PAGE_SIZE}
      currentPage={currentPage}
      totalPages={totalPages}
      selectedCategory={requestedCategory}
      searchTerm={searchQuery}
      whatsappNumber={env.WHATSAPP_NUMBER ?? null}
    />
  );
}

function CatalogSkeleton() {
  return (
    <section
      aria-label="Catálogo"
      className="py-6 md:py-8"
      aria-busy="true"
    >
      <div className="mx-auto w-full max-w-[1600px] px-3 md:px-4">
        <div
          className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3"
          role="status"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-3xl bg-muted/40"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function toCatalogProduct(
  product: StorefrontProductRecord,
  registry: SizeRegistryEntry[],
): CatalogProduct {
  const metadata = product.metadata ? safeJson(product.metadata) : null;
  const imageUrl =
    typeof metadata?.imageUrl === "string" ? metadata.imageUrl : undefined;
  const sizes = sortSizes(splitCommaValues(product.sizes), registry);
  const linkedCategories = (product.productCategories ?? []).flatMap((link) =>
    link.category
      ? [{ name: link.category.name, slug: link.category.slug }]
      : [],
  );
  const primary = linkedCategories[0];

  return {
    id: String(product.id),
    name: product.name,
    category: primary?.name ?? "Colección Fresitte",
    categoryValue: primary?.slug ?? "",
    categories: linkedCategories,
    description: product.summary ?? product.description ?? "",
    price: product.priceCents / 100,
    currency: product.currency ?? "EUR",
    stock: product.stock,
    sizes: sizes.length ? sizes : [SIZE_FALLBACK_LABEL],
    imageUrl,
    label: product.isFeatured ? "Destacado" : undefined,
  };
}

/**
 * Orders the sizes of a product card like the registry does, so the badges
 * of a product follow the same order as the filter chips.
 */
function sortSizes(
  tokens: string[],
  registry: SizeRegistryEntry[],
): string[] {
  const rank = new Map(
    registry.map((size, index) => [size.matchKey, index] as const),
  );

  return tokens
    .map((token, index) => ({
      token,
      index,
      rank: rank.get(normalizeSizeToken(token)),
    }))
    .sort((a, b) => {
      if (a.rank !== undefined && b.rank !== undefined) return a.rank - b.rank;
      if (a.rank !== undefined) return -1;
      if (b.rank !== undefined) return 1;
      return a.index - b.index;
    })
    .map((entry) => entry.token);
}

function splitCommaValues(value?: string | null) {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

/**
 * Canonical keys of the sizes of a product. Used to match a product against
 * the size selected in the filter.
 */
function productSizeKeys(product: StorefrontProductRecord): string[] {
  const keys = sizeKeysFromCsv(product.sizes);
  return keys.length ? keys : [SIZE_FALLBACK_KEY];
}

/**
 * Reads `?size=3-6&size=6-9` (repeated) or `?size=3-6,6-9` into canonical
 * size keys. The keys are normalized the same way the products are, so a
 * hand-written `?size=3-6m` still matches the size "3-6".
 */
function parseSizeParams(value?: string | string[]): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const keys = raw
    .flatMap((entry) => entry.split(","))
    .map((entry) => normalizeSizeToken(entry))
    .filter(Boolean);
  return [...new Set(keys)];
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch (error) {
    console.warn("No se pudo parsear metadata", error);
    return null;
  }
}

