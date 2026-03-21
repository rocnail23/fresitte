
import type { ReactNode } from "react";
import { desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { categories, products } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createProductAction, deleteProductAction, updateProductAction } from "./actions";

type ProductSearchParams = {
  status?: string;
  message?: string;
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<ProductSearchParams>;
}) {
  const resolvedParams = (await searchParams) ?? {};
  const feedbackStatus = resolvedParams.status === "success" || resolvedParams.status === "error" ? resolvedParams.status : null;
  const feedbackMessage = resolvedParams.message;
  const [categoryList, productList] = await Promise.all([
    db.select().from(categories).orderBy(categories.displayOrder, categories.name),
    db.query.products.findMany({
      with: { category: true },
      orderBy: desc(products.createdAt),
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {feedbackStatus && feedbackMessage ? (
        <div
          className={`flex items-center justify-between gap-4 rounded-3xl border px-4 py-3 text-sm ${feedbackStatus === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-destructive/30 bg-destructive/10 text-destructive"}`}
        >
          <p>{feedbackMessage}</p>
          <a href="/admin/products" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Cerrar
          </a>
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Nuevo</p>
          <h1 className="font-heading text-3xl text-foreground">Crear producto</h1>
          <p className="text-sm text-muted-foreground">
            Completa los campos básicos. Podrás añadir imágenes avanzadas luego.
          </p>
        </div>
        <form
          action={createProductAction}
     
          className="mt-6 grid gap-4 lg:grid-cols-2"
        >
          <InputField label="Nombre" id="name">
            <Input id="name" name="name" placeholder="Vestido Garden Party" required />
          </InputField>
          <InputField label="Categoría">
            <Select name="categoryId" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {categoryList.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InputField>
          <InputField label="Precio (USD)" id="price">
            <Input id="price" name="price" type="number" step="0.01" min="0" required />
          </InputField>
          <InputField label="Stock inicial" id="stock">
            <Input id="stock" name="stock" type="number" min="0" defaultValue={1} />
          </InputField>
          <InputField label="Imagen principal" id="imageFile">
            <Input id="imageFile" name="imageFile" type="file" accept="image/*" className="cursor-pointer" />
            <p className="text-xs text-muted-foreground">
              Selecciona un archivo; luego lo subiremos a Cloudflare R2 automáticamente.
            </p>
          </InputField>
          <InputField label="Resumen corto" id="summary" className="lg:col-span-2">
            <Input id="summary" name="summary" placeholder="Algodón orgánico + cinturón ajustable" />
          </InputField>
          <InputField label="Descripción" id="description" className="lg:col-span-2">
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe materiales, cuidados, detalles..."
            />
          </InputField>
          <InputField label="Tallas (separadas por coma)" id="sizes">
            <Input id="sizes" name="sizes" placeholder="2A,3A,4A" />
          </InputField>
          <CheckboxField id="isVisible" name="isVisible" defaultChecked label="Mostrar en catálogo" />
          <CheckboxField id="isFeatured" name="isFeatured" label="Marcar como destacado" />
          <div className="lg:col-span-2">
            <Button type="submit" className="w-full rounded-full bg-primary py-6 text-base">
              Guardar producto
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl">Inventario</h2>
          <p className="text-sm text-muted-foreground">
            {productList.length ? `${productList.length} productos activos` : "Aún no hay productos"}
          </p>
        </div>
        <div className="mt-6 space-y-4">
          {productList.map((product) => {
            const metadata = product.metadata ? JSON.parse(product.metadata) : null;
            const price = new Intl.NumberFormat("es-US", {
              style: "currency",
              currency: product.currency ?? "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(product.priceCents / 100);

            return (
              <details key={product.id} className="rounded-2xl border border-muted/60 bg-white/90 p-4">
                <summary className="flex cursor-pointer items-center justify-between gap-4">
                  <div>
                    <p className="font-heading text-xl text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category?.name ?? "Sin categoría"}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{metadata?.imageUrl ? "Con imagen" : "Sin imagen"}</p>
                    <p>
                      {product.stock} unidades · {price}
                    </p>
                  </div>
                </summary>

                <div className="mt-4 grid gap-4 border-t border-muted pt-4 lg:grid-cols-2">
                  <form action={updateProductAction} className="space-y-4">
                    <input type="hidden" name="id" value={product.id} />
                    <InputField label="Nombre">
                      <Input name="name" defaultValue={product.name} required />
                    </InputField>
                    <InputField label="Categoría">
                      <Select name="categoryId" defaultValue={String(product.categoryId)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryList.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </InputField>
                    <InputField label="Precio (USD)">
                      <Input name="price" type="number" step="0.01" defaultValue={product.priceCents / 100} />
                    </InputField>
                    <InputField label="Stock">
                      <Input name="stock" type="number" defaultValue={product.stock} />
                    </InputField>
                    <InputField label="Imagen principal (reemplazar opcional)">
                      <Input name="imageFile" type="file" accept="image/*" className="cursor-pointer" />
                    </InputField>
                    <InputField label="Resumen" className="lg:col-span-2">
                      <Input name="summary" defaultValue={product.summary ?? ""} />
                    </InputField>
                    <InputField label="Descripción" className="lg:col-span-2">
                      <Textarea name="description" rows={4} defaultValue={product.description ?? ""} />
                    </InputField>
                    <InputField label="Tallas">
                      <Input name="sizes" defaultValue={product.sizes ?? ""} />
                    </InputField>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" name="isVisible" defaultChecked={product.isVisible} /> Mostrar
                      </label>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} /> Destacado
                      </label>
                    </div>
                    <Button type="submit" className="w-full rounded-full">
                      Guardar cambios
                    </Button>
                  </form>

                  <form action={deleteProductAction} className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-sm text-muted-foreground">
                      Esta acción eliminará el producto y sus variantes del catálogo.
                    </p>
                    <input type="hidden" name="id" value={product.id} />
                    <Button type="submit" variant="destructive" className="w-full rounded-full">
                      Eliminar producto
                    </Button>
                  </form>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function InputField({
  label,
  id,
  children,
  className,
}: {
  label: string;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `${className} space-y-2` : "space-y-2"}>
      <label className="text-sm font-semibold text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

function CheckboxField({
  id,
  name,
  label,
  defaultChecked,
}: {
  id: string;
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <input id={id} name={name} type="checkbox" defaultChecked={defaultChecked} />
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
    </div>
  );
}
