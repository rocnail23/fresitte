"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  selectedCategory: string;
  search: string;
  onUpdate: (filters: {
    category?: string;
    search?: string;
  }) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  totalResults?: number;
}

export type FilterSheetProps = ProductFiltersProps;

function CategoryRow({
  categories,
  selectedCategory,
  onUpdate,
}: {
  categories: FilterOption[];
  selectedCategory: string;
  onUpdate: (category: string) => void;
}) {
  return (
    <div className="flex flex-1 min-w-0 gap-1.5 overflow-x-auto snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        aria-pressed={!selectedCategory}
        onClick={() => onUpdate("")}
        className={cn(
          "shrink-0 snap-start min-h-[40px] sm:min-h-[32px] rounded-full border px-4 sm:px-2.5 py-1.5 sm:py-1 text-sm font-medium transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          !selectedCategory
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted bg-white/80 text-muted-foreground hover:border-primary/20 hover:text-foreground",
        )}
      >
        Todas
      </button>
      {categories.map((category) => {
        const isActive = selectedCategory === category.value;
        const useCategoryColor = isActive && Boolean(category.color);
        return (
          <button
            key={category.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onUpdate(category.value)}
            className={cn(
              "shrink-0 snap-start min-h-[40px] sm:min-h-[32px] rounded-full border px-4 sm:px-2.5 py-1.5 sm:py-1 text-sm font-medium transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              isActive
                ? useCategoryColor
                  ? "border-transparent"
                  : "border-primary bg-primary text-primary-foreground"
                : "border-muted bg-white/80 text-muted-foreground hover:border-primary/20 hover:text-foreground",
            )}
            style={
              useCategoryColor
                ? { backgroundColor: category.color, color: "#1a120c" }
                : undefined
            }
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

export interface FilterSearchBarProps {
  search: string;
  onUpdate: (next: string) => void;
}

export function FilterSearchBar({ search, onUpdate }: FilterSearchBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="relative shrink-0 sm:flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder="Buscar producto..."
        value={search}
        onChange={(event) => onUpdate(event.target.value)}
        aria-label="Buscar producto"
        className="rounded-full border-primary/20 bg-white/95 pl-10 pr-10 h-11 sm:h-10 text-base sm:text-sm"
      />
      {search ? (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            onUpdate("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/70"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export interface InlineFiltersProps {
  categories: FilterOption[];
  selectedCategory: string;
  search: string;
  previewCount?: number;
  onUpdate: (filters: {
    category?: string;
    search?: string;
  }) => void;
}

export function InlineFilters({
  categories,
  selectedCategory,
  search,
  previewCount = 3,
  onUpdate,
}: InlineFiltersProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  // Build the visible chips so the active option is always shown, even when
  // it lives past the previewCount slot — it replaces the last preview item
  // instead of being added (so the row never grows past N+1 entries).
  const previewCategories = useMemo(() => {
    const preview = categories.slice(0, previewCount);
    if (!selectedCategory) return preview;
    if (preview.some((c) => c.value === selectedCategory)) return preview;
    const active = categories.find((c) => c.value === selectedCategory);
    if (!active) return preview;
    return [...preview.slice(0, -1), active];
  }, [categories, previewCount, selectedCategory]);

  const hasOverflow = categories.length > previewCount;

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <FilterSearchBar
          search={search}
          onUpdate={(value) => onUpdate({ search: value })}
        />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cat.
            </span>
            <div className="min-w-0 flex-1">
              <CategoryRow
                categories={previewCategories}
                selectedCategory={selectedCategory}
                onUpdate={(category) => onUpdate({ category })}
              />
            </div>
          </div>
          {hasOverflow ? (
            <div className="flex justify-start">
              <Button
                type="button"
                size="sm"
                onClick={() => setMoreOpen(true)}
                className="h-7 shrink-0 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Más categorías
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <MoreFiltersSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        categories={categories}
        selectedCategory={selectedCategory}
        onUpdate={onUpdate}
      />
    </>
  );
}

function MoreFiltersSheetContent({
  categories,
  selectedCategory,
  onUpdate,
}: Pick<
  ProductFiltersProps,
  "categories" | "selectedCategory" | "onUpdate"
>) {
  return (
    <div className="flex flex-col gap-6 pt-4 safe-bottom">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Categoría</p>
        <CategoryRow
          categories={categories}
          selectedCategory={selectedCategory}
          onUpdate={(category) => onUpdate({ category })}
        />
      </div>
    </div>
  );
}

function MoreFiltersSheet({
  open,
  onOpenChange,
  categories,
  selectedCategory,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: FilterOption[];
  selectedCategory: string;
  onUpdate: (filters: { category?: string }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const compute = () => {
      const offsetTop = viewport.offsetTop;
      const viewportHeight = viewport.height;
      const keyboardOpen = viewportHeight < window.innerHeight * 0.75;
      if (!keyboardOpen) {
        setMaxHeight(null);
        return;
      }
      const remaining = Math.max(0, offsetTop + viewportHeight);
      setMaxHeight(Math.round(remaining));
    };

    compute();
    viewport.addEventListener("resize", compute);
    viewport.addEventListener("scroll", compute);
    window.addEventListener("resize", compute);
    return () => {
      viewport.removeEventListener("resize", compute);
      viewport.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className="rounded-t-3xl px-5 pb-6 max-h-[85vh] overflow-hidden safe-bottom"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <div
          ref={containerRef}
          style={
            maxHeight
              ? { maxHeight: `${maxHeight}px`, height: `${maxHeight}px` }
              : undefined
          }
          className="flex flex-col"
        >
          <SheetHeader className="border-b border-muted/60 pb-3">
            <SheetTitle>Todas las opciones</SheetTitle>
            <SheetDescription>
              Explora todas las categorías
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <MoreFiltersSheetContent
              categories={categories}
              selectedCategory={selectedCategory}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ProductFilters({
  categories,
  selectedCategory,
  search,
  onUpdate,
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
    return null;
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
      <FilterSearchBar
        search={search}
        onUpdate={(value) => onUpdate({ search: value })}
      />
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Categoría</p>
        <CategoryRow
          categories={categories}
          selectedCategory={selectedCategory}
          onUpdate={(category) => onUpdate({ category })}
        />
      </div>
    </div>
  );
}