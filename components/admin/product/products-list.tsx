"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ProductCard } from "@/components/admin/product/product-card";
import { ProductEditDrawer } from "@/components/admin/product/product-edit-drawer";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import {
  type CategoryOption,
  type ProductFormValues,
} from "@/components/admin/product/product-form";
import {
  deleteProductAction,
  duplicateProductAction,
  updateProductAction,
} from "@/app/(admin)/admin/products/actions";

export interface ManagedProduct {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
  currency: string | null;
  stock: number;
  summary: string | null;
  description: string | null;
  sizes: string | null;
  isVisible: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
  categoryNames: string[];
  categoryIds: number[];
}

interface ProductsListProps {
  products: ManagedProduct[];
  categoryList: CategoryOption[];
}

function toFormValues(product: ManagedProduct): ProductFormValues {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.priceCents / 100,
    stock: product.stock,
    summary: product.summary,
    description: product.description,
    sizes: (product.sizes ?? "")
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean),
    isVisible: product.isVisible,
    isFeatured: product.isFeatured,
    categoryIds: product.categoryIds,
    imageUrl: product.imageUrl,
  };
}

export function ProductsList({ products, categoryList }: ProductsListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<number | null>(
    null,
  );

  const editingProduct = products.find((product) => product.id === editingId);
  const pendingDelete = products.find(
    (product) => product.id === pendingDeleteId,
  );

  const refresh = () => router.refresh();

  const handleDuplicate = async (id: number) => {
    const formData = new FormData();
    formData.set("id", String(id));
    try {
      await duplicateProductAction(formData);
      toast.success("Producto duplicado");
      refresh();
    } catch (error) {
      toast.error("No pudimos duplicar el producto");
      console.error("duplicateProductAction", error);
    }
  };

  const handleDelete = async (id: number) => {
    const formData = new FormData();
    formData.set("id", String(id));
    try {
      await deleteProductAction(formData);
      toast.success("Producto eliminado");
      refresh();
    } catch (error) {
      toast.error("No pudimos eliminar el producto");
      console.error("deleteProductAction", error);
    }
  };

  if (products.length === 0) {
    return (
      <EmptyState
        title="Aún no tienes productos"
        description="Crea tu primer producto para empezar a llenar el catálogo."
        cta={{ label: "+ Crear producto", href: "/admin/products/new" }}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={() => setEditingId(product.id)}
            onDuplicate={() => handleDuplicate(product.id)}
            onDelete={() => setPendingDeleteId(product.id)}
          />
        ))}
      </div>

      <ProductEditDrawer
        open={editingProduct != null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
        action={updateProductAction}
        categoryList={categoryList}
        initialValues={
          editingProduct ? toFormValues(editingProduct) : ({} as ProductFormValues)
        }
      />

      <ConfirmDeleteDialog
        entityName={pendingDelete?.name ?? ""}
        entityLabel="producto"
        description="El producto y sus relaciones se eliminarán del catálogo."
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
