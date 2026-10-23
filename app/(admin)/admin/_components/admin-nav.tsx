"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Ruler, ShoppingBasket, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/products", label: "Productos", icon: ShoppingBasket },
  { href: "/admin/categories", label: "Categorías", icon: Package },
  { href: "/admin/sizes", label: "Tallas", icon: Ruler },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Administración"
      className="flex flex-row gap-2 overflow-x-auto rounded-3xl border border-white/70 bg-white/95 p-2 shadow-sm shadow-primary/10 lg:h-fit lg:w-64 lg:flex-col lg:gap-1 lg:p-3"
    >
      <p className="hidden px-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground lg:block">
        Inventario
      </p>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm font-semibold transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              isActive
                ? "border-primary/15 bg-primary/10 text-primary shadow-inner"
                : "text-muted-foreground hover:border-primary/10 hover:bg-primary/5 hover:text-foreground",
            )}
          >
            <item.icon
              aria-hidden
              className={cn(
                "h-4 w-4 shrink-0 transition",
                isActive ? "text-primary" : "text-muted-foreground/80",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
