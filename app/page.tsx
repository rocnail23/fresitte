import { and, count, desc, eq, gt, like, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { categories, products } from "@/db/schema";
import type { CatalogProduct } from "@/components/catalog/product-card";
import type { FilterOption } from "@/components/catalog/product-filters";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { env } from "@/lib/env";

const FALLBACK_SIZES = [
  "RN",
  "0-3m",
  "3-6m",
  "6-9m",
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

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<StorefrontSearchParams>;
}) {
  const resolvedParams = (await searchParams) ?? {};
  const requestedPage = Math.max(1, Number(resolvedParams.page ?? "1") || 1);
  const requestedCategory = resolvedParams.category?.trim() ?? "";
  const requestedSize = resolvedParams.size?.trim() ?? "";
  const searchQuery = resolvedParams.search?.trim() ?? "";

  const baseWhere = and(eq(products.isVisible, true), gt(products.stock, 0));

  const categoryRows = await db.select().from(categories).orderBy(categories.displayOrder, categories.name);
  const matchedCategory = requestedCategory
    ? categoryRows.find((category) => category.slug === requestedCategory)
    : null;

  const invalidCategoryFilter = Boolean(requestedCategory) && !matchedCategory;

  let totalProducts = 0;
  let productRows: (typeof products.$inferSelect & { category: { name: string; slug: string } | null })[] = [];
  let totalPages = 1;
  let currentPage = 1;

  if (!invalidCategoryFilter) {
    const whereClauses = [baseWhere];

    if (matchedCategory) {
      whereClauses.push(eq(products.categoryId, matchedCategory.id));
    }

    if (requestedSize) {
      whereClauses.push(like(products.sizes, `%${requestedSize}%`));
    }

    if (searchQuery) {
      const pattern = `%${searchQuery}%`;
      whereClauses.push(
        or(
          like(products.name, pattern),
          like(products.summary, pattern),
          like(products.description, pattern),
        ),
      );
    }

    const whereExpression = whereClauses.slice(1).reduce((acc, clause) => and(acc, clause), whereClauses[0]);

    const totalResult = await db.select({ value: count() }).from(products).where(whereExpression);
    totalProducts = totalResult?.[0]?.value ?? 0;
    totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
    currentPage = Math.min(requestedPage, totalPages);
    const offset = (currentPage - 1) * PAGE_SIZE;

    productRows = await db.query.products.findMany({
      with: { category: true },
      where: whereExpression,
      orderBy: desc(products.createdAt),
      limit: PAGE_SIZE,
      offset,
    });
  }

  const catalogProducts: CatalogProduct[] = productRows.map((product) => {
    const metadata = product.metadata ? safeJson(product.metadata) : null;
    const imageUrl = typeof metadata?.imageUrl === "string" ? metadata.imageUrl : undefined;
    const sizes = splitCommaValues(product.sizes);

    return {
      id: String(product.id),
      name: product.name,
      category: product.category?.name ?? "Colección Fresitte",
      categoryValue: product.category?.slug ?? "",
      description: product.summary ?? product.description ?? "",
      price: product.priceCents / 100,
      currency: product.currency ?? "USD",
      stock: product.stock,
      sizes: sizes.length ? sizes : ["Única"],
      imageUrl,
      label: product.isFeatured ? "Destacado" : undefined,
    };
  });

  const categoryFilters: FilterOption[] = [
    { value: "", label: "Todas" },
    ...categoryRows.map((category) => ({
      value: category.slug,
      label: category.name,
      color: category.highlightColor ?? undefined,
    })),
  ];

  const sizeOptions = buildSizeFilters(catalogProducts);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-2 md:px-4 py-10 sm:px-6">
      <CatalogGrid
        products={catalogProducts}
        categories={categoryFilters}
        sizeOptions={sizeOptions}
        pagination={{ currentPage, totalPages, pageSize: PAGE_SIZE, totalItems: totalProducts }}
        selectedCategory={requestedCategory}
        selectedSize={requestedSize}
        searchTerm={searchQuery}
        whatsappNumber={env.WHATSAPP_NUMBER}
      />
    </main>
  );
}

function splitCommaValues(value?: string | null) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch (error) {
    console.warn("No se pudo parsear metadata", error);
    return null;
  }
}

function buildSizeFilters(products: CatalogProduct[]): FilterOption[] {
  const uniqueSizes = new Set<string>();
  products.forEach((product) => {
    product.sizes.forEach((size) => uniqueSizes.add(size));
  });

  const sizes = uniqueSizes.size ? Array.from(uniqueSizes) : FALLBACK_SIZES;

  return sizes.map((size) => ({ value: size, label: size }));
}
