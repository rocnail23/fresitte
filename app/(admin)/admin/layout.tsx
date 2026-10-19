
import type { ReactNode } from "react";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth";

import { AdminNav } from "./_components/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Toaster } from "@/components/ui/sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-[#fff7ef]">
      <header className="border-b border-white/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-heading text-2xl text-foreground">
            Fresitte <span className="text-primary">/ Admin</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 lg:flex-row">
        <AdminNav />
        <main className="flex-1 rounded-[40px] border border-white/70 bg-white/95 p-6 shadow-xl shadow-primary/10">
          {children}
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
