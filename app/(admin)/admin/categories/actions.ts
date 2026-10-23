"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { uploadImageToR2 } from "@/lib/r2";

const categoryBaseSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  slug: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  highlightColor: z.string().regex(/^#/).optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

const createCategorySchema = categoryBaseSchema;
const updateCategorySchema = categoryBaseSchema.extend({
  id: z.coerce.number().int().positive(),
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

function redirectWithFeedback(status: "success" | "error", message: string): never {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin/categories?${params.toString()}`);
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();

  const parsed = createCategorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    redirectWithFeedback("error", "Datos inválidos. Revisa nombre, color y URL");
  }

  const values = parsed.data;
  const slug = values.slug?.trim() ? slugify(values.slug) : slugify(values.name);
  const file = formData.get("coverImageFile");
  let coverImageUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    try {
      const uploadResult = await uploadImageToR2({ keyPrefix: "categories", file });
      coverImageUrl = uploadResult?.url ?? null;
    } catch (error) {
      console.error("uploadImageToR2:category", error);
      redirectWithFeedback("error", "No pudimos subir la portada. Intenta de nuevo.");
    }
  }

  try {
    await db.insert(categories).values({
      name: values.name,
      slug,
      description: values.description?.trim() ? values.description : null,
      coverImageUrl,
      highlightColor: values.highlightColor?.trim() || "#ff6464",
      displayOrder: values.displayOrder,
    });
  } catch (error) {
    console.error("createCategoryAction", error);
    redirectWithFeedback("error", "No pudimos crear la categoría. Revisa que el slug sea único.");
  }

  updateTag("categories");
  updateTag("catalog");
  redirectWithFeedback("success", "Categoría creada correctamente");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();

  const parsed = updateCategorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    redirectWithFeedback("error", "Datos inválidos. Revisa el formulario de edición");
  }

  const values = parsed.data;
  const existing = await db.query.categories.findFirst({ where: eq(categories.id, values.id) });
  if (!existing) {
    redirectWithFeedback("error", "Categoría no encontrada");
  }

  const slug = values.slug?.trim() ? slugify(values.slug) : slugify(values.name);
  const file = formData.get("coverImageFile");
  let coverImageUrl = existing.coverImageUrl;

  if (file instanceof File && file.size > 0) {
    try {
      const uploadResult = await uploadImageToR2({ keyPrefix: "categories", file });
      coverImageUrl = uploadResult?.url ?? coverImageUrl;
    } catch (error) {
      console.error("uploadImageToR2:category:update", error);
      redirectWithFeedback("error", "No pudimos subir la portada. Intenta de nuevo.");
    }
  }

  try {
    await db
      .update(categories)
      .set({
        name: values.name,
        slug,
        description: values.description?.trim() ? values.description : null,
        coverImageUrl,
        highlightColor: values.highlightColor?.trim() || "#ff6464",
        displayOrder: values.displayOrder,
      })
      .where(eq(categories.id, values.id));
  } catch (error) {
    console.error("updateCategoryAction", error);
    redirectWithFeedback("error", "No pudimos actualizar la categoría.");
  }

  updateTag("categories");
  updateTag("catalog");
  redirectWithFeedback("success", "Categoría actualizada");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) {
    redirectWithFeedback("error", "Categoría inválida");
  }

  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (error) {
    console.error("deleteCategoryAction", error);
    redirectWithFeedback("error", "No pudimos eliminar la categoría");
  }

  updateTag("categories");
  updateTag("catalog");
  redirectWithFeedback("success", "Categoría eliminada");
}

const reorderItemSchema = z.object({
  id: z.coerce.number().int().positive(),
  displayOrder: z.coerce.number().int().min(0),
});

const reorderSchema = z.object({
  items: z.array(reorderItemSchema).min(1),
});

export async function reorderCategoriesAction(payload: {
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
      .select({ id: categories.id })
      .from(categories)
      .where(inArray(categories.id, ids));
    const existingIds = new Set(existing.map((row) => row.id));
    const validItems = items.filter((item) => existingIds.has(item.id));

    if (validItems.length === 0) {
      return { ok: false as const, error: "Categorías no encontradas" };
    }

    // Single transaction so a mid-batch failure rolls back the whole reorder.
    await db.transaction(async (tx) => {
      await tx
        .update(categories)
        .set({ displayOrder: sql`-1` })
        .where(inArray(categories.id, validItems.map((item) => item.id)));
      for (const item of validItems) {
        await tx
          .update(categories)
          .set({ displayOrder: item.displayOrder })
          .where(eq(categories.id, item.id));
      }
    });
  } catch (error) {
    console.error("reorderCategoriesAction", error);
    return { ok: false as const, error: "No pudimos reordenar las categorías" };
  }

  updateTag("categories");
  updateTag("catalog");
  return { ok: true as const };
}
