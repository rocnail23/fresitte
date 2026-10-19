"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Filter = "all" | "visible" | "hidden" | "featured";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "visible", label: "Visibles" },
  { value: "hidden", label: "Ocultos" },
  { value: "featured", label: "Destacados" },
];

export function ProductListToolbar({
  initialQuery,
  initialFilter,
}: {
  initialQuery: string;
  initialFilter: Filter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState(initialQuery);

  const buildHref = React.useCallback(
    (next: { q?: string; filter?: Filter }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.q === undefined) {
        if (params.has("q")) params.delete("q");
      } else {
        params.set("q", next.q);
      }
      if (next.filter === undefined) {
        if (params.has("filter")) params.delete("filter");
      } else {
        params.set("filter", next.filter);
      }
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  // Debounced search.
  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      if (query !== initialQuery) {
        router.replace(buildHref({ q: query, filter: initialFilter }));
      }
    }, 150);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const onSelectFilter = (filter: Filter) => {
    if (filter === initialFilter) return;
    const next = filter === "all" ? undefined : filter;
    router.replace(buildHref({ q: query, filter: next as Filter | undefined }));
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <label className="relative flex w-full items-center lg:max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre…"
          aria-label="Buscar productos"
          className="h-9 w-full rounded-full border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((option) => {
          const isActive = option.value === initialFilter;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectFilter(option.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
