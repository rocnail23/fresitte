import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { loadCategories } from "@/lib/categories";
import { Button } from "@/components/ui/button";

import { CategoriesList } from "@/components/admin/category/categories-list";
import { ToastFeedback } from "@/components/admin/toast-feedback";

export default async function CategoriesPage() {
  const categoryList = await loadCategories();

  return (
    <div className="flex flex-col gap-6">
      <ToastFeedback basePath="/admin/categories" />

      <header className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 border-b border-border/40 bg-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Colecciones
          </p>
          <h1 className="font-heading text-2xl text-foreground sm:text-3xl">
            Categorías
          </h1>
          <p className="text-sm text-muted-foreground tabular-nums">
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
