import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  description,
  badge,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-lg text-foreground">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {badge ? <div>{badge}</div> : null}
    </div>
  );
}
