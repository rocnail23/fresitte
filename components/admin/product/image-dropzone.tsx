"use client";

import * as React from "react";
import { ImageIcon, UploadIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface ImageDropzoneProps {
  name: string;
  preview?: string | null;
  onChange?: (file: File | null) => void;
  className?: string;
  hint?: string;
}

/**
 * Drag-and-drop image dropzone. No external uploader; the selected
 * file is delivered to the server action via `<input type="file">`
 * while a local `URL.createObjectURL` provides an instant preview.
 */
export function ImageDropzone({
  name,
  preview,
  onChange,
  className,
  hint = "Arrastra una imagen o haz clic. Tamaño máx. 5 MB.",
}: ImageDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);
  const objectUrlRef = React.useRef<string | null>(null);

  const displayPreview = localPreview ?? preview ?? null;

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleFile = React.useCallback(
    (file: File | null) => {
      setError(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (!file) {
        setLocalPreview(null);
        onChange?.(null);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("El archivo debe ser una imagen.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("La imagen supera el tamaño máximo permitido (5 MB).");
        return;
      }
      const next = URL.createObjectURL(file);
      objectUrlRef.current = next;
      setLocalPreview(next);
      onChange?.(file);
    },
    [onChange],
  );

  const onSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFile(file);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Subir imagen"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-input bg-card/40 px-4 py-8 text-center text-sm transition-colors hover:border-primary/60 hover:bg-primary/5 focus:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50",
          dragOver && "border-primary bg-primary/10",
          displayPreview && "border-solid border-border",
        )}
      >
        {displayPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayPreview}
              alt="Previsualización"
              className="h-28 w-28 rounded-lg object-cover shadow"
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleFile(null);
              }}
              className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
              aria-label="Quitar imagen"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {dragOver ? <ImageIcon className="size-5" /> : <UploadIcon className="size-5" />}
            </div>
            <div className="text-muted-foreground">
              <p className="font-medium text-foreground">
                Suelta una imagen o haz clic
              </p>
              <p className="mt-1 text-xs">{hint}</p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept="image/*"
          onChange={onSelect}
          className="sr-only"
        />
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
