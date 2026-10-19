"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  CategoryCard,
} from "@/components/admin/category/category-card";
import { CategoryEditDrawer } from "@/components/admin/category/category-edit-drawer";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import {
  type CategoryFormValues,
} from "@/components/admin/category/category-form";
import {
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/(admin)/admin/categories/actions";

interface ManagedCategory {
  id: number;
  name: string;
  slug: string;
  highlightColor: string | null;
  coverImageUrl: string | null;
  displayOrder: number;
  productCount: number;
  description: string | null;
}

interface CategoriesListProps {
  categories: ManagedCategory[];
}

function toFormValues(category: ManagedCategory): CategoryFormValues {
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

export function CategoriesList({ categories }: CategoriesListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<number | null>(
    null,
  );

  const editingCategory = categories.find((category) => category.id === editingId);
  const pendingDelete = categories.find(
    (category) => category.id === pendingDeleteId,
  );

  const refresh = () => router.refresh();

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

  if (categories.length === 0) {
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={() => setEditingId(category.id)}
            onDelete={() => setPendingDeleteId(category.id)}
          />
        ))}
      </div>

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
