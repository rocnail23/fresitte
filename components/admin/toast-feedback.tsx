"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const PARAMS = ["status", "message"];

interface ToastFeedbackProps {
  /** Page path used as the redirect-clean target when no params are present. */
  basePath?: string;
}

/**
 * Reads `?status=...&message=...` once on mount and surfaces a toast
 * matching the previous SSR banner. After firing, it strips the
 * query params so a refresh does not replay the toast.
 */
export function ToastFeedback({ basePath }: ToastFeedbackProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  React.useEffect(() => {
    const status = params.get("status");
    const message = params.get("message");
    if (!status || !message) return;
    if (status === "success") {
      toast.success(message);
    } else if (status === "error") {
      toast.error(message);
    } else {
      toast(message);
    }
    const next = new URLSearchParams(params.toString());
    PARAMS.forEach((key) => next.delete(key));
    const qs = next.toString();
    const target = basePath ?? pathname;
    router.replace(qs ? `${target}?${qs}` : target);
  }, [params, pathname, router, basePath]);

  return null;
}
