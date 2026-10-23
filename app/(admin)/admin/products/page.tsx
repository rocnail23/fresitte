import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { loadCategories } from "@/lib/categories";
import { loadAdminProducts } from "@/lib/products";
import { loadSizes } from "@/lib/sizes";
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

type ProductFilter = "all" | "visible" | "hidden" | "featured";

const FILTERS: Record<string, ProductFilter> = {
  all: "all",
  visible: "visible",
  hidden: "hidden",
  featured: "featured",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = (await searchParams) ?? {};
  const query = resolved.q?.trim() ?? "";
  const filter: ProductFilter = FILTERS[resolved.filter ?? "all"] ?? "all";

  const [categoryRows, productRows, sizeRows] = await Promise.all([
    loadCategories(),
    loadAdminProducts(),
    loadSizes(),
  ]);

  const categoryList = categoryRows.map(({ id, name }) => ({ id, name }));
  const sizeSuggestions = sizeRows.map((size) => size.name);

  // Filtering runs in memory over the cached snapshot: the catalog is a small
  // boutique, so the cost is negligible and the cache key stays trivial.
  const needle = query.toLowerCase();
  const productList = productRows.filter((product) => {
    if (needle && !product.name.toLowerCase().includes(needle)) return false;
    if (filter === "visible") return product.isVisible;
    if (filter === "hidden") return !product.isVisible;
    if (filter === "featured") return product.isFeatured;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <ToastFeedback basePath="/admin/products" />

      <header className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 border-b border-border/40 bg-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Inventario
          </p>
          <h1 className="font-heading text-2xl text-foreground sm:text-3xl">
            Productos
          </h1>
          <p className="text-sm text-muted-foreground tabular-nums">
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

      <ProductsList
        products={productList}
        categoryList={categoryList}
        sizeSuggestions={sizeSuggestions}
      />
    </div>
  );
}
