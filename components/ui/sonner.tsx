"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5" strokeWidth={2.25} />,
        info: <InfoIcon className="size-5" strokeWidth={2.25} />,
        warning: <TriangleAlertIcon className="size-5" strokeWidth={2.25} />,
        error: <OctagonXIcon className="size-5" strokeWidth={2.25} />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "!flex !items-start !gap-3 !rounded-2xl !border !px-5 !py-4 !shadow-xl !shadow-primary/10",
          icon: "!mt-0.5 !shrink-0",
          title: "!text-[15px] !font-semibold !leading-snug !tracking-tight",
          description: "!mt-1 !text-sm !leading-relaxed !opacity-90",
          default:
            "!bg-card !text-card-foreground !border-[--normal-border]",
          actionButton:
            "!inline-flex !items-center !justify-center !gap-1.5 !rounded-full !bg-primary !px-4 !py-2 !text-sm !font-semibold !text-primary-foreground !shadow-md !shadow-primary/25 !transition hover:!bg-primary/90 hover:!shadow-lg hover:!shadow-primary/30 active:!scale-[0.97]",
          cancelButton:
            "!inline-flex !items-center !justify-center !rounded-full !bg-transparent !px-3 !py-2 !text-sm !font-medium !text-muted-foreground !underline-offset-4 hover:!text-foreground hover:!underline",
          success: "!bg-emerald-50 !text-emerald-950 !border-emerald-200/70",
          error: "!bg-rose-50 !text-rose-950 !border-rose-200/70",
          warning: "!bg-amber-50 !text-amber-950 !border-amber-200/70",
          info: "!bg-sky-50 !text-sky-950 !border-sky-200/70",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
