import { and, desc, eq, gt } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { products } from "@/db/schema";

const productMetadataSchema = z.object({
  imageUrl: z.string().optional(),
});

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export interface StorefrontProductRecord {
  id: number;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  priceCents: number;
  currency: string;
  stock: number;
  sku: string;
  sizes: string | null;
  isFeatured: boolean;
  metadata: string | null;
  createdAt: Date;
  productCategories: {
    productId: number;
    categoryId: number;
    category: { name: string; slug: string } | null;
  }[];
}

export interface AdminProductRecord {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
  currency: string | null;
  stock: number;
  summary: string | null;
  description: string | null;
  sizes: string | null;
  isVisible: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
  categoryNames: string[];
  categoryIds: number[];
}

/**
 * Storefront snapshot: only products that are visible and in stock.
 *
 * Tagged `"catalog"` — every product write expires that tag, so the public
 * home never serves a stale price/stock snapshot.
 */
export async function loadVisibleProducts(): Promise<StorefrontProductRecord[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");

  return db.query.products.findMany({
    where: and(eq(products.isVisible, true), gt(products.stock, 0)),
    orderBy: desc(products.createdAt),
    with: {
      productCategories: {
        with: { category: true },
      },
    },
  }) as unknown as StorefrontProductRecord[];
}

/**
 * Admin snapshot: every product, visible or not, with its category links
 * already flattened so the list component receives plain arrays.
 *
 * The admin list filters in memory over this snapshot (the catalog is small),
 * so one cache entry serves every query/filter combination.
 */
export async function loadAdminProducts(): Promise<AdminProductRecord[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");

  const rows = await db.query.products.findMany({
    orderBy: desc(products.createdAt),
    with: {
      productCategories: { with: { category: true } },
    },
  });

  return rows.map((product) => {
    let imageUrl: string | null = null;
    if (product.metadata) {
      const parsed = productMetadataSchema.safeParse(parseJson(product.metadata));
      imageUrl = parsed.success ? (parsed.data.imageUrl ?? null) : null;
    }

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
      imageUrl,
      categoryNames: (product.productCategories ?? []).flatMap((link) =>
        link.category ? [link.category.name] : [],
      ),
      categoryIds: (product.productCategories ?? []).flatMap((link) =>
        link.category ? [link.category.id] : [],
      ),
    };
  });
}
