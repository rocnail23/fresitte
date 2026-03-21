import type { ReactNode } from "react";
import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { categories } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "./actions";

type CategorySearchParams = {
  status?: string;
  message?: string;
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<CategorySearchParams>;
}) {
  const resolvedParams = (await searchParams) ?? {};
  const feedbackStatus = resolvedParams.status === "success" || resolvedParams.status === "error" ? resolvedParams.status : null;
  const feedbackMessage = resolvedParams.message;
  const categoryList = await db.select().from(categories).orderBy(asc(categories.displayOrder));

  return (
    <div className="flex flex-col gap-8">
      {feedbackStatus && feedbackMessage ? (
        <div
          className={`flex items-center justify-between gap-4 rounded-3xl border px-4 py-3 text-sm ${feedbackStatus === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-destructive/30 bg-destructive/10 text-destructive"}`}
        >
          <p>{feedbackMessage}</p>
          <a href="/admin/categories" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Cerrar
          </a>
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Nuevo</p>
          <h1 className="font-heading text-3xl text-foreground">Crear categoría</h1>
          <p className="text-sm text-muted-foreground">
            Define colecciones para agrupar tus productos en el storefront.
          </p>
        </div>
        <form
          action={createCategoryAction}
          className="mt-6 grid gap-4 lg:grid-cols-2"
        
        >
          <InputField label="Nombre" id="name">
            <Input id="name" name="name" placeholder="Mini Picnic" required />
          </InputField>
          <InputField label="Slug (opcional)" id="slug">
            <Input id="slug" name="slug" placeholder="mini-picnic" />
          </InputField>
          <InputField label="Color destacado" id="highlightColor">
            <Input id="highlightColor" name="highlightColor" type="text" placeholder="#ff6464" />
          </InputField>
          <InputField label="Orden de despliegue" id="displayOrder">
            <Input id="displayOrder" name="displayOrder" type="number" min="0" defaultValue={0} />
          </InputField>
          <InputField label="Imagen de portada" id="coverImageFile" className="lg:col-span-2">
            <Input
              id="coverImageFile"
              name="coverImageFile"
              type="file"
              accept="image/*"
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Selecciona un archivo; pronto lo subiremos automáticamente a Cloudflare R2.
            </p>
          </InputField>
          <InputField label="Descripción" id="description" className="lg:col-span-2">
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Cuenta una historia breve sobre la colección para el panel."
            />
          </InputField>
          <div className="lg:col-span-2">
            <Button type="submit" className="w-full rounded-full bg-primary py-6 text-base">
              Guardar categoría
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl">Colecciones</h2>
          <p className="text-sm text-muted-foreground">
            {categoryList.length ? `${categoryList.length} categorías en total` : "Aún no hay categorías"}
          </p>
        </div>
        <div className="mt-6 space-y-4">
          {categoryList.map((category) => (
            <details key={category.id} className="rounded-2xl border border-muted/60 bg-white/90 p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-8 w-8 rounded-full"
                    style={{ backgroundColor: category.highlightColor || "#ff6464" }}
                  />
                  <div>
                    <p className="font-heading text-xl text-foreground">{category.name}</p>
                    <p className="text-sm text-muted-foreground">/{category.slug}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Orden #{category.displayOrder ?? 0}</p>
                  <p>{category.coverImageUrl ? "Con portada" : "Sin portada"}</p>
                </div>
              </summary>

              <div className="mt-4 grid gap-4 border-t border-muted pt-4 lg:grid-cols-2">
                <form
                  action={updateCategoryAction}
                
                  className="space-y-4"
                >
                  <input type="hidden" name="id" value={category.id} />
                  <InputField label="Nombre">
                    <Input name="name" defaultValue={category.name} required />
                  </InputField>
                  <InputField label="Slug">
                    <Input name="slug" defaultValue={category.slug ?? ""} />
                  </InputField>
                  <InputField label="Color destacado">
                    <Input name="highlightColor" defaultValue={category.highlightColor ?? "#ff6464"} />
                  </InputField>
                  <InputField label="Orden">
                    <Input name="displayOrder" type="number" defaultValue={category.displayOrder ?? 0} />
                  </InputField>
                  <InputField label="Imagen de portada (reemplazar opcional)">
                    <Input name="coverImageFile" type="file" accept="image/*" className="cursor-pointer" />
                  </InputField>
                  <InputField label="Descripción" className="lg:col-span-2">
                    <Textarea name="description" rows={3} defaultValue={category.description ?? ""} />
                  </InputField>
                  <Button type="submit" className="w-full rounded-full">
                    Guardar cambios
                  </Button>
                </form>

                <form action={deleteCategoryAction} className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-muted-foreground">
                    Eliminarás esta categoría y todos los productos asociados.
                  </p>
                  <input type="hidden" name="id" value={category.id} />
                  <Button type="submit" variant="destructive" className="w-full rounded-full">
                    Eliminar categoría
                  </Button>
                </form>
              </div>
            </details>
          ))}
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
