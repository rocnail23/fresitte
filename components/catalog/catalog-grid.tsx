"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { ProductCard, type CatalogProduct } from "@/components/catalog/product-card";
import { ProductFilters, type FilterOption } from "@/components/catalog/product-filters";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface CatalogGridProps {
  products: CatalogProduct[];
  categories: FilterOption[];
  sizeOptions: FilterOption[];
  whatsappNumber?: string | null;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
  selectedCategory?: string;
  selectedSize?: string;
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
  sizeOptions,
  whatsappNumber,
  pagination,
  selectedCategory = "",
  selectedSize = "",
  searchTerm = "",
}: CatalogGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const selectedSizes = selectedSize ? [selectedSize] : [];
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
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCurrency = cartItems[0]?.currency ?? "USD";
  const cartTotalLabel = new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: cartCurrency,
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
        const lineTotal = new Intl.NumberFormat("es-US", {
          style: "currency",
          currency: item.currency ?? "USD",
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
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
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
    setCartOpen(true);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const handleDecrease = (id: string) => {
    setCartItems((items) =>
      items
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item,
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
    const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
    return nextUrl;
  };

  return (
    <>
      <ProductFilters
        categories={categories}
        sizes={sizeOptions}
        selectedCategory={selectedCategory}
        selectedSizes={selectedSizes}
        search={pendingSearch}
        onUpdate={({ category: nextCategory, sizes: nextSizes, search: nextSearch }) => {
          const params = new URLSearchParams(searchParams?.toString() ?? "");

          if (typeof nextCategory === "string") {
            if (nextCategory) {
              params.set("category", nextCategory);
            } else {
              params.delete("category");
            }
          }

          if (Array.isArray(nextSizes)) {
            const nextSize = nextSizes[0];
            if (nextSize) {
              params.set("size", nextSize);
            } else {
              params.delete("size");
            }
          }

          if (typeof nextSearch === "string") {
            setPendingSearch(nextSearch);
            const trimmed = nextSearch.trim();
            if (trimmed) {
              params.set("search", trimmed);
            } else {
              params.delete("search");
            }
          }

          params.delete("page");

          const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
          startTransition(() => {
            router.push(nextUrl, { scroll: true });
          });
        }}
      />

      {isClient ? (
        <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/30 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
              aria-label={cartCount ? `Abrir carrito (${cartCount} artículos)` : "Abrir carrito"}
            >
              <ShoppingBag className="h-6 w-6" />
              <span className="sr-only">Abrir carrito</span>
              {cartCount ? (
                <span className="absolute -top-1 -right-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/95 px-2 text-xs font-semibold text-primary">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </SheetTrigger>

          <SheetContent side="right" className="w-full max-w-lg space-y-0 border-l border-primary/20">
            <SheetHeader className="border-b border-muted/50 pb-4">
              <SheetTitle>Tu carrito</SheetTitle>
              <SheetDescription>
                {cartCount ? `${cartCount} artículos listos para pagar` : "Aún no agregas productos"}
              </SheetDescription>
            </SheetHeader>

          <div className="flex-1 px-2">
            {cartItems.length ? (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-2xl border border-muted/40 bg-white/90 p-4"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-muted/40 bg-muted">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat("es-US", {
                        style: "currency",
                        currency: item.currency ?? "USD",
                        minimumFractionDigits: 2,
                      }).format(item.price)}
                      {` · Stock ${item.stock}`}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleDecrease(item.id)}>
                        -
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleIncrease(item.id)}
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveFromCart(item.id)}>
                        Quitar
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {new Intl.NumberFormat("es-US", {
                      style: "currency",
                      currency: item.currency ?? "USD",
                      minimumFractionDigits: 2,
                    }).format(item.price * item.quantity)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-muted bg-white/80 p-8 text-center text-sm text-muted-foreground">
                Agrega tus estilos favoritos para verlos aquí.
              </div>
            )}
          </div>

          <SheetFooter className="border-t border-muted/50 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total estimado</p>
              <p className="text-xl font-heading text-foreground">{cartTotalLabel}</p>
            </div>
            {sanitizedWhatsapp ? (
              <Button
                asChild
                className="w-full rounded-full bg-emerald-600 py-6 text-base hover:bg-emerald-500"
                disabled={!cartItems.length || !whatsappCheckoutUrl}
              >
                <a
                  href={cartItems.length ? whatsappCheckoutUrl ?? undefined : undefined}
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
            <p className="text-center text-xs text-muted-foreground">
              Abriremos WhatsApp con el resumen listo para que confirmes tu pedido.
            </p>
          </SheetFooter>
        </SheetContent>
        </Sheet>
      ) : null}

      <section className="rounded-[40px] border border-white/70 bg-white/90 p-4 md:p-6 shadow-2xl shadow-primary/10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-muted pb-4">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} estilos
            {searchTerm ? ` para "${searchTerm}"` : " disponibles"}
          </p>
          <button
            type="button"
            className="text-sm font-semibold text-primary"
            onClick={() => {
              const params = new URLSearchParams(searchParams?.toString() ?? "");
              params.delete("category");
              params.delete("size");
              params.delete("search");
              params.delete("page");
              setPendingSearch("");
              const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
              startTransition(() => {
                router.push(nextUrl, { scroll: true });
              });
            }}
          >
            Limpiar filtros
          </button>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
          {filteredProducts.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-muted bg-white/70 p-10 text-center">
              <p className="font-heading text-2xl text-foreground">No encontramos coincidencias</p>
              <p className="text-sm text-muted-foreground">
                Ajusta los filtros o prueba con otra talla/categoría.
              </p>
            </div>
          ) : null}
        </div>

        {pagination ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              Página {pagination.currentPage} de {pagination.totalPages}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                asChild
                disabled={pagination.currentPage <= 1}
                className="rounded-full"
              >
                <Link href={buildPageHref(Math.max(1, pagination.currentPage - 1))} scroll>
                  Anterior
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                disabled={pagination.currentPage >= pagination.totalPages}
                className="rounded-full"
              >
                <Link href={buildPageHref(Math.min(pagination.totalPages, pagination.currentPage + 1))} scroll>
                  Siguiente
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </section>

    </>
  );
}
