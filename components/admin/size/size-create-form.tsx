"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Loader2Icon, PlusIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  createSizeAction,
  syncSizesAction,
} from "@/app/(admin)/admin/sizes/actions";

export function SizeCreateForm() {
  const [name, setName] = React.useState("");

  return (
    <form
      action={createSizeAction}
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-2">
        <label
          htmlFor="new-size-name"
          className="text-sm font-semibold text-foreground"
        >
          Nueva talla
        </label>
        <Input
          id="new-size-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="3-6 meses"
          maxLength={40}
          required
        />
        <p className="text-xs text-muted-foreground">
          Se añade al final de la lista. Arrástrala después para colocarla.
        </p>
      </div>
      <CreateSizeButton disabled={!name.trim()} />
    </form>
  );
}

function CreateSizeButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="shrink-0 rounded-full px-5"
    >
      {pending ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          Guardando…
        </>
      ) : (
        <>
          <PlusIcon className="size-4" />
          Añadir talla
        </>
      )}
    </Button>
  );
}

export function SizeSyncButton() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncSizesAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.added === 0
          ? "No hay tallas nuevas en el catálogo"
          : `${result.added} talla${result.added === 1 ? "" : "s"} añadida${result.added === 1 ? "" : "s"}`,
      );
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSync}
      disabled={isPending}
      className="shrink-0 rounded-full border-primary/30 px-5 text-primary"
    >
      {isPending ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          Sincronizando…
        </>
      ) : (
        <>
          <RefreshCwIcon className="size-4" />
          Importar del catálogo
        </>
      )}
    </Button>
  );
}
