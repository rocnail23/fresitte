"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { CategoryCard } from "@/components/admin/category/category-card";
import {
  deleteCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
} from "@/app/(admin)/admin/categories/actions";
import {
  type CategoryFormValues,
} from "@/components/admin/category/category-form";
import { CategoryEditDrawer } from "@/components/admin/category/category-edit-drawer";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { EmptyState } from "@/components/admin/empty-state";

export interface SortableCategory {
  id: number;
  name: string;
  slug: string;
  highlightColor: string | null;
  coverImageUrl: string | null;
  displayOrder: number;
  productCount: number;
  description: string | null;
}

interface CategorySortableListProps {
  categories: SortableCategory[];
}

type MoveDirection = "up" | "down";

function toFormValues(category: SortableCategory): CategoryFormValues {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    highlightColor: category.highlightColor ?? "#ff6464",
    displayOrder: category.displayOrder,
    description: category.description,
    coverImageUrl: category.coverImageUrl,
  };
}

export function CategorySortableList({ categories }: CategorySortableListProps) {
  const router = useRouter();
  const [order, setOrder] = React.useState<SortableCategory[]>(categories);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<number | null>(
    null,
  );
  const [dragId, setDragId] = React.useState<number | null>(null);
  const [overId, setOverId] = React.useState<number | null>(null);

  // Sync external reorders (server refresh after create/edit/delete).
  React.useEffect(() => {
    setOrder(categories);
  }, [categories]);

  const editingCategory = order.find((category) => category.id === editingId);
  const pendingDelete = order.find((category) => category.id === pendingDeleteId);

  const refresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const persist = React.useCallback(
    async (next: SortableCategory[]) => {
      setIsSaving(true);
      const payload = {
        items: next.map((category, index) => ({
          id: category.id,
          displayOrder: index,
        })),
      };
      const result = await reorderCategoriesAction(payload);
      setIsSaving(false);
      if (!result.ok) {
        toast.error(result.error);
        setOrder(categories);
        return;
      }
      toast.success("Orden guardado");
      refresh();
    },
    [categories, refresh],
  );

  const move = React.useCallback(
    (id: number, direction: MoveDirection) => {
      const index = order.findIndex((category) => category.id === id);
      if (index === -1) return;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= order.length) return;
      const next = order.slice();
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      setOrder(next);
      void persist(next);
    },
    [order, persist],
  );

  const reorderTo = React.useCallback(
    (sourceId: number, targetId: number) => {
      if (sourceId === targetId) return;
      const sourceIndex = order.findIndex(
        (category) => category.id === sourceId,
      );
      const targetIndex = order.findIndex(
        (category) => category.id === targetId,
      );
      if (sourceIndex === -1 || targetIndex === -1) return;
      const next = order.slice();
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      setOrder(next);
      void persist(next);
    },
    [order, persist],
  );

  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
    id: number,
  ) => {
    if (isSaving) {
      event.preventDefault();
      return;
    }
    setDragId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(id));
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLElement>,
    overCategoryId: number,
  ) => {
    if (dragId == null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (overId !== overCategoryId) setOverId(overCategoryId);
  };

  const handleDragLeave = (overCategoryId: number) => {
    if (overId === overCategoryId) setOverId(null);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLElement>,
    targetId: number,
  ) => {
    event.preventDefault();
    const sourceId =
      dragId ?? Number(event.dataTransfer.getData("text/plain"));
    setDragId(null);
    setOverId(null);
    if (!Number.isFinite(sourceId) || sourceId === targetId) return;
    reorderTo(sourceId, targetId);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  const handleDelete = async (id: number) => {
    const formData = new FormData();
    formData.set("id", String(id));
    try {
      await deleteCategoryAction(formData);
      toast.success("Categoría eliminada");
      refresh();
    } catch (error) {
      toast.error("No pudimos eliminar la categoría");
      console.error("deleteCategoryAction", error);
    }
  };

  if (order.length === 0) {
    return (
      <EmptyState
        title="Aún no tienes categorías"
        description="Crea tu primera colección para empezar a agrupar productos."
        cta={{ label: "+ Crear categoría", href: "/admin/categories/new" }}
      />
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <GripVerticalIcon className="size-3.5" />
          Arrastra o usa los botones para reordenar. El orden se refleja en el
          modal de filtros del storefront.
        </span>
        {isSaving ? (
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <Loader2Icon className="size-3 animate-spin" />
            Guardando…
          </span>
        ) : null}
      </div>

      <ol className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
        {order.map((category, index) => {
          const isFirst = index === 0;
          const isLast = index === order.length - 1;
          const isDragging = dragId === category.id;
          const isOver =
            overId === category.id && dragId !== null && dragId !== category.id;
          return (
            <li
              key={category.id}
              draggable={!isSaving}
              onDragStart={(event) => handleDragStart(event, category.id)}
              onDragOver={(event) => handleDragOver(event, category.id)}
              onDragLeave={() => handleDragLeave(category.id)}
              onDrop={(event) => handleDrop(event, category.id)}
              onDragEnd={handleDragEnd}
              aria-grabbed={isDragging}
              className={cn(
                "relative transition",
                isDragging && "opacity-60",
                isOver && "ring-2 ring-primary/40",
                isSaving && "pointer-events-none opacity-70",
              )}
            >
              <div className="flex items-center gap-2">
                <div className="flex shrink-0 flex-col items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Mover ${category.name} arriba`}
                    disabled={isFirst || isSaving}
                    onClick={() => move(category.id, "up")}
                    className="size-7 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <ArrowUpIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Mover ${category.name} abajo`}
                    disabled={isLast || isSaving}
                    onClick={() => move(category.id, "down")}
                    className="size-7 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <ArrowDownIcon className="size-3.5" />
                  </Button>
                </div>
                <div className="min-w-0 flex-1 cursor-grab active:cursor-grabbing">
                  <CategoryCard
                    category={category}
                    onEdit={() => setEditingId(category.id)}
                    onDelete={() => setPendingDeleteId(category.id)}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <CategoryEditDrawer
        open={editingCategory != null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
        action={updateCategoryAction}
        initialValues={
          editingCategory
            ? toFormValues(editingCategory)
            : ({} as CategoryFormValues)
        }
      />

      <ConfirmDeleteDialog
        entityName={pendingDelete?.name ?? ""}
        entityLabel="categoría"
        description="Los productos asociados quedarán sin categoría."
        open={pendingDelete != null}
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