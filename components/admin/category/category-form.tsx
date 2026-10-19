"use client";

import * as React from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Loader2Icon, PencilIcon } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { SectionHeading } from "@/components/admin/section-heading";
import { ImageDropzone } from "@/components/admin/product/image-dropzone";
import { slugify } from "@/lib/slugify";

export interface CategoryFormValues {
  id?: number;
  name?: string;
  slug?: string;
  highlightColor?: string;
  displayOrder?: number;
  description?: string | null;
  coverImageUrl?: string | null;
}

interface CategoryFormProps {
  mode: "create" | "edit";
  action: (formData: FormData) => Promise<void>;
  initialValues?: CategoryFormValues;
  onCancel?: () => void;
  bare?: boolean;
  cancelHref?: string;
}

const clientSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres."),
  displayOrder: z.coerce
    .number({ error: "Ingresa un número válido." })
    .int()
    .min(0, "El orden no puede ser negativo.")
    .default(0),
});

type FieldErrors = Partial<
  Record<"name" | "displayOrder" | "color", string>
>;

export function CategoryForm({
  mode,
  action,
  initialValues,
  onCancel,
  bare = false,
  cancelHref,
}: CategoryFormProps) {
  const [name, setName] = React.useState(initialValues?.name ?? "");
  const [slugManual, setSlugManual] = React.useState(
    Boolean(initialValues?.slug),
  );
  const [slug, setSlug] = React.useState(initialValues?.slug ?? "");
  const [color, setColor] = React.useState(
    initialValues?.highlightColor ?? "#ff6464",
  );
  const [errors, setErrors] = React.useState<FieldErrors>({});

  const autoSlug = React.useMemo(() => slugify(name), [name]);
  const finalSlug = slugManual ? slug.trim() || autoSlug : autoSlug;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const parsed = clientSchema.safeParse({
      name: formData.get("name"),
      displayOrder: formData.get("displayOrder"),
    });

    if (!parsed.success) {
      event.preventDefault();
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        name: flat.name?.[0],
        displayOrder: flat.displayOrder?.[0],
      });
      return;
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      event.preventDefault();
      setErrors((prev) => ({
        ...prev,
        color: "Color inválido. Usa un valor hexadecimal (#RRGGBB).",
      }));
      return;
    }

    setErrors({});
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
      {mode === "edit" && initialValues?.id ? (
        <input type="hidden" name="id" value={initialValues.id} />
      ) : null}
      <input type="hidden" name="slug" value={finalSlug} />

      <section className="space-y-5">
        <SectionHeading
          title="Identidad"
          description="Nombre, slug y color destacado."
        />
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold text-foreground">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mini Picnic"
            required
          />
          {errors.name ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="slug" className="text-sm font-semibold text-foreground">
              Slug
            </Label>
            <span className="font-mono text-xs text-muted-foreground">
              /{finalSlug || "…"}
            </span>
          </div>
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
                className="self-start inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-primary hover:underline sm:self-auto"
              >
                <PencilIcon className="size-3" />
                Personalizar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="mini-picnic"
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
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">
            Color destacado
          </Label>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              aria-label="Color destacado"
              className="h-10 w-12 cursor-pointer rounded-md border border-input bg-transparent p-0"
            />
            <div
              className="flex h-10 min-w-32 items-center gap-2 rounded-md px-3 text-sm font-medium text-primary-foreground shadow-inner"
              style={{ backgroundColor: color }}
            >
              <span className="font-mono text-xs uppercase">{color}</span>
            </div>
            <input type="hidden" name="highlightColor" value={color} />
          </div>
          {errors.color ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.color}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="displayOrder"
            className="text-sm font-semibold text-foreground"
          >
            Orden de despliegue
          </Label>
          <Input
            id="displayOrder"
            name="displayOrder"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues?.displayOrder ?? 0}
          />
          {errors.displayOrder ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.displayOrder}
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading title="Contenido" description="Descripción opcional." />
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-sm font-semibold text-foreground"
          >
            Descripción
          </Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={initialValues?.description ?? ""}
            placeholder="Cuenta una historia breve sobre la colección."
          />
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          title="Imagen de portada"
          description="Aparece en el storefront al explorar la categoría."
        />
        <ImageDropzone
          name="coverImageFile"
          preview={initialValues?.coverImageUrl ?? null}
          hint="Tamaño recomendado 1200x800. Máx. 5 MB."
        />
      </section>

      <div
        className={cn(
          "sticky bottom-0 -mx-6 flex flex-col-reverse gap-3 border-t border-border/60 bg-card/95 px-6 py-4 backdrop-blur lg:bottom-auto lg:flex-row lg:items-center lg:justify-between lg:bg-transparent lg:backdrop-blur-0",
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
            label={mode === "create" ? "Guardar categoría" : "Guardar cambios"}
          />
        </div>
      </div>
    </form>
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
