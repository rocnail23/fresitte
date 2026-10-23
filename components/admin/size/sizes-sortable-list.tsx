"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripVerticalIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  deleteSizeAction,
  reorderSizesAction,
  updateSizeAction,
} from "@/app/(admin)/admin/sizes/actions";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { useSortableOrder } from "@/components/admin/use-sortable-order";

export interface SortableSize {
  id: number;
  name: string;
  matchKey: string;
  displayOrder: number;
  /** How many products carry this size. */
  productCount: number;
}

interface SizesSortableListProps {
  sizes: SortableSize[];
}

export function SizesSortableList({ sizes }: SizesSortableListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<number | null>(
    null,
  );

  const persist = React.useCallback(
    (items: { id: number; displayOrder: number }[]) =>
      reorderSizesAction({ items }),
    [],
  );

  const {
    order,
    isSaving,
    dragId,
    overId,
    move,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useSortableOrder<SortableSize>({ items: sizes, persist });

  const pendingDelete = order.find((size) => size.id === pendingDeleteId);

  const handleDelete = async (id: number) => {
    const formData = new FormData();
    formData.set("id", String(id));
    try {
      await deleteSizeAction(formData);
      toast.success("Talla eliminada");
      router.refresh();
    } catch (error) {
      toast.error("No pudimos eliminar la talla");
      console.error("deleteSizeAction", error);
    }
  };

  if (order.length === 0) {
    return (
      <EmptyState
        title="Aún no tienes tallas"
        description="Registra las tallas que ofrece la tienda para ordenarlas en el filtro del catálogo."
      />
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <GripVerticalIcon className="size-3.5" />
          Arrastra o usa los botones para reordenar. El orden se refleja en el
          filtro de tallas del storefront.
        </span>
        {isSaving ? (
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <Loader2Icon className="size-3 animate-spin" />
            Guardando…
          </span>
        ) : null}
      </div>

      <ol className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {order.map((size, index) => {
          const isFirst = index === 0;
          const isLast = index === order.length - 1;
          const isDragging = dragId === size.id;
          const isOver =
            overId === size.id && dragId !== null && dragId !== size.id;
          const isEditing = editingId === size.id;

          return (
            <li
              key={size.id}
              draggable={!isSaving && !isEditing}
              onDragStart={(event) => handleDragStart(event, size.id)}
              onDragOver={(event) => handleDragOver(event, size.id)}
              onDragLeave={() => handleDragLeave(size.id)}
              onDrop={(event) => handleDrop(event, size.id)}
              onDragEnd={handleDragEnd}
              aria-grabbed={isDragging}
              className={cn(
                "relative transition",
                isDragging && "opacity-60",
                isOver && "ring-2 ring-primary/40",
                isSaving && "pointer-events-none opacity-70",
              )}
            >
              <div className="flex h-full items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 transition hover:border-primary/40">
                <div className="flex shrink-0 flex-col items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Mover ${size.name} arriba`}
                    disabled={isFirst || isSaving || isEditing}
                    onClick={() => move(size.id, "up")}
                    className="size-7 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <ArrowUpIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Mover ${size.name} abajo`}
                    disabled={isLast || isSaving || isEditing}
                    onClick={() => move(size.id, "down")}
                    className="size-7 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <ArrowDownIcon className="size-3.5" />
                  </Button>
                </div>

                {isEditing ? (
                  <SizeEditForm
                    size={size}
                    onDone={() => setEditingId(null)}
                    action={updateSizeAction}
                  />
                ) : (
                  <>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm text-primary">
                        {size.matchKey}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-heading text-base text-foreground">
                          {size.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {size.productCount === 1
                            ? "1 producto"
                            : `${size.productCount} productos`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${size.name}`}
                        onClick={() => setEditingId(size.id)}
                        className="size-8 rounded-full text-muted-foreground hover:text-primary"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ${size.name}`}
                        onClick={() => setPendingDeleteId(size.id)}
                        className="size-8 rounded-full text-muted-foreground hover:text-destructive"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <ConfirmDeleteDialog
        entityName={pendingDelete?.name ?? ""}
        entityLabel="talla"
        description="La talla se quitará del filtro. Los productos no cambian."
        open={pendingDeleteId != null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        onConfirm={async () => {
          if (pendingDeleteId == null) return;
          await handleDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </>
  );
}

function SizeEditForm({
  size,
  action,
  onDone,
}: {
  size: SortableSize;
  action: (formData: FormData) => Promise<void>;
  onDone: () => void;
}) {
  const [name, setName] = React.useState(size.name);

  return (
    <form action={action} className="flex min-w-0 flex-1 items-center gap-2">
      <input type="hidden" name="id" value={size.id} />
      <Input
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        aria-label={`Nombre de la talla ${size.name}`}
        className="h-8 flex-1"
        autoFocus
      />
      <Button
        type="submit"
        size="sm"
        className="shrink-0 rounded-full px-3"
        disabled={!name.trim()}
      >
        Guardar
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 rounded-full px-3"
        onClick={onDone}
      >
        Cancelar
      </Button>
    </form>
  );
}
