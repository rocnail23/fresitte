import { asc, count, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db";
import { categories, productCategories } from "@/db/schema";

export interface CategoryRecord {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  highlightColor: string | null;
  displayOrder: number;
  productCount: number;
}

/**
 * Single cached read of the category catalog, shared by the storefront and
 * the admin. Both surfaces render the same rows, so one cache entry keeps
 * them consistent.
 *
 * Tagged with `"categories"` and `"catalog"` because two different writes can
 * change this snapshot:
 *   - a category write → `updateTag("categories")`
 *   - a product write  → `updateTag("catalog")` (it moves the per-category
 *     product counts around)
 *
 * Every write path in `app/(admin)/admin/**\/actions.ts` expires these tags,
 * so the admin always reads its own writes back.
 */
export async function loadCategories(): Promise<CategoryRecord[]> {
  "use cache";
  cacheTag("categories", "catalog");
  cacheLife("hours");

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      coverImageUrl: categories.coverImageUrl,
      highlightColor: categories.highlightColor,
      displayOrder: categories.displayOrder,
      productCount: count(productCategories.productId),
    })
    .from(categories)
    .leftJoin(
      productCategories,
      eq(productCategories.categoryId, categories.id),
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.displayOrder), asc(categories.name));

  return rows.map((row) => ({ ...row, displayOrder: row.displayOrder ?? 0 }));
}
