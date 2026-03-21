import { and, count, desc, eq, gt } from "drizzle-orm";

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

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const resolvedParams = (await searchParams) ?? {};
  const requestedPage = Math.max(1, Number(resolvedParams.page ?? "1") || 1);
  const baseWhere = and(eq(products.isVisible, true), gt(products.stock, 0));

  const [categoryRows, totalResult] = await Promise.all([
    db.select().from(categories).orderBy(categories.displayOrder, categories.name),
    db.select({ value: count() }).from(products).where(baseWhere),
  ]);

  const totalProducts = totalResult?.[0]?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const productRows = await db.query.products.findMany({
    with: { category: true },
    where: baseWhere,
    orderBy: desc(products.createdAt),
    limit: PAGE_SIZE,
    offset,
  });

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
