"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Shared behaviour of the admin lists that can be reordered by hand:
 * the categories (`/admin/categories`) and the sizes (`/admin/sizes`).
 *
 * It owns the optimistic local order, the drag & drop state and the
 * persistence through a server action. The action receives the whole list
 * with the new `displayOrder` of each row.
 */
export interface SortableOrderItem {
  id: number;
  displayOrder: number;
}

export interface UseSortableOrderOptions<T extends SortableOrderItem> {
  /** The ordered rows as they come from the server. */
  items: T[];
  /** Persists the new order. Must resolve to `{ ok: boolean; error?: string }`. */
  persist: (items: { id: number; displayOrder: number }[]) => Promise<
    { ok: boolean; error?: string }
  >;
  /** Toast shown when the order was saved. */
  successMessage?: string;
}

export interface UseSortableOrderResult<T extends SortableOrderItem> {
  order: T[];
  isSaving: boolean;
  dragId: number | null;
  overId: number | null;
  move: (id: number, direction: "up" | "down") => void;
  reorderTo: (sourceId: number, targetId: number) => void;
  handleDragStart: (
    event: React.DragEvent<HTMLElement>,
    id: number,
  ) => void;
  handleDragOver: (
    event: React.DragEvent<HTMLElement>,
    overItemId: number,
  ) => void;
  handleDragLeave: (overItemId: number) => void;
  handleDrop: (event: React.DragEvent<HTMLElement>, targetId: number) => void;
  handleDragEnd: () => void;
}

export function useSortableOrder<T extends SortableOrderItem>({
  items,
  persist,
  successMessage = "Orden guardado",
}: UseSortableOrderOptions<T>): UseSortableOrderResult<T> {
  const router = useRouter();
  const [order, setOrder] = React.useState<T[]>(items);
  const [isSaving, setIsSaving] = React.useState(false);
  const [dragId, setDragId] = React.useState<number | null>(null);
  const [overId, setOverId] = React.useState<number | null>(null);

  // Sync external reorders (server refresh after create/edit/delete).
  React.useEffect(() => {
    setOrder(items);
  }, [items]);

  const save = React.useCallback(
    async (next: T[]) => {
      setIsSaving(true);
      const payload = {
        items: next.map((item, index) => ({
          id: item.id,
          displayOrder: index,
        })),
      };
      const result = await persist(payload.items);
      setIsSaving(false);
      if (!result.ok) {
        toast.error(result.error ?? "No pudimos guardar el orden");
        setOrder(items);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    },
    [items, persist, router, successMessage],
  );

  const move = React.useCallback(
    (id: number, direction: "up" | "down") => {
      const index = order.findIndex((item) => item.id === id);
      if (index === -1) return;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= order.length) return;
      const next = order.slice();
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      setOrder(next);
      void save(next);
    },
    [order, save],
  );

  const reorderTo = React.useCallback(
    (sourceId: number, targetId: number) => {
      if (sourceId === targetId) return;
      const sourceIndex = order.findIndex((item) => item.id === sourceId);
      const targetIndex = order.findIndex((item) => item.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return;
      const next = order.slice();
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      setOrder(next);
      void save(next);
    },
    [order, save],
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
    overItemId: number,
  ) => {
    if (dragId == null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (overId !== overItemId) setOverId(overItemId);
  };

  const handleDragLeave = (overItemId: number) => {
    if (overId === overItemId) setOverId(null);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLElement>,
    targetId: number,
  ) => {
    event.preventDefault();
    const sourceId = dragId ?? Number(event.dataTransfer.getData("text/plain"));
    setDragId(null);
    setOverId(null);
    if (!Number.isFinite(sourceId) || sourceId === targetId) return;
    reorderTo(sourceId, targetId);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  return {
    order,
    isSaving,
    dragId,
    overId,
    move,
    reorderTo,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
