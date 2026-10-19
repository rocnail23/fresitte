"use client";

import {
  ImageIcon,
  MoreHorizontalIcon,
  PencilIcon,
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
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="truncate font-heading text-base text-foreground">
            {category.name}
          </h3>
          <Badge variant="outline">#{category.displayOrder}</Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Acciones de la categoría"
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
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-stretch gap-4">
        <div
          className={cn(
            "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/40 text-primary-foreground",
          )}
          style={{
            backgroundColor: category.highlightColor || "var(--primary)",
          }}
        >
          {category.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.coverImageUrl}
              alt={category.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="size-6 opacity-80" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="font-mono text-xs text-muted-foreground">
            /{category.slug}
          </p>
          <p className="text-xs text-muted-foreground">
            {category.productCount} producto
            {category.productCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  );
}
