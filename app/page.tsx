import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { and, asc, desc, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db";
import { categories, products } from "@/db/schema";
import type { CatalogProduct } from "@/components/catalog/product-card";
import type { FilterOption } from "@/components/catalog/product-filters";
import { env } from "@/lib/env";
import { CatalogSection } from "@/components/landing/catalog-section";

const FALLBACK_SIZES = [
  "RN",
  "0-3m",
  "3-6m",
  "9-12m",
  "12-18m",
  "18-24m",
  "2A",
  "3A",
  "4A",
  "5A",
];

const PAGE_SIZE = 9;

type StorefrontSearchParams = {
  page?: string;
  category?: string;
  size?: string;
  search?: string;
};

// ----------------------------------------------------------------------------
// Storefront data fetchers.
//
// Wrapped in Next 16's `"use cache"` so repeated home-page hits reuse the same
// cached snapshot instead of hammering Turso. Server actions on the admin side
// call `revalidateTag("catalog", "max")` / `revalidateTag("categories", "max")`
// to drop the corresponding cache entries whenever a row changes.
//
// We cache the *raw* visible dataset (categories + products w/ their joined
// categories) and do filtering / pagination in memory: the catalog is a small
// boutique, so the cost is negligible and the cache key stays trivial.
// ----------------------------------------------------------------------------

interface StorefrontCategoryRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  highlightColor: string | null;
  displayOrder: number | null;
}

interface StorefrontProductRow {
  id: number;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  priceCents: number;
  currency: string;
  stock: number;
  sku: string;
  sizes: string | null;
  isFeatured: boolean;
  metadata: string | null;
  createdAt: Date;
  productCategories: {
    productId: number;
    categoryId: number;
    category: { name: string; slug: string } | null;
  }[];
}

async function loadStorefrontCategories(): Promise<StorefrontCategoryRow[]> {
  "use cache";
  cacheTag("categories");
  cacheLife("hours");

  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      coverImageUrl: categories.coverImageUrl,
      highlightColor: categories.highlightColor,
      displayOrder: categories.displayOrder,
    })
    .from(categories)
    .orderBy(asc(categories.displayOrder), asc(categories.name));
}

async function loadVisibleProducts(): Promise<StorefrontProductRow[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");

  return db.query.products.findMany({
    where: and(eq(products.isVisible, true), gt(products.stock, 0)),
    orderBy: desc(products.createdAt),
    with: {
      productCategories: {
        with: { category: true },
      },
    },
  }) as unknown as StorefrontProductRow[];
}

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
  const requestedSize = resolvedParams.size?.trim() ?? "";
  const searchQuery = resolvedParams.search?.trim() ?? "";

  const [categoryRows, visibleProducts] = await Promise.all([
    loadStorefrontCategories(),
    loadVisibleProducts(),
  ]);

  const matchedCategory = requestedCategory
    ? categoryRows.find((category) => category.slug === requestedCategory)
    : null;

  const invalidCategoryFilter = Boolean(requestedCategory) && !matchedCategory;

  // Apply all storefront filters in memory over the cached visible-products
  // snapshot. The dataset is small (boutique catalog) so this stays cheap.
  const filtered = invalidCategoryFilter
    ? []
    : visibleProducts.filter((product) => {
        if (matchedCategory) {
          const inCategory = (product.productCategories ?? []).some(
            (link) => link.categoryId === matchedCategory.id,
          );
          if (!inCategory) return false;
        }
        if (requestedSize) {
          const sizes = (product.sizes ?? "")
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);
          if (!sizes.includes(requestedSize)) return false;
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

  const totalProducts = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(offset, offset + PAGE_SIZE);

  const catalogProducts: CatalogProduct[] = pageRows.map((product) =>
    toCatalogProduct(product),
  );

  const categoryFilters: FilterOption[] = categoryRows.map((category) => ({
    value: category.slug,
    label: category.name,
    color: category.highlightColor ?? undefined,
  }));

  const sizeOptions = buildSizeFilters();

  return (
    <CatalogSection
      products={catalogProducts}
      categories={categoryFilters}
      sizeOptions={sizeOptions}
      totalItems={totalProducts}
      pageSize={PAGE_SIZE}
      currentPage={currentPage}
      totalPages={totalPages}
      selectedCategory={requestedCategory}
      selectedSize={requestedSize}
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

function toCatalogProduct(product: StorefrontProductRow): CatalogProduct {
  const metadata = product.metadata ? safeJson(product.metadata) : null;
  const imageUrl =
    typeof metadata?.imageUrl === "string" ? metadata.imageUrl : undefined;
  const sizes = splitCommaValues(product.sizes);
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
    sizes: sizes.length ? sizes : ["Única"],
    imageUrl,
    label: product.isFeatured ? "Destacado" : undefined,
  };
}

function splitCommaValues(value?: string | null) {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch (error) {
    console.warn("No se pudo parsear metadata", error);
    return null;
  }
}

function buildSizeFilters(): FilterOption[] {
  return FALLBACK_SIZES.map((size) => ({ value: size, label: size }));
}

