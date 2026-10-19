import Image from "next/image";
import { ShoppingBag, Sparkles, Expand } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { openProductLightbox } from "@/components/catalog/product-image-lightbox";

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  categoryValue?: string;
  categories?: { name: string; slug: string }[];
  description: string;
  price: number;
  currency?: string;
  stock: number;
  sizes: string[];
  imageUrl?: string;
  label?: string;
}

interface ProductCardProps {
  product: CatalogProduct;
  onAddToCart?: (product: CatalogProduct) => void;
  priority?: boolean;
}

export function ProductCard({ product, onAddToCart, priority }: ProductCardProps) {
  const price = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(product.price);

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const visibleSizes = product.sizes.slice(0, 5);
  const hiddenSizeCount = product.sizes.length - visibleSizes.length;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-sm shadow-primary/5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/15">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 transition group-hover:opacity-100" />
      <div className="relative overflow-hidden rounded-t-3xl border-b border-white/60 bg-linear-to-tr from-white via-white to-primary/10">
        {product.imageUrl ? (
          <button
            type="button"
            onClick={() =>
              openProductLightbox({
                images: [product.imageUrl as string],
                alt: product.name,
                productName: product.name,
                productId: product.id,
              })
            }
            aria-label={`Ampliar imagen de ${product.name}`}
            className="group/image relative block aspect-[4/5] w-full text-left"
          >
            <Image
              src={product.imageUrl}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition duration-500 group-hover/image:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-black/0" />
            <span className="pointer-events-none absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-foreground/80 opacity-0 shadow-md transition group-hover/image:opacity-100 sm:right-3 sm:top-3">
              <Expand className="h-4 w-4" />
            </span>
          </button>
        ) : (
          <div className="relative aspect-[4/5] w-full rounded-2xl bg-gradient-to-br from-primary/15 via-cream to-accent/15 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <div className="absolute left-0 top-0 flex w-full flex-wrap items-start justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="bg-white/85 text-primary border-white/70">
              {product.category}
            </Badge>
            {(product.categories ?? [])
              .slice(1)
              .map((category) => (
                <Badge
                  key={category.slug}
                  variant="outline"
                  className="border-white/70 bg-white/80 text-primary/80"
                >
                  {category.name}
                </Badge>
              ))}
          </div>
          {product.label ? (
            <Badge
              variant="outline"
              className="border-dashed border-primary/40 bg-white/90 text-primary"
            >
              {product.label}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div>
          <h3 className="font-heading text-base leading-tight text-foreground line-clamp-2 sm:text-lg">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {product.description}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <span className="font-heading text-xl text-foreground tabular-nums sm:text-2xl">
            {price}
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
              {
                "bg-emerald-500/15 text-emerald-700": product.stock > 5,
                "bg-amber-500/15 text-amber-700": isLowStock,
                "bg-destructive/15 text-destructive": product.stock === 0,
              },
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", {
                "bg-emerald-600": product.stock > 5,
                "bg-amber-500": isLowStock,
                "bg-destructive": product.stock === 0,
              })}
            />
            {product.stock === 0
              ? "Agotado"
              : isLowStock
                ? `Quedan ${product.stock}`
                : "En stock"}
          </span>
        </div>

        <div className="flex max-h-[2.5rem] flex-wrap gap-1.5 overflow-hidden">
          {visibleSizes.map((size) => (
            <Badge
              key={size}
              className="rounded-full border border-muted bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-foreground"
            >
              {size}
            </Badge>
          ))}
          {hiddenSizeCount > 0 ? (
            <Badge
              variant="outline"
              className="rounded-full border-muted bg-white/80 px-2.5 py-0.5 text-[11px] text-muted-foreground"
            >
              +{hiddenSizeCount}
            </Badge>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-2">
          <Button
            onClick={() => onAddToCart?.(product)}
            disabled={product.stock === 0}
            className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:shadow-md disabled:opacity-50 sm:text-base"
          >
            <ShoppingBag className="mr-1.5 h-4 w-4" />
            {product.stock === 0 ? "Agotado" : "Agregar"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
            aria-label="Marcar favorito"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}