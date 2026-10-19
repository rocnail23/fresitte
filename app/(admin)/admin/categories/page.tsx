import Link from "next/link";
import { asc } from "drizzle-orm";
import { PlusIcon } from "lucide-react";

import { db } from "@/lib/db";
import {
  categories,
  productCategories,
} from "@/db/schema";
import { Button } from "@/components/ui/button";

import { CategoriesList } from "@/components/admin/category/categories-list";
import { ToastFeedback } from "@/components/admin/toast-feedback";

export default async function CategoriesPage() {
  const rows = await db.select().from(categories).orderBy(asc(categories.displayOrder));

  // Read product counts per category in one query.
  const counts = await db
    .select({
      categoryId: productCategories.categoryId,
      count: productCategories.productId,
    })
    .from(productCategories);
  const totals = new Map<number, number>();
  for (const row of counts) {
    totals.set(row.categoryId, (totals.get(row.categoryId) ?? 0) + 1);
  }

  const categoryList = rows.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    highlightColor: category.highlightColor,
    coverImageUrl: category.coverImageUrl,
    displayOrder: category.displayOrder ?? 0,
    description: category.description,
    productCount: totals.get(category.id) ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <ToastFeedback basePath="/admin/categories" />

      <header className="sticky top-0 z-10 -mx-6 flex flex-col gap-2 border-b border-border/40 bg-card/90 px-6 py-4 backdrop-blur sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Colecciones
          </p>
          <h1 className="font-heading text-3xl text-foreground">
            Categorías
          </h1>
          <p className="text-sm text-muted-foreground">
            {categoryList.length} colección
            {categoryList.length === 1 ? "" : "es"}
          </p>
        </div>
        <Button asChild className="rounded-full px-5">
          <Link href="/admin/categories/new">
            <PlusIcon className="size-4" />
            Nueva categoría
          </Link>
        </Button>
      </header>

      <CategoriesList categories={categoryList} />
    </div>
  );
}
