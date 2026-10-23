import { asc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db";
import { sizes } from "@/db/schema";
import {
  normalizeSizeToken,
  sizeEntriesFromCsv,
  splitSizeTokens,
} from "@/lib/size-tokens";

export interface SizeRecord {
  id: number;
  name: string;
  matchKey: string;
  displayOrder: number;
}

/**
 * Registry of the sizes the shop sells.
 *
 * The admin owns this list from `/admin/sizes`: the order defined here is
 * the order the size chips appear in on the storefront filter, and the name
 * is the label shown to the customer.
 *
 * `matchKey` is the canonical key every spelling of the size resolves to
 * ("3-6M", "3-6 meses" → "3-6"), so a size typed differently on a product
 * still matches the registry entry.
 *
 * Tagged with `"sizes"` — every write to the registry expires it, and so
 * does a product write that registers a new size.
 */
export async function loadSizes(): Promise<SizeRecord[]> {
  "use cache";
  cacheTag("sizes");
  cacheLife("hours");

  const rows = await db
    .select({
      id: sizes.id,
      name: sizes.name,
      matchKey: sizes.matchKey,
      displayOrder: sizes.displayOrder,
    })
    .from(sizes)
    .orderBy(asc(sizes.displayOrder), asc(sizes.name));

  return rows.map((row) => ({ ...row, displayOrder: row.displayOrder ?? 0 }));
}

export interface ProductSizesSync {
  /** The CSV to store on the product, rewritten to the registry labels. */
  value: string | null;
  /** How many sizes joined the registry with this write. */
  added: number;
}

/**
 * Registers the sizes of a product that are not in the registry yet and
 * returns the CSV to store, with every token rewritten to the label the
 * admin chose.
 *
 * New entries are appended at the end of the registry, so the admin can
 * place them with the drag & drop list. Tokens that are already registered
 * keep the registry name, so "3-6M" and "3-6" both end up as "3-6 meses".
 */
export async function syncProductSizes(
  csv?: string | null,
): Promise<ProductSizesSync> {
  const entries = sizeEntriesFromCsv(csv);
  if (!entries.length) return { value: null, added: 0 };

  const existing = await db
    .select({
      id: sizes.id,
      name: sizes.name,
      matchKey: sizes.matchKey,
      displayOrder: sizes.displayOrder,
    })
    .from(sizes);

  const byKey = new Map(existing.map((row) => [row.matchKey, row] as const));
  const missing = entries.filter((entry) => !byKey.has(entry.key));

  if (missing.length) {
    const lastOrder = existing.reduce(
      (max, row) => Math.max(max, row.displayOrder ?? 0),
      -1,
    );
    await db
      .insert(sizes)
      .values(
        missing.map((entry, index) => ({
          name: entry.label,
          matchKey: entry.key,
          displayOrder: lastOrder + 1 + index,
        })),
      )
      .onConflictDoNothing();
  }

  // Rewrite every token with the label of the registry entry.
  const labels = new Map<string, string>();
  for (const entry of entries) {
    const known = byKey.get(entry.key);
    labels.set(entry.key, known?.name ?? entry.label);
  }

  const rewritten = splitSizeTokens(csv)
    .map((token) => labels.get(normalizeSizeToken(token)) ?? token)
    .filter(Boolean);

  return {
    value: rewritten.length ? rewritten.join(", ") : null,
    added: missing.length,
  };
}
