"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";

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

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();

  const parsed = createCategorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    throw new Error("Datos inválidos. Revisa nombre, color y URL");
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
      throw new Error("No pudimos subir la portada. Intenta de nuevo.");
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
    throw new Error("No pudimos crear la categoría. Revisa que el slug sea único.");
  }

  revalidatePath("/admin/categories");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();

  const parsed = updateCategorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    throw new Error("Datos inválidos. Revisa el formulario de edición");
  }

  const values = parsed.data;
  const existing = await db.query.categories.findFirst({ where: eq(categories.id, values.id) });
  if (!existing) {
    throw new Error("Categoría no encontrada");
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
      throw new Error("No pudimos subir la portada. Intenta de nuevo.");
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
    throw new Error("No pudimos actualizar la categoría");
  }

  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) {
    throw new Error("Categoría inválida");
  }

  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (error) {
    console.error("deleteCategoryAction", error);
    throw new Error("No pudimos eliminar la categoría");
  }

  revalidatePath("/admin/categories");
}
