"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { products, sizes } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  deriveSizeKey,
  normalizeSizeToken,
  replaceSizeToken,
  splitSizeTokens,
} from "@/lib/size-tokens";

const sizeBaseSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre de la talla es obligatorio")
    .max(40, "El nombre de la talla es demasiado largo"),
});

const createSizeSchema = sizeBaseSchema;
const updateSizeSchema = sizeBaseSchema.extend({
  id: z.coerce.number().int().positive(),
});

function redirectWithFeedback(status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin/sizes?${params.toString()}`);
}

/**
 * Adds a size to the registry.
 *
 * The canonical key is derived from the name ("Talla 19" → "19"), so a size
 * is never registered twice under two spellings.
 */
export async function createSizeAction(formData: FormData) {
  await requireAdmin();

  const parsed = createSizeSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
  });
  if (!parsed.success) {
    redirectWithFeedback("error", "Escribe el nombre de la talla");
  }

  const name = parsed.data.name;
  const matchKey = deriveSizeKey(name);
  if (!matchKey) {
    redirectWithFeedback("error", "Escribe el nombre de la talla");
  }

  try {
    // New sizes join the end of the list; the admin moves them with the
    // drag & drop list.
    const lastOrder = (
      await db.select({ displayOrder: sizes.displayOrder }).from(sizes)
    ).reduce((max, row) => Math.max(max, row.displayOrder ?? 0), -1);

    await db.insert(sizes).values({ name, matchKey, displayOrder: lastOrder + 1 });
  } catch (error) {
    console.error("createSizeAction", error);
    redirectWithFeedback("error", "Esa talla ya existe o no se pudo guardar");
  }

  updateTag("sizes");
  updateTag("catalog");
  redirectWithFeedback("success", "Talla añadida");
}

/**
 * Renames a size and propagates the new label to the products that use it,
 * so the product cards keep showing the same text the admin typed.
 */
export async function updateSizeAction(formData: FormData) {
  await requireAdmin();

  const parsed = updateSizeSchema.safeParse({
    id: formData.get("id"),
    name: String(formData.get("name") ?? "").trim(),
  });
  if (!parsed.success) {
    redirectWithFeedback("error", "Datos inválidos. Revisa el nombre de la talla");
  }

  const { id, name } = parsed.data;
  const matchKey = deriveSizeKey(name);
  if (!matchKey) {
    redirectWithFeedback("error", "Escribe el nombre de la talla");
  }

  const existing = await db
    .select({ id: sizes.id, name: sizes.name, matchKey: sizes.matchKey })
    .from(sizes)
    .where(eq(sizes.id, id));
  const current = existing[0];
  if (!current) {
    redirectWithFeedback("error", "Talla no encontrada");
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(sizes)
        .set({ name, matchKey })
        .where(eq(sizes.id, id));

      // Rewrite the products that carry the old spelling.
      const affected = await tx
        .select({ id: products.id, sizes: products.sizes })
        .from(products);
      const updates = affected
        .map((product) => ({
          id: product.id,
          sizes: replaceSizeToken(product.sizes, current.matchKey, name),
        }))
        .filter(
          (update): update is { id: number; sizes: string } =>
            typeof update.sizes === "string",
        );

      for (const update of updates) {
        await tx
          .update(products)
          .set({ sizes: update.sizes })
          .where(eq(products.id, update.id));
      }
    });
  } catch (error) {
    console.error("updateSizeAction", error);
    redirectWithFeedback("error", "No pudimos actualizar la talla");
  }

  updateTag("sizes");
  updateTag("catalog");
  redirectWithFeedback("success", "Talla actualizada");
}

/**
 * Removes a size from the registry.
 *
 * The products keep their own size text: removing the registry entry only
 * takes the size out of the filter order, it does not change the catalog.
 */
export async function deleteSizeAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) {
    redirectWithFeedback("error", "Talla inválida");
  }

  try {
    await db.delete(sizes).where(eq(sizes.id, id));
  } catch (error) {
    console.error("deleteSizeAction", error);
    redirectWithFeedback("error", "No pudimos eliminar la talla");
  }

  updateTag("sizes");
  updateTag("catalog");
  redirectWithFeedback("success", "Talla eliminada");
}

const reorderItemSchema = z.object({
  id: z.coerce.number().int().positive(),
  displayOrder: z.coerce.number().int().min(0),
});

const reorderSchema = z.object({
  items: z.array(reorderItemSchema).min(1),
});

export async function reorderSizesAction(payload: {
  items: { id: number; displayOrder: number }[];
}) {
  await requireAdmin();

  const parsed = reorderSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false as const, error: "Datos inválidos" };
  }

  const { items } = parsed.data;
  const ids = items.map((item) => item.id);

  try {
    const existing = await db
      .select({ id: sizes.id })
      .from(sizes)
      .where(inArray(sizes.id, ids));
    const existingIds = new Set(existing.map((row) => row.id));
    const validItems = items.filter((item) => existingIds.has(item.id));

    if (validItems.length === 0) {
      return { ok: false as const, error: "Tallas no encontradas" };
    }

    // Single transaction so a mid-batch failure rolls back the whole reorder.
    await db.transaction(async (tx) => {
      await tx
        .update(sizes)
        .set({ displayOrder: sql`-1` })
        .where(
          inArray(
            sizes.id,
            validItems.map((item) => item.id),
          ),
        );
      for (const item of validItems) {
        await tx
          .update(sizes)
          .set({ displayOrder: item.displayOrder })
          .where(eq(sizes.id, item.id));
      }
    });
  } catch (error) {
    console.error("reorderSizesAction", error);
    return { ok: false as const, error: "No pudimos reordenar las tallas" };
  }

  updateTag("sizes");
  updateTag("catalog");
  return { ok: true as const };
}

/**
 * Registers the sizes found in the catalog that are not in the registry yet.
 *
 * The new entries are appended at the end of the list, so the admin can
 * place them with the drag & drop list.
 */
export async function syncSizesAction() {
  await requireAdmin();

  const rows = await db.select({ sizes: products.sizes }).from(products);
  const known = new Set(
    (await db.select({ matchKey: sizes.matchKey }).from(sizes)).map(
      (row) => row.matchKey,
    ),
  );

  const seen = new Set<string>();
  const missing: { name: string; matchKey: string }[] = [];
  for (const row of rows) {
    for (const token of splitSizeTokens(row.sizes)) {
      const key = normalizeSizeToken(token);
      if (!key || known.has(key) || seen.has(key)) continue;
      seen.add(key);
      missing.push({ name: token, matchKey: key });
    }
  }

  if (!missing.length) {
    return { ok: true as const, added: 0 };
  }

  const lastOrder = (
    await db.select({ displayOrder: sizes.displayOrder }).from(sizes)
  ).reduce((max, row) => Math.max(max, row.displayOrder ?? 0), -1);

  try {
    await db.insert(sizes).values(
      missing.map((entry, index) => ({
        name: entry.name,
        matchKey: entry.matchKey,
        displayOrder: lastOrder + 1 + index,
      })),
    );
  } catch (error) {
    console.error("syncSizesAction", error);
    return { ok: false as const, error: "No pudimos sincronizar las tallas" };
  }

  updateTag("sizes");
  updateTag("catalog");
  return { ok: true as const, added: missing.length };
}
