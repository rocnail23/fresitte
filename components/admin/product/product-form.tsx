"use client";

import * as React from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { z } from "zod";
import { Loader2Icon, TagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { SectionHeading } from "@/components/admin/section-heading";
import { ImageDropzone } from "@/components/admin/product/image-dropzone";
import { ChipInput } from "@/components/admin/product/chip-input";
import { slugify } from "@/lib/slugify";

export interface CategoryOption {
  id: number;
  name: string;
}

export interface ProductFormValues {
  id?: number;
  name?: string;
  slug?: string;
  price?: number; // dollars
  stock?: number;
  summary?: string | null;
  description?: string | null;
  sizes?: string[];
  isVisible?: boolean;
  isFeatured?: boolean;
  categoryIds?: number[];
  imageUrl?: string | null;
}

interface ProductFormProps {
  mode: "create" | "edit";
  action: (formData: FormData) => Promise<void>;
  categoryList: CategoryOption[];
  initialValues?: ProductFormValues;
  /** Optional callback invoked when the form is canceled. */
  onCancel?: () => void;
  /** Hide the page wrapper; useful inside a Drawer. */
  bare?: boolean;
  /** Navigate-to href for the cancel button (used when no onCancel callback). */
  cancelHref?: string;
}

const clientSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  categoryIds: z
    .array(z.number().int().positive())
    .min(1, "Selecciona al menos una categoría."),
  price: z.coerce
    .number({ error: "Ingresa un precio válido." })
    .positive("El precio debe ser mayor a cero."),
  stock: z.coerce
    .number({ error: "Ingresa un stock válido." })
    .int()
    .min(0, "El stock no puede ser negativo.")
    .default(0),
  summary: z
    .string()
    .max(140, "Máximo 140 caracteres.")
    .optional()
    .or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

type FieldErrors = Partial<
  Record<
    "name" | "categoryIds" | "price" | "stock" | "summary" | "image",
    string
  >
>;

interface FormState {
  errors: FieldErrors;
  message?: string;
}

const initialState: FormState = { errors: {} };

const formatSize = (token: string) => token.toUpperCase();

export function ProductForm({
  mode,
  action,
  categoryList,
  initialValues,
  onCancel,
  bare = false,
  cancelHref,
}: ProductFormProps) {
  const [name, setName] = React.useState(initialValues?.name ?? "");
  const [slugManual, setSlugManual] = React.useState(
    Boolean(initialValues?.slug),
  );
  const [slug, setSlug] = React.useState(initialValues?.slug ?? "");
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<
    number[]
  >(initialValues?.categoryIds ?? []);
  const [sizes, setSizes] = React.useState<string[]>(
    (initialValues?.sizes ?? []).map(formatSize),
  );
  const [isVisible, setIsVisible] = React.useState(
    initialValues?.isVisible ?? true,
  );
  const [isFeatured, setIsFeatured] = React.useState(
    Boolean(initialValues?.isFeatured),
  );
  const [summary, setSummary] = React.useState<string>(
    initialValues?.summary ?? "",
  );
  const [state, setState] = React.useState<FormState>(initialState);

  const autoSlug = React.useMemo(() => slugify(name), [name]);
  const finalSlug = slugManual ? slug.trim() || autoSlug : autoSlug;

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const parsed = clientSchema.safeParse({
      name: formData.get("name"),
      categoryIds: selectedCategoryIds,
      price: formData.get("price"),
      stock: formData.get("stock"),
      summary: formData.get("summary") ?? "",
      description: formData.get("description") ?? "",
    });

    if (!parsed.success) {
      event.preventDefault();
      const flat = parsed.error.flatten().fieldErrors;
      setState({
        errors: {
          name: flat.name?.[0],
          categoryIds: flat.categoryIds?.[0],
          price: flat.price?.[0],
          stock: flat.stock?.[0],
          summary: flat.summary?.[0],
        },
      });
      return;
    }

    setState({ errors: {} });
    // The <form action={action}> takes over for the actual submit.
  };

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col gap-8",
        !bare &&
          "rounded-3xl border border-border/60 bg-card/95 p-6 shadow-sm lg:p-8",
      )}
      noValidate
    >
      {/* Hidden fields */}
      {mode === "edit" && initialValues?.id ? (
        <input type="hidden" name="id" value={initialValues.id} />
      ) : null}
      <input type="hidden" name="slug" value={finalSlug} />
      <input type="hidden" name="isVisible" value={isVisible ? "on" : ""} />
      <input
        type="hidden"
        name="isFeatured"
        value={isFeatured ? "on" : ""}
      />
      {selectedCategoryIds.map((id) => (
        <input key={id} type="hidden" name="categoryIds" value={id} />
      ))}

      {/* ── Identidad ──────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeading
          title="Identidad"
          description="Nombre, slug y categorías del producto."
          badge={
            <Badge variant="outline" className="text-[10px] uppercase">
              obligatorio
            </Badge>
          }
        />
        <FieldGroup
          label="Nombre"
          htmlFor="name"
          error={state.errors.name}
          required
        >
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Vestido Garden Party"
            required
          />
        </FieldGroup>

        <FieldGroup label="Slug" htmlFor="slug" hint={`/${finalSlug || "…"}`}>
          {!slugManual ? (
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-muted/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="truncate font-mono text-foreground">
                {finalSlug || "—"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSlugManual(true);
                  setSlug(autoSlug);
                }}
                className="self-start text-xs font-semibold uppercase tracking-widest text-primary hover:underline sm:self-auto"
              >
                Personalizar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="vestido-garden-party"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSlugManual(false);
                  setSlug(autoSlug);
                }}
              >
                Auto
              </Button>
            </div>
          )}
        </FieldGroup>

        <FieldGroup
          label="Categorías"
          error={state.errors.categoryIds}
          description="Selecciona al menos una colección."
        >
          {categoryList.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Aún no hay categorías. Crea una en /admin/categories primero.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categoryList.map((category) => {
                const active = selectedCategoryIds.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <TagIcon className="size-3" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          )}
        </FieldGroup>
      </section>

      {/* ── Precio e inventario ────────────────────────── */}
      <section className="space-y-5">
        <SectionHeading
          title="Precio e inventario"
          description="Define precio, stock y tallas disponibles."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldGroup
            label="Precio (EUR)"
            htmlFor="price"
            error={state.errors.price}
            required
          >
            <Input
              id="price"
              name="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              defaultValue={initialValues?.price ?? ""}
              placeholder="34.00"
              required
            />
          </FieldGroup>
          <FieldGroup
            label="Stock disponible"
            htmlFor="stock"
            error={state.errors.stock}
          >
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              defaultValue={initialValues?.stock ?? 1}
            />
          </FieldGroup>
        </div>
        <FieldGroup
          label="Tallas disponibles"
          hint="Separa con coma o Enter. Pega ‘2A, 3A, 4A’ para añadir varias."
        >
          <ChipInput
            name="sizes"
            value={sizes}
            onChange={setSizes}
            format={formatSize}
            placeholder="2A, 3A…"
          />
        </FieldGroup>
      </section>

      {/* ── Contenido ──────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeading
          title="Contenido"
          description="Resumen y descripción del producto."
        />
        <FieldGroup
          label="Resumen"
          htmlFor="summary"
          error={state.errors.summary}
          description={`${summary.length} / 140 caracteres.`}
        >
          <Input
            id="summary"
            name="summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Algodón orgánico + cinturón ajustable"
            maxLength={140}
          />
        </FieldGroup>
        <FieldGroup label="Descripción" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            rows={6}
            defaultValue={initialValues?.description ?? ""}
            placeholder="Describe materiales, cuidados, detalles..."
          />
        </FieldGroup>
      </section>

      {/* ── Visibilidad ────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeading
          title="Visibilidad"
          description="Configura cómo aparece el producto en el storefront."
        />
        <SwitchRow
          id="isVisible"
          label="Mostrar en catálogo"
          description="Si está apagado, el producto no será visible para clientes."
          checked={isVisible}
          onCheckedChange={setIsVisible}
        />
        <SwitchRow
          id="isFeatured"
          label="Marcar como destacado"
          description="Aparece en la sección principal del storefront."
          checked={isFeatured}
          onCheckedChange={setIsFeatured}
        />
      </section>

      {/* ── Media ──────────────────────────────────────── */}
      <section className="space-y-5">
        <SectionHeading
          title="Media"
          description="Imagen principal. Se sube a R2 al guardar."
        />
        <ImageDropzone
          name="imageFile"
          preview={initialValues?.imageUrl ?? null}
        />
        {state.errors.image ? (
          <p className="text-xs font-medium text-destructive">
            {state.errors.image}
          </p>
        ) : null}
      </section>

      {/* Sticky footer */}
      <div
        className={cn(
          "sticky bottom-0 -mx-6 flex flex-col-reverse gap-3 border-t border-border/60 bg-card/95 px-6 py-4 backdrop-blur lg:bottom-auto lg:flex-row lg:items-center lg:justify-between lg:bg-transparent lg:backdrop-blur-0",
          bare && "border-border/60",
        )}
      >
        <p className="text-xs text-muted-foreground">
          Los cambios se guardan al pulsar Guardar.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {onCancel || cancelHref ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="rounded-full px-5"
              {...(onCancel
                ? {}
                : { asChild: true as const })}
            >
              {onCancel ? (
                "Cancelar"
              ) : (
                <Link href={cancelHref ?? "#"}>Cancelar</Link>
              )}
            </Button>
          ) : null}
          <SubmitButton
            label={mode === "create" ? "Guardar producto" : "Guardar cambios"}
          />
        </div>
      </div>
    </form>
  );
}

function FieldGroup({
  label,
  htmlFor,
  error,
  description,
  hint,
  children,
  required,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
          {label}
          {required ? <span className="text-destructive">*</span> : null}
        </Label>
        {hint ? (
          <span className="font-mono text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background/60 p-4">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      data-pending={pending ? "true" : undefined}
      className="rounded-full px-5"
    >
      {pending ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          Guardando…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

