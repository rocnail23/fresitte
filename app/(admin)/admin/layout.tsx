import { Suspense, type ReactNode } from "react";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";

import { AdminNav } from "./_components/admin-nav";
import { RequireAdmin } from "./_components/require-admin";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Toaster } from "@/components/ui/sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // The admin area is session-gated. `requireAdmin()` reads the auth cookie,
  // which is request-time data, so it has to sit inside a <Suspense> boundary
  // under Cache Components. The boundary covers the whole admin subtree, so the
  // shell and the pages only render once the session has been validated.
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <RequireAdmin>
        <AdminShell>{children}</AdminShell>
      </RequireAdmin>
    </Suspense>
  );
}

async function AdminShell({ children }: AdminLayoutProps) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/"
            className="font-heading text-xl text-foreground sm:text-2xl"
          >
            Fresitte <span className="text-primary">/ Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground sm:gap-4">
            <span className="hidden sm:inline">{user?.email}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:gap-8">
        <AdminNav />
        <main className="flex-1 rounded-[28px] border border-white/70 bg-white/95 p-4 shadow-xl shadow-primary/10 sm:p-6">
          {children}
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}

function AdminShellSkeleton() {
  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      aria-busy="true"
      aria-label="Cargando administración"
    >
      <div className="h-[73px] border-b border-white/60 bg-white/90" />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:gap-8">
        <div className="h-14 w-full animate-pulse rounded-3xl bg-white/90 lg:h-64 lg:w-64" />
        <div className="flex-1 animate-pulse rounded-[28px] border border-white/70 bg-white/95 p-4 sm:p-6">
          <div className="h-8 w-48 animate-pulse rounded-full bg-muted/40" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="h-32 animate-pulse rounded-3xl bg-muted/30" />
            <div className="h-32 animate-pulse rounded-3xl bg-muted/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
