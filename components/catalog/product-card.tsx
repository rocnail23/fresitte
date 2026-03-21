"use client";

import Image from "next/image";
import { ShoppingBag, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  categoryValue?: string;
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
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const price = new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: product.currency ?? "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(product.price);

  const isLowStock = product.stock > 0 && product.stock <= 5;
  return (
    <article className="flex h-full flex-col rounded-[28px] border  border-white/80 bg-white/85 p-4 shadow-lg shadow-primary/5 backdrop-blur transition hover:-translate-y-1 sm:rounded-[32px] sm:p-5">
      <div className="relative overflow-hidden rounded-[22px] border border-white/60 bg-linear-to-tr from-white via-white to-primary/10 sm:rounded-3xl">
        {product.imageUrl ? (
          <div className="relative aspect-square h-auto ">
            <Image
              src={product.imageUrl}
              alt={product.name}
              loading="eager"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-black/0" />
          </div>
        ) : (
          <div className="h-64 w-full" />
        )}
        <div className="absolute left-0 top-0 flex w-full items-start justify-between px-4 py-3">
          <Badge variant="secondary" className="bg-white/80 text-primary">
            {product.category}
          </Badge>
          {product.label ? (
            <Badge variant="outline" className="border-dashed border-primary/40 bg-white/90 text-primary">
              {product.label}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-2">
        <h3 className="font-heading text-xl text-foreground sm:text-2xl">{product.name}</h3>
        <p className="text-xs h-[15px] text-muted-foreground line-clamp-2 sm:text-sm">{product.description}</p>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-medium font-heading text-foreground sm:text-2xl">{price}</span>
          <span
            className={cn("text-xs font-semibold uppercase tracking-[0.2em]", {
              "text-green-600": product.stock > 5,
              "text-amber-600": isLowStock,
              "text-destructive": product.stock === 0,
            })}
          >
            {product.stock === 0
              ? "Sin stock"
              : isLowStock
                ? `Quedan ${product.stock}`
                : "Disponible"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
          {product.sizes.map((size) => (
            <Badge
              key={size}
              className="rounded-full font-medium border border-muted px-2.5 py-1 "
            >
              {size}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 sm:mt-6">
        <Button
          variant="outline"
          className="flex-1 rounded-full border-primary/40 px-4 py-5 text-sm text-primary hover:bg-primary/10 sm:text-base"
          onClick={() => onAddToCart?.(product)}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Agregar
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
