"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
}

export function ProductFilters({
  categories,
  sizes,
  selectedCategory,
  selectedSizes,
  search,
  onUpdate,
}: ProductFiltersProps) {

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategory) return "Todas";
    return categories.find((c) => c.value === selectedCategory)?.label ?? "Todas";
  }, [categories, selectedCategory]);

  const handleToggleSize = (value: string) => {
    const isSelected = selectedSizes[0] === value;
    const next = isSelected ? [] : [value];
    onUpdate({ sizes: next });
  };

  const filterPanel = (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Buscar producto</p>
        <Input
          placeholder="Body fresa, conjunto, talla..."
          value={search}
          onChange={(event) => onUpdate({ search: event.target.value })}
          className="rounded-full border-primary/20 bg-white/80"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Categoría</p>
        <div className="flex flex-wrap gap-2">
      
          {categories.map((category) => (
            <Badge
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              className={cn("cursor-pointer rounded-full px-4 py-2", {
                "bg-primary text-primary-foreground": selectedCategory === category.value,
              })}
              style={
                selectedCategory === category.value && category.color
                  ? { backgroundColor: category.color, color: "#1a120c" }
                  : undefined
              }
              onClick={() => onUpdate({ category: category.value })}
            >
              {category.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Tallas</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => handleToggleSize(size.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                selectedSizes.includes(size.value)
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-muted text-foreground",
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 rounded-[36px] border border-white/70 bg-white/90 p-4 shadow-xl shadow-primary/10">
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
      {filterPanel}
    </div>
  );
}
