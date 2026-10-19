"use client";

import {
  ImageIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: {
    id: number;
    name: string;
    slug: string;
    highlightColor: string | null;
    coverImageUrl: string | null;
    displayOrder: number;
    productCount: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  return (
    <div className="group flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="truncate font-heading text-base text-foreground">
            {category.name}
          </h3>
          <span className="inline-flex items-center rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground tabular-nums">
            #{category.displayOrder}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Acciones de ${category.name}`}
              className="-mr-2 -mt-2 opacity-60 transition group-hover:opacity-100"
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onSelect={onEdit}>
              <PencilIcon className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-1 items-stretch gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted">
          {category.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-full w-full items-center justify-center text-primary-foreground"
              style={{
                backgroundColor: category.highlightColor ?? "var(--muted)",
              }}
            >
              <ImageIcon
                className={cn(
                  "size-6",
                  category.highlightColor ? "opacity-80" : "text-muted-foreground opacity-100",
                )}
              />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <p className="truncate font-mono text-xs text-muted-foreground">
            /{category.slug}
          </p>
          <p className="text-sm text-foreground tabular-nums">
            <span className="font-semibold">{category.productCount}</span>{" "}
            <span className="text-muted-foreground">
              producto{category.productCount === 1 ? "" : "s"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
