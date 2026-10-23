import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { loadCategories } from "@/lib/categories";
import { loadSizes } from "@/lib/sizes";
import { Button } from "@/components/ui/button";

import {
  ProductForm,
  type CategoryOption,
} from "@/components/admin/product/product-form";
import { ToastFeedback } from "@/components/admin/toast-feedback";
import { createProductAction } from "../actions";

export default async function NewProductPage() {
  const [categoryRows, sizeRows] = await Promise.all([
    loadCategories(),
    loadSizes(),
  ]);
  const categoryOptions: CategoryOption[] = categoryRows.map(
    ({ id, name }) => ({ id, name }),
  );
  const sizeSuggestions = sizeRows.map((size) => size.name);

  return (
    <div className="flex flex-col gap-6">
      <ToastFeedback basePath="/admin/products" />
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Inventario · Nuevo
          </p>
          <h1 className="font-heading text-3xl text-foreground">
            Nuevo producto
          </h1>
          <p className="text-sm text-muted-foreground">
            Rellena las secciones. Las categorías se cargan de Colecciones.
          </p>
        </div>
        <Button asChild variant="ghost" className="rounded-full px-4">
          <Link href="/admin/products">
            <ChevronLeftIcon className="size-4" />
            Volver al inventario
          </Link>
        </Button>
      </header>
      <ProductForm
        mode="create"
        action={createProductAction}
        categoryList={categoryOptions}
        sizeSuggestions={sizeSuggestions}
        cancelHref="/admin/products"
      />
    </div>
  );
}
