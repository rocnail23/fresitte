"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

export interface ProductFiltersProps {
  categories: FilterOption[];
  sizes: FilterOption[];
  selectedCategory: string;
  selectedSizes: string[];
  search: string;
  onUpdate: (filters: {
    category?: string;
    sizes?: string[];
    search?: string;
  }) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  totalResults?: number;
}

export type FilterSheetProps = ProductFiltersProps;

function FilterPanel({
  categories,
  sizes,
  selectedCategory,
  selectedSizes,
  search,
  onUpdate,
}: ProductFiltersProps) {
  const handleToggleSize = (value: string) => {
    const isSelected = selectedSizes[0] === value;
    const next = isSelected ? [] : [value];
    onUpdate({ sizes: next });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Buscar producto</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Body fresa, conjunto, talla..."
            value={search}
            onChange={(event) => onUpdate({ search: event.target.value })}
            className="rounded-full border-primary/20 bg-white/80 pl-10 pr-10 h-11"
          />
          {search ? (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => onUpdate({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Categoría</p>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
          {categories.map((category) => {
            const isActive = selectedCategory === category.value;
            return (
              <button
                key={category.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onUpdate({ category: category.value })}
                className={cn(
                  "shrink-0 snap-start min-h-[40px] rounded-full px-4 py-2 text-sm font-medium transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                )}
              >
                <Badge
                  variant={isActive ? "default" : "outline"}
                  className={cn("rounded-full px-3.5 py-1.5 text-sm", {
                    "bg-primary text-primary-foreground": isActive,
                  })}
                  style={
                    isActive && category.color
                      ? { backgroundColor: category.color, color: "#1a120c" }
                      : undefined
                  }
                >
                  {category.label}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Tallas</p>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
          {sizes.map((size) => {
            const isActive = selectedSizes.includes(size.value);
            return (
              <button
                key={size.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleToggleSize(size.value)}
                className={cn(
                  "shrink-0 snap-start min-h-[40px] rounded-full border px-4 py-2 text-sm font-semibold transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-muted bg-white/80 text-foreground hover:border-primary/20",
                )}
              >
                {size.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ProductFilters({
  categories,
  sizes,
  selectedCategory,
  selectedSizes,
  search,
  onUpdate,
  isOpen,
  onOpenChange,
  totalResults,
}: ProductFiltersProps) {
  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategory) return "Todas";
    return categories.find((c) => c.value === selectedCategory)?.label ?? "Todas";
  }, [categories, selectedCategory]);

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);

  if (!isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton
          className="rounded-t-3xl px-5 pb-6 max-h-[85vh] overflow-y-auto safe-bottom"
        >
          <SheetHeader className="border-b border-muted/60 pb-3">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>
              {typeof totalResults === "number"
                ? `${totalResults} estilos disponibles`
                : "Encuentra tu estilo ideal"}
            </SheetDescription>
          </SheetHeader>
          <div className="pt-4">
            <FilterPanel
              categories={categories}
              sizes={sizes}
              selectedCategory={selectedCategory}
              selectedSizes={selectedSizes}
              search={search}
              onUpdate={onUpdate}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl shadow-primary/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Catálogo Fresitte
          </p>
          <h1 className="font-heading text-3xl text-foreground">
            {selectedCategoryLabel}
          </h1>
        </div>
      </div>
      <FilterPanel
        categories={categories}
        sizes={sizes}
        selectedCategory={selectedCategory}
        selectedSizes={selectedSizes}
        search={search}
        onUpdate={onUpdate}
      />
    </div>
  );
}

export function FilterSheet(props: FilterSheetProps) {
  const { categories, sizes, selectedCategory, selectedSizes, search, onUpdate } = props;

  return (
    <Sheet open={props.isOpen} onOpenChange={props.onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className="rounded-t-3xl px-5 pb-6 max-h-[85vh] overflow-y-auto safe-bottom"
      >
        <SheetHeader className="border-b border-muted/60 pb-3">
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>
            {typeof props.totalResults === "number"
              ? `${props.totalResults} estilos disponibles`
              : "Encuentra tu estilo ideal"}
          </SheetDescription>
        </SheetHeader>
        <div className="pt-4">
          <FilterPanel
            categories={categories}
            sizes={sizes}
            selectedCategory={selectedCategory}
            selectedSizes={selectedSizes}
            search={search}
            onUpdate={onUpdate}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}