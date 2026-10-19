"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productCategories, products } from "@/db/schema";
import { uploadImageToR2 } from "@/lib/r2";

const productBaseSchema = z.object({
  name: z.string().min(3),
  categoryIds: z.array(z.coerce.number().int().positive()).min(1),
  price: z.coerce.number().positive(),
  summary: z.string().max(140).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  stock: z.coerce.number().int().nonnegative().default(1),
  sizes: z.string().optional().or(z.literal("")),
  isVisible: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

const createProductSchema = productBaseSchema;
const updateProductSchema = productBaseSchema.extend({
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
  redirect(`/admin/products?${params.toString()}`);
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const data = Object.fromEntries(formData.entries());
  const categoryIds = formData.getAll("categoryIds").map((value) => Number(value));
  const parsed = createProductSchema.safeParse({
    ...data,
    categoryIds,
    isVisible: data.isVisible === "on",
    isFeatured: data.isFeatured === "on",
  });

  if (!parsed.success) {
    redirectWithFeedback("error", "Datos inválidos. Selecciona al menos una categoría.");
  }

  const values = parsed.data;
  const slug = slugify(values.name);
  const sku = slug;
  const file = formData.get("imageFile");
  let imageUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    try {
      const uploadResult = await uploadImageToR2({ keyPrefix: "products", file });
      imageUrl = uploadResult?.url ?? null;
    } catch (error) {
      console.error("uploadImageToR2:product", error);
      redirectWithFeedback("error", "No pudimos subir la imagen del producto. Intenta de nuevo.");
    }
  }

  try {
    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(products)
        .values({
          name: values.name,
          slug,
          priceCents: Math.round(values.price * 100),
          summary: values.summary || null,
          description: values.description || null,
          stock: values.stock ?? 1,
          sku,
          sizes: values.sizes?.trim() ? values.sizes : null,
          isVisible: values.isVisible ?? true,
          isFeatured: values.isFeatured ?? false,
          metadata: imageUrl ? JSON.stringify({ imageUrl }) : null,
          currency: "EUR",
        })
        .returning({ id: products.id });
      if (!inserted) throw new Error("Insert did not return product id");
      await tx.insert(productCategories).values(
        values.categoryIds.map((categoryId) => ({
          productId: inserted.id,
          categoryId,
        })),
      );
    });
  } catch (error) {
    console.error("createProductAction", error);
    redirectWithFeedback("error", "No pudimos crear el producto. Revisa que el nombre no esté duplicado.");
  }

  revalidatePath("/admin/products");
  redirectWithFeedback("success", "Producto creado correctamente");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();

  const data = Object.fromEntries(formData.entries());
  const categoryIds = formData.getAll("categoryIds").map((value) => Number(value));
  const parsed = updateProductSchema.safeParse({
    ...data,
    categoryIds,
    isVisible: data.isVisible === "on",
    isFeatured: data.isFeatured === "on",
  });

  if (!parsed.success) {
    redirectWithFeedback("error", "Datos inválidos. Selecciona al menos una categoría");
  }

  const values = parsed.data;
  const existing = await db.query.products.findFirst({ where: eq(products.id, values.id) });
  if (!existing) {
    redirectWithFeedback("error", "Producto no encontrado");
  }

  const slug = slugify(values.name);
  const sku = existing.sku ?? slug;
  const file = formData.get("imageFile");
  let imageUrl: string | null = existing.metadata ? extractImageUrl(existing.metadata) : null;

  if (file instanceof File && file.size > 0) {
    try {
      const uploadResult = await uploadImageToR2({ keyPrefix: "products", file });
      imageUrl = uploadResult?.url ?? imageUrl;
    } catch (error) {
      console.error("uploadImageToR2:product:update", error);
      redirectWithFeedback("error", "No pudimos subir la imagen del producto. Intenta de nuevo.");
    }
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(products)
        .set({
          name: values.name,
          slug,
          priceCents: Math.round(values.price * 100),
          summary: values.summary || null,
          description: values.description || null,
          stock: values.stock ?? 1,
          sku,
          sizes: values.sizes?.trim() ? values.sizes : null,
          isVisible: values.isVisible ?? true,
          isFeatured: values.isFeatured ?? false,
          metadata: imageUrl ? JSON.stringify({ imageUrl }) : null,
        })
        .where(eq(products.id, values.id));
      await tx.delete(productCategories).where(eq(productCategories.productId, values.id));
      const uniqueCategoryIds = Array.from(new Set(values.categoryIds));
      if (uniqueCategoryIds.length) {
        await tx.insert(productCategories).values(
          uniqueCategoryIds.map((categoryId) => ({
            productId: values.id,
            categoryId,
          })),
        );
      }
    });
  } catch (error) {
    console.error("updateProductAction", error);
    redirectWithFeedback("error", "No pudimos actualizar el producto");
  }

  revalidatePath("/admin/products");
  redirectWithFeedback("success", "Producto actualizado");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) {
    redirectWithFeedback("error", "Producto inválido");
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(productCategories).where(eq(productCategories.productId, id));
      await tx.delete(products).where(eq(products.id, id));
    });
  } catch (error) {
    console.error("deleteProductAction", error);
    redirectWithFeedback("error", "No pudimos eliminar el producto");
  }

  revalidatePath("/admin/products");
  redirectWithFeedback("success", "Producto eliminado");
}

function extractImageUrl(metadata: string) {
  try {
    const parsed = JSON.parse(metadata) as { imageUrl?: string };
    return parsed.imageUrl ?? null;
  } catch {
    return null;
  }
}

export async function duplicateProductAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) {
    redirectWithFeedback("error", "Producto inválido");
  }

  const source = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { productCategories: true },
  });
  if (!source) {
    redirectWithFeedback("error", "Producto no encontrado");
  }

  // Build a unique slug with `-copy` suffix and a fresh SKU.
  const baseSlug = `${slugify(source.name)}`;
  let candidate = `${baseSlug}-copy`;
  let suffix = 1;
  while (await db.query.products.findFirst({ where: eq(products.slug, candidate) })) {
    suffix += 1;
    candidate = `${baseSlug}-copy-${suffix}`;
  }

  const skuSuffix = `-${suffix}`;

  try {
    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(products)
        .values({
          name: `${source.name} (copia)`,
          slug: candidate,
          summary: source.summary,
          description: source.description,
          priceCents: source.priceCents,
          compareAtPriceCents: source.compareAtPriceCents,
          currency: source.currency,
          stock: source.stock,
          sku: `${source.sku}${skuSuffix}`,
          sizes: source.sizes,
          isVisible: false,
          isFeatured: false,
          // Images intentionally not copied: uploads are not duplicated.
          metadata: null,
        })
        .returning({ id: products.id });
      if (!inserted) throw new Error("Insert did not return product id");

      const categoryIds = (source.productCategories ?? []).map((link) => link.categoryId);
      if (categoryIds.length) {
        await tx.insert(productCategories).values(
          categoryIds.map((categoryId) => ({
            productId: inserted.id,
            categoryId,
          })),
        );
      }
    });
  } catch (error) {
    console.error("duplicateProductAction", error);
    redirectWithFeedback("error", "No pudimos duplicar el producto");
  }

  revalidatePath("/admin/products");
  redirectWithFeedback("success", "Producto duplicado");
}
