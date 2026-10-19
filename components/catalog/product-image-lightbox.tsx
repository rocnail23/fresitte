"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface OpenLightboxDetail {
  images: string[];
  alt: string;
  productName: string;
  productId?: string;
  /** Page-level id so we can rotate through alternate catalog entries if multiple products share names. */
}

interface LightboxState {
  open: boolean;
  images: string[];
  alt: string;
  productName: string;
  index: number;
}

const INITIAL_STATE: LightboxState = {
  open: false,
  images: [],
  alt: "",
  productName: "",
  index: 0,
};

const FADE_OUT_MS = 180;

export function openProductLightbox(detail: OpenLightboxDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OpenLightboxDetail>("fresitte:open-lightbox", { detail }),
  );
}

export function ProductImageLightbox() {
  const [state, setState] = useState<LightboxState>(INITIAL_STATE);
  // `mounted` keeps the overlay in the DOM across the open and close fades.
  const [mounted, setMounted] = useState(false);
  // `phase` drives the actual opacity/scale classes so the first frame is
  // always the "closed" state, then the next paint flips to "open" and the
  // CSS transition runs.
  const [phase, setPhase] = useState<"closed" | "open">("closed");
  const closeTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const isOpen = state.open && state.images.length > 0;
  const visible = mounted && state.images.length > 0;

  useEffect(() => {
    const onOpen = (event: Event) => {
      const custom = event as CustomEvent<OpenLightboxDetail>;
      const detail = custom.detail;
      if (!detail || !detail.images.length) return;
      if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      closeTimerRef.current = null;
      setState({
        open: true,
        images: detail.images,
        alt: detail.alt,
        productName: detail.productName,
        index: 0,
      });
      setMounted(true);
      // Force the first paint to be the closed state, then queue the open
      // state on the next frame so the browser applies the CSS transition.
      setPhase("closed");
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setPhase("open");
          rafRef.current = null;
        });
      });
    };
    window.addEventListener("fresitte:open-lightbox", onOpen);
    return () => {
      window.removeEventListener("fresitte:open-lightbox", onOpen);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Schedule an unmount after the close fade so we keep the DOM for the
  // transition. Closes are kicked off from `setPhase("closed")` + `open:false`
  // in the same handler that drives the close action.
  useEffect(() => {
    if (isOpen || !mounted) return;
    const handle = setTimeout(() => {
      setMounted(false);
      setState(INITIAL_STATE);
    }, FADE_OUT_MS);
    closeTimerRef.current = handle;
    return () => clearTimeout(handle);
  }, [isOpen, mounted]);

  // Lock body scroll while the overlay is visible (mounted && open or fading).
  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  const startClose = () => {
    setPhase("closed");
    setState((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        startClose();
      } else if (event.key === "ArrowRight") {
        setState((prev) =>
          prev.images.length > 1
            ? { ...prev, index: (prev.index + 1) % prev.images.length }
            : prev,
        );
      } else if (event.key === "ArrowLeft") {
        setState((prev) =>
          prev.images.length > 1
            ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }
            : prev,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!visible) return null;

  const currentSrc = state.images[state.index] ?? "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Imagen ampliada de ${state.productName}`}
      aria-hidden={!isOpen}
      className={cn(
        "fixed inset-0 z-[100] flex flex-col bg-black/90 text-white transition-opacity ease-out",
        phase === "open" ? "opacity-100" : "opacity-0",
        phase === "open" ? "duration-[220ms]" : "duration-[180ms]",
      )}
      style={{ pointerEvents: phase === "open" ? "auto" : "none" }}
      onClick={() => isOpen && startClose()}
    >
      <header className={cn(
        "flex items-center justify-between gap-3 px-5 py-4 sm:px-8 sm:py-5 transition-all ease-out",
        phase === "open"
          ? "translate-y-0 opacity-100 duration-[260ms]"
          : "-translate-y-2 opacity-0 duration-[180ms]",
      )}>
        <p className="truncate text-sm font-medium text-white/80">
          {state.productName}
        </p>
        <button
          type="button"
          aria-label="Cerrar imagen ampliada"
          onClick={(event) => {
            event.stopPropagation();
            startClose();
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </header>

      <div
        className={cn(
          "relative flex flex-1 items-center justify-center px-4 pb-6 sm:px-10 transition-all ease-out",
          phase === "open"
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-[0.97] opacity-0",
          phase === "open" ? "duration-[260ms]" : "duration-[180ms]",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {state.images.length > 1 ? (
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={() =>
              setState((prev) =>
                prev.images.length > 1
                  ? {
                      ...prev,
                      index:
                        (prev.index - 1 + prev.images.length) %
                        prev.images.length,
                    }
                  : prev,
              )
            }
            className={cn(
              "absolute z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20",
              "left-2 sm:left-6",
              phase === "open"
                ? "translate-x-0 opacity-100 duration-[300ms]"
                : "-translate-x-3 opacity-0 duration-[160ms]",
            )}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}

        <div className="relative flex h-full max-h-[75vh] w-full max-w-3xl items-center justify-center">
          <Image
            key={currentSrc}
            src={currentSrc}
            alt={state.alt}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className={cn(
              "select-none transition-opacity ease-out",
              phase === "open"
                ? "opacity-100 duration-[300ms]"
                : "opacity-0 duration-[160ms]",
            )}
            style={{ objectFit: "contain", touchAction: "pinch-zoom" }}
            draggable={false}
          />
        </div>

        {state.images.length > 1 ? (
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={() =>
              setState((prev) =>
                prev.images.length > 1
                  ? {
                      ...prev,
                      index: (prev.index + 1) % prev.images.length,
                    }
                  : prev,
              )
            }
            className={cn(
              "absolute z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20",
              "right-2 sm:right-6",
              phase === "open"
                ? "translate-x-0 opacity-100 duration-[300ms]"
                : "translate-x-3 opacity-0 duration-[160ms]",
            )}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        ) : null}
      </div>

      {state.images.length > 1 ? (
        <footer
          className={cn(
            "flex items-center justify-center gap-2 pb-6 transition-all ease-out",
            phase === "open"
              ? "translate-y-0 opacity-100 duration-[300ms]"
              : "translate-y-2 opacity-0 duration-[160ms]",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {state.images.map((src, idx) => (
            <button
              key={src + idx}
              type="button"
              aria-label={`Ir a imagen ${idx + 1}`}
              aria-current={idx === state.index}
              onClick={() =>
                setState((prev) => ({ ...prev, index: idx }))
              }
              className={cn(
                "h-2.5 rounded-full transition",
                idx === state.index
                  ? "w-8 bg-white"
                  : "w-2.5 bg-white/40 hover:bg-white/70",
              )}
            />
          ))}
        </footer>
      ) : null}
    </div>
  );
}