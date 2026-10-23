import "dotenv/config";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";

import * as schema from "@/db/schema";
import {
  defaultSizeRank,
  normalizeSizeToken,
  splitSizeTokens,
} from "@/lib/size-tokens";

/**
 * Registers the sizes used by the products that are not in the registry yet.
 *
 * The label of each entry is the spelling the products use most often
 * ("3-6" instead of the "3-6m" a single product uses), so the filter shows a
 * consistent name. The admin can rename them and reorder them from
 * `/admin/sizes`.
 *
 * Idempotent: running it twice does not duplicate the registry.
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const databaseAuthToken = process.env.DATABASE_AUTH_TOKEN;

  if (!databaseUrl || !databaseAuthToken) {
    throw new Error(
      "DATABASE_URL y DATABASE_AUTH_TOKEN son necesarios para seedear",
    );
  }

  const client = createClient({
    url: databaseUrl,
    authToken: databaseAuthToken,
  });
  const db = drizzle(client, { schema });

  const existing = await db
    .select({ matchKey: schema.sizes.matchKey })
    .from(schema.sizes);
  const known = new Set(existing.map((row) => row.matchKey));

  const productRows = await db
    .select({ id: schema.products.id, sizes: schema.products.sizes })
    .from(schema.products);

  // Count how many products use each spelling, to pick the best label.
  const spellings = new Map<string, Map<string, number>>();
  for (const row of productRows) {
    for (const token of splitSizeTokens(row.sizes)) {
      const matchKey = normalizeSizeToken(token);
      if (!matchKey) continue;
      const counts = spellings.get(matchKey) ?? new Map<string, number>();
      counts.set(token, (counts.get(token) ?? 0) + 1);
      spellings.set(matchKey, counts);
    }
  }

  const missing: { name: string; matchKey: string }[] = [];
  for (const [matchKey, counts] of spellings) {
    if (known.has(matchKey)) continue;
    const [name] = [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0];
    missing.push({ name, matchKey });
  }

  if (!missing.length) {
    console.log("Todas las tallas del catálogo ya están registradas.");
    process.exit(0);
  }

  // Order the new sizes by the natural progression of the shop: newborn,
  // months, years and finally the shoe sizes.
  missing.sort((a, b) => {
    const rank = defaultSizeRank(a.matchKey) - defaultSizeRank(b.matchKey);
    if (rank !== 0) return rank;
    return a.matchKey.localeCompare(b.matchKey, "es", { numeric: true });
  });
  const lastOrder = (
    await db.select({ displayOrder: schema.sizes.displayOrder }).from(schema.sizes)
  ).reduce((max, row) => Math.max(max, row.displayOrder ?? 0), -1);

  await db
    .insert(schema.sizes)
    .values(
      missing.map((entry, index) => ({
        name: entry.name,
        matchKey: entry.matchKey,
        displayOrder: lastOrder + 1 + index,
      })),
    )
    .onConflictDoNothing();

  // Rewrite the products with the label chosen for each size.
  const labels = new Map(missing.map((entry) => [entry.matchKey, entry.name]));
  for (const row of productRows) {
    if (!row.sizes) continue;
    const rewritten = splitSizeTokens(row.sizes)
      .map((token) => labels.get(normalizeSizeToken(token)) ?? token)
      .join(", ");
    if (rewritten !== row.sizes) {
      await db
        .update(schema.products)
        .set({ sizes: rewritten })
        .where(eq(schema.products.id, row.id));
    }
  }

  console.log(
    `${missing.length} tallas registradas: ${missing.map((m) => m.name).join(", ")}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
