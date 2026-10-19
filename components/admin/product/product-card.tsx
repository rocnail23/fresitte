"use client";

import { useState, useTransition } from "react";
import {
  CopyIcon,
  EyeOffIcon,
  MoreHorizontalIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { formatPriceFromCents } from "@/lib/slugify";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    priceCents: number;
    currency: string | null;
    stock: number;
    summary: string | null;
    imageUrl: string | null;
    isVisible: boolean;
    isFeatured: boolean;
    sizes: string | null;
    categoryNames: string[];
  };
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ProductCard({
  product,
  onEdit,
  onDuplicate,
  onDelete,
}: ProductCardProps) {
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<"duplicate" | null>(null);

  const price = formatPriceFromCents(product.priceCents, product.currency);

  const handleDuplicate = () => {
    setBusyAction("duplicate");
    startTransition(() => {
      try {
        onDuplicate();
      } finally {
        setBusyAction(null);
      }
    });
  };

  return (
    <div
      className={cn(
        "group flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/40 hover:bg-card",
        !product.isVisible && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="truncate font-heading text-base text-foreground">
            {product.name}
          </h3>
          {product.isFeatured ? (
            <Badge variant="default" className="gap-1">
              <StarIcon className="size-3" />
              Destacado
            </Badge>
          ) : null}
          {!product.isVisible ? (
            <Badge variant="secondary" className="gap-1">
              <EyeOffIcon className="size-3" />
              Oculto
            </Badge>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Acciones del producto"
              className="-mr-2 -mt-2"
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onSelect={onEdit}>
              <PencilIcon className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={handleDuplicate}
              disabled={isPending && busyAction === "duplicate"}
            >
              <CopyIcon className="size-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-stretch gap-4">
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[0.6rem] font-medium uppercase tracking-widest text-muted-foreground">
              {product.name.slice(0, 2)}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">
            {product.categoryNames.length
              ? product.categoryNames.join(" · ")
              : "Sin categoría"}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{price}</span>
            <span>·</span>
            <span>Stock {product.stock}</span>
            {product.sizes ? (
              <>
                <span>·</span>
                <span className="truncate">Tallas {product.sizes}</span>
              </>
            ) : null}
          </div>
          {product.summary ? (
            <p className="line-clamp-2 text-xs text-muted-foreground/80">
              {product.summary}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}