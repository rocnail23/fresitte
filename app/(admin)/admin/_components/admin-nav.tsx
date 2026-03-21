"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Settings, ShoppingBasket, Store, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems = [
 
  { href: "/admin/products", label: "Productos", icon: ShoppingBasket },
  { href: "/admin/categories", label: "Categorías", icon: Package },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row gap-2 overflow-x-auto rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg shadow-primary/10 lg:h-fit lg:w-64 lg:flex-col">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2 font-semibold transition",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/5",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
