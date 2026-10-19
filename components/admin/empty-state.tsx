import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  cta?: { label: string; href: string } | null;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  cta,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary"
      >
        {icon ?? <DefaultIcon />}
      </div>
      <div className="space-y-1">
        <h3 className="font-heading text-xl text-foreground">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {cta ? (
        <Button asChild className="rounded-full px-5">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function DefaultIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="36"
      height="36"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <path d="M3 10h18" />
      <path d="M9 14h6" />
    </svg>
  );
}
