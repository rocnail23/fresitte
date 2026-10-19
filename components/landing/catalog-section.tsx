import Link from "next/link";
import { X } from "lucide-react";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import type { CatalogProduct } from "@/components/catalog/product-card";
import type { FilterOption } from "@/components/catalog/product-filters";

interface CatalogSectionProps {
  products: CatalogProduct[];
  categories: FilterOption[];
  sizeOptions: FilterOption[];
  totalItems: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  selectedCategory: string;
  selectedSize: string;
  searchTerm: string;
  whatsappNumber: string | null;
}

export function CatalogSection(props: CatalogSectionProps) {
  const empty = props.products.length === 0;
  const whatsappHref = props.whatsappNumber
    ? `https://wa.me/${props.whatsappNumber.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <section
      id="catalogo"
      aria-label="Catálogo"
      className="py-6 md:py-8"
    >
      <div className="mx-auto w-full max-w-[1600px] px-3 md:px-4">
        {empty ? (
          <EmptyState
            hasActiveFilters={
              Boolean(props.selectedCategory) ||
              Boolean(props.selectedSize) ||
              Boolean(props.searchTerm)
            }
            whatsappHref={whatsappHref}
          />
        ) : (
          <CatalogGrid
            products={props.products}
            categories={props.categories}
            sizeOptions={props.sizeOptions}
            whatsappNumber={props.whatsappNumber}
            pagination={{
              currentPage: props.currentPage,
              totalPages: props.totalPages,
              pageSize: props.pageSize,
              totalItems: props.totalItems,
            }}
            selectedCategory={props.selectedCategory}
            selectedSize={props.selectedSize}
            searchTerm={props.searchTerm}
          />
        )}
      </div>
    </section>
  );
}

function EmptyState({
  hasActiveFilters,
  whatsappHref,
}: {
  hasActiveFilters: boolean;
  whatsappHref: string | null;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-dashed border-fresitte-cocoa/20 bg-white/80 px-6 py-12 text-center md:py-16">
      <p className="font-heading text-2xl leading-tight text-fresitte-cocoa md:text-3xl">
        No hay piezas con esta combinación.
      </p>
      <p className="text-[0.95rem] leading-[1.55] text-fresitte-cocoa/70">
        {hasActiveFilters
          ? "Quita uno o más filtros para ver el catálogo completo, o escríbenos y te ayudamos a encontrar la prenda."
          : "Vuelve pronto, estamos recibiendo piezas nuevas. Mientras tanto escríbenos y te avisamos."}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {hasActiveFilters ? (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-fresitte-coral px-5 py-2.5 text-sm font-semibold text-cream shadow-[0_2px_0_0_var(--fresitte-coral-strong)] transition hover:translate-y-[1px] hover:bg-[color:var(--fresitte-coral-strong)] hover:shadow-none"
          >
            <X className="h-4 w-4" />
            Quitar todos los filtros
          </Link>
        ) : null}
        {whatsappHref ? (
          <Link
            href={whatsappHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-fresitte-cocoa/15 bg-transparent px-5 py-2.5 text-sm font-semibold text-fresitte-cocoa transition hover:border-fresitte-cocoa/30 hover:bg-fresitte-cocoa/5"
          >
            Escribir por WhatsApp
          </Link>
        ) : null}
      </div>
    </div>
  );
}
