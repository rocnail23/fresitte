import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CategoryForm } from "@/components/admin/category/category-form";
import { ToastFeedback } from "@/components/admin/toast-feedback";
import { createCategoryAction } from "../actions";

export default function NewCategoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <ToastFeedback basePath="/admin/categories" />
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Colecciones · Nueva
          </p>
          <h1 className="font-heading text-3xl text-foreground">
            Nueva categoría
          </h1>
          <p className="text-sm text-muted-foreground">
            Define una colección para agrupar productos en el storefront.
          </p>
        </div>
        <Button asChild variant="ghost" className="rounded-full px-4">
          <Link href="/admin/categories">
            <ChevronLeftIcon className="size-4" />
            Volver a colecciones
          </Link>
        </Button>
      </header>
      <CategoryForm
        mode="create"
        action={createCategoryAction}
        cancelHref="/admin/categories"
      />
    </div>
  );
}
