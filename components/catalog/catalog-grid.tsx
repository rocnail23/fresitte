"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { ProductCard, type CatalogProduct } from "@/components/catalog/product-card";
import { ProductImageLightbox } from "@/components/catalog/product-image-lightbox";
import {
  InlineFilters,
  type FilterOption,
} from "@/components/catalog/product-filters";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CatalogGridProps {
  products: CatalogProduct[];
  categories: FilterOption[];
  whatsappNumber?: string | null;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
  selectedCategory?: string;
  searchTerm?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  quantity: number;
  stock: number;
}

export function CatalogGrid({
  products,
  categories,
  whatsappNumber,
  pagination,
  selectedCategory = "",
  searchTerm = "",
}: CatalogGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [pendingSearch, setPendingSearch] = useState(searchTerm);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setIsClient(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    setPendingSearch(searchTerm);
  }, [searchTerm]);

  const filteredProducts = products;

  const productMap = useMemo(() => {
    const map = new Map<string, CatalogProduct>();
    products.forEach((product) => map.set(product.id, product));
    return map;
  }, [products]);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const cartTotalLabel = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cartTotal);
  const sanitizedWhatsapp = useMemo(() => {
    if (!whatsappNumber) return null;
    const cleaned = whatsappNumber.replace(/[^+\d]/g, "");
    return cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
  }, [whatsappNumber]);

  const whatsappCheckoutUrl = useMemo(() => {
    if (!sanitizedWhatsapp || cartItems.length === 0) return null;
    const lines = cartItems
      .map((item) => {
        const lineTotal = new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 2,
        }).format(item.price * item.quantity);
        return `• ${item.quantity}× ${item.name} (${lineTotal})`;
      })
      .join("\n");
    const message = `Hola! Me interesa este pedido:\n${lines}\nTotal estimado: ${cartTotalLabel}`;
    return `https://wa.me/${sanitizedWhatsapp}?text=${encodeURIComponent(message)}`;
  }, [cartItems, cartTotalLabel, sanitizedWhatsapp]);

  const handleAddToCart = (product: CatalogProduct) => {
    setCartItems((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return items;
        return items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...items,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          imageUrl: product.imageUrl,
          quantity: 1,
          stock: product.stock,
        },
      ];
    });
    toast.success(`${product.name} agregado`, {
      description: "Sigue armando tu pedido o pídelo por WhatsApp",
      action: {
        label: "Ver carrito",
        onClick: () => setCartOpen(true),
      },
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const handleDecrease = (id: string) => {
    setCartItems((items) =>
      items
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item,
        )
        .filter((item): item is CartItem => item.quantity > 0),
    );
  };

  const handleIncrease = (id: string) => {
    const product = productMap.get(id);
    if (!product) return;
    handleAddToCart(product);
  };

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    return params.size ? `${pathname}?${params.toString()}` : pathname;
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("category");
    params.delete("search");
    params.delete("page");
    setPendingSearch("");
    const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      router.push(nextUrl, { scroll: true });
    });
  };

const hasActiveFilters = Boolean(selectedCategory) || Boolean(searchTerm);

  const pushSearch = useCallback(
    (value: string) => {
      setPendingSearch(value);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      const trimmed = value.trim();
      if (trimmed) {
        params.set("search", trimmed);
      } else {
        params.delete("search");
      }
      params.delete("page");
      const nextUrl = params.size
        ? `${pathname}?${params.toString()}`
        : pathname;
      startTransition(() => {
        router.push(nextUrl, { scroll: true });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  const pushFilters = useCallback(
    ({ category: nextCategory }: { category?: string }) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (typeof nextCategory === "string") {
        if (nextCategory) {
          params.set("category", nextCategory);
        } else {
          params.delete("category");
        }
      }

      params.delete("page");

      const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
      startTransition(() => {
        router.push(nextUrl, { scroll: true });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  return (
    <>
      {/* Inline filters: search + 3 categories always visible */}
      <InlineFilters
        categories={categories}
        selectedCategory={selectedCategory}
        search={pendingSearch}
        previewCount={3}
        onUpdate={({ category, search }) => {
          if (typeof category === "string") {
            pushFilters({ category });
          }
          if (typeof search === "string") {
            pushSearch(search);
          }
        }}
      />

      <section className="mt-3 rounded-3xl border border-white/80 bg-white/90 p-3 shadow-xl shadow-primary/10 sm:p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 py-2 border-b border-muted/60">
          <p className="text-xs text-muted-foreground">
            {filteredProducts.length} estilos
            {searchTerm ? ` para "${searchTerm}"` : ""}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </button>
          ) : null}
        </div>
        <div className="mt-5 grid grid-cols-2 items-stretch gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              priority={index < 2}
            />
          ))}
          {filteredProducts.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-muted bg-white/70 p-8 sm:p-10 text-center">
              <p className="font-heading text-xl sm:text-2xl text-foreground">
                No encontramos coincidencias
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ajusta los filtros o prueba con otra categoría.
              </p>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="mt-4 rounded-full border-primary/30 text-primary"
              >
                Limpiar filtros
              </Button>
            </div>
          ) : null}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-10 flex flex-col items-center gap-3 border-t border-muted/60 pt-6 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground tabular-nums">
              <span className="font-semibold text-foreground">
                Página {pagination.currentPage}
              </span>{" "}
              de {pagination.totalPages} · {pagination.totalItems} estilos en total
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                variant="outline"
                asChild
                disabled={pagination.currentPage <= 1}
                className="flex-1 rounded-full px-4 py-2 text-sm sm:flex-none"
              >
                <Link
                  href={buildPageHref(Math.max(1, pagination.currentPage - 1))}
                  scroll
                >
                  Anterior
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                disabled={pagination.currentPage >= pagination.totalPages}
                className="flex-1 rounded-full px-4 py-2 text-sm sm:flex-none"
              >
                <Link
                  href={buildPageHref(
                    Math.min(pagination.totalPages, pagination.currentPage + 1),
                  )}
                  scroll
                >
                  Siguiente
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {/* Cart FAB + sticky WhatsApp CTA */}
      {isClient && cartCount > 0 && whatsappCheckoutUrl ? (
        <div className="fixed left-4 right-4 z-40 bottom-[calc(env(safe-area-inset-bottom)+1rem)]">
          <a
            href={whatsappCheckoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="safe-bottom-tight flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-white py-3 px-5 text-center font-semibold shadow-2xl shadow-emerald-900/30 transition hover:bg-emerald-500"
          >
            <ShoppingBag className="h-5 w-5" />
            Pedir por WhatsApp · {cartTotalLabel}
          </a>
        </div>
      ) : null}

      {isClient ? (
        <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
          <SheetContent
            side="right"
            className="flex w-full max-w-lg flex-col gap-0 border-l border-primary/20 px-6 sm:px-8"
          >
            <SheetHeader className="space-y-1.5 border-b border-muted/60 px-0 pb-5 pt-6">
              <SheetTitle>Tu carrito</SheetTitle>
              <SheetDescription>
                {cartCount
                  ? `${cartCount} artículos listos para pagar`
                  : "Aún no agregas productos"}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-0 py-5">
              {cartItems.length ? (
                <ul className="flex flex-col gap-4">
                  {cartItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-4 rounded-2xl border border-muted/40 bg-white/90 p-5"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-muted/40 bg-muted">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium leading-snug text-foreground">
                            {item.name}
                          </p>
                          <p className="shrink-0 text-sm font-semibold text-foreground">
                            {new Intl.NumberFormat("es-ES", {
                              style: "currency",
                              currency: "EUR",
                              minimumFractionDigits: 2,
                            }).format(item.price * item.quantity)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat("es-ES", {
                            style: "currency",
                            currency: "EUR",
                            minimumFractionDigits: 2,
                          }).format(item.price)}
                          {` · Stock ${item.stock}`}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDecrease(item.id)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleIncrease(item.id)}
                              disabled={item.quantity >= item.stock}
                            >
                              +
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Quitar
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-muted bg-white/80 px-6 py-10 text-center text-sm text-muted-foreground">
                  Agrega tus estilos favoritos para verlos aquí.
                </div>
              )}
            </div>

            <SheetFooter className="gap-4 border-t border-muted/60 px-0 pb-6 pt-5 safe-bottom">
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-muted-foreground">Total estimado</p>
                <p className="text-2xl font-heading text-foreground">
                  {cartTotalLabel}
                </p>
              </div>
              {sanitizedWhatsapp ? (
                <Button
                  asChild
                  className="w-full rounded-full bg-emerald-600 py-6 text-base hover:bg-emerald-500"
                  disabled={!cartItems.length || !whatsappCheckoutUrl}
                >
                  <a
                    href={
                      cartItems.length ? whatsappCheckoutUrl ?? undefined : undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Enviar pedido por WhatsApp
                  </a>
                </Button>
              ) : (
                <Button className="w-full rounded-full bg-primary py-6 text-base" disabled>
                  Configura WHATSAPP_NUMBER
                </Button>
              )}
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                Abriremos WhatsApp con el resumen listo para que confirmes tu pedido.
              </p>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : null}

      {/* Floating cart button (only when no items — keeps low-noise empty state) */}
      {isClient && cartCount === 0 ? (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          aria-label="Abrir carrito"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          <ShoppingBag className="h-6 w-6" />
          <span className="sr-only">Abrir carrito</span>
        </button>
      ) : null}

      <ProductImageLightbox />
    </>
  );
}