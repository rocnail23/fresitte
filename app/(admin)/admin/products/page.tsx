import Link from "next/link";
import { desc, eq, like, and } from "drizzle-orm";
import { PlusIcon } from "lucide-react";

import { db } from "@/lib/db";
import { categories, products } from "@/db/schema";
import { Button } from "@/components/ui/button";

import { ProductListToolbar } from "@/components/admin/product/product-list-toolbar";
import { ProductsList } from "@/components/admin/product/products-list";
import { ToastFeedback } from "@/components/admin/toast-feedback";

type SearchParams = {
  q?: string;
  filter?: string;
  status?: string;
  message?: string;
};

const FILTERS = new Set(["all", "visible", "hidden", "featured"]);

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = (await searchParams) ?? {};
  const query = resolved.q?.trim() ?? "";
  const filterRaw = resolved.filter ?? "all";
  const filter = (FILTERS.has(filterRaw) ? filterRaw : "all") as
    | "all"
    | "visible"
    | "hidden"
    | "featured";

  const categoryList = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(categories.displayOrder, categories.name);

  const conditions = [];
  if (query) {
    conditions.push(like(products.name, `%${query}%`));
  }
  if (filter === "visible") conditions.push(eq(products.isVisible, true));
  if (filter === "hidden") conditions.push(eq(products.isVisible, false));
  if (filter === "featured") conditions.push(eq(products.isFeatured, true));

  const where = conditions.length === 0
    ? undefined
    : conditions.length === 1
      ? conditions[0]
      : and(...conditions);

  const rows = await db.query.products.findMany({
    where,
    orderBy: desc(products.createdAt),
    with: {
      productCategories: { with: { category: true } },
    },
  });

  const productList = rows.map((product) => {
    const metadata = product.metadata ? safeParse(product.metadata) : null;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      priceCents: product.priceCents,
      currency: product.currency ?? null,
      stock: product.stock,
      summary: product.summary ?? null,
      description: product.description ?? null,
      sizes: product.sizes ?? null,
      isVisible: product.isVisible,
      isFeatured: product.isFeatured,
      imageUrl: metadata?.imageUrl ?? null,
      categoryNames: (product.productCategories ?? []).flatMap((link) =>
        link.category ? [link.category.name] : [],
      ),
      categoryIds: (product.productCategories ?? []).flatMap((link) =>
        link.category ? [link.category.id] : [],
      ),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <ToastFeedback basePath="/admin/products" />

      <header className="sticky top-0 z-10 -mx-6 flex flex-col gap-2 border-b border-border/40 bg-card/90 px-6 py-4 backdrop-blur sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Inventario
          </p>
          <h1 className="font-heading text-3xl text-foreground">
            Productos
          </h1>
          <p className="text-sm text-muted-foreground">
            {productList.length} producto{productList.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild className="rounded-full px-5">
          <Link href="/admin/products/new">
            <PlusIcon className="size-4" />
            Nuevo producto
          </Link>
        </Button>
      </header>

      <ProductListToolbar initialQuery={query} initialFilter={filter} />

      <ProductsList products={productList} categoryList={categoryList} />
    </div>
  );
}

function safeParse(metadata: string) {
  try {
    return JSON.parse(metadata) as { imageUrl?: string };
  } catch {
    return null;
  }
}
