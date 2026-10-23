import { RulerIcon } from "lucide-react";

import { loadSizes } from "@/lib/sizes";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { sizeKeysFromCsv } from "@/lib/size-tokens";

import { ToastFeedback } from "@/components/admin/toast-feedback";
import {
  SizeCreateForm,
  SizeSyncButton,
} from "@/components/admin/size/size-create-form";
import {
  SizesSortableList,
  type SortableSize,
} from "@/components/admin/size/sizes-sortable-list";

export default async function AdminSizesPage() {
  const [registry, productRows] = await Promise.all([
    loadSizes(),
    db.select({ sizes: products.sizes }).from(products),
  ]);

  // How many products carry each size, counting every spelling of it.
  const counts = new Map<string, number>();
  for (const row of productRows) {
    for (const key of sizeKeysFromCsv(row.sizes)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const sizeList: SortableSize[] = registry.map((size) => ({
    id: size.id,
    name: size.name,
    matchKey: size.matchKey,
    displayOrder: size.displayOrder,
    productCount: counts.get(size.matchKey) ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <ToastFeedback basePath="/admin/sizes" />

      <header className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 border-b border-border/40 bg-card/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Catálogo
          </p>
          <h1 className="flex items-center gap-2 font-heading text-2xl text-foreground sm:text-3xl">
            <RulerIcon className="size-6 text-primary" />
            Tallas
          </h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {sizeList.length} talla{sizeList.length === 1 ? "" : "s"}
          </p>
        </div>
        <SizeSyncButton />
      </header>

      <SizeCreateForm />

      <SizesSortableList sizes={sizeList} />
    </div>
  );
}
