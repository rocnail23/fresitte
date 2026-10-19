"use client";

import * as React from "react";
import { ChevronLeftIcon } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import {
  ProductForm,
  type CategoryOption,
  type ProductFormValues,
} from "@/components/admin/product/product-form";

interface ProductEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: (formData: FormData) => Promise<void>;
  categoryList: CategoryOption[];
  initialValues: ProductFormValues;
}

export function ProductEditDrawer({
  open,
  onOpenChange,
  action,
  categoryList,
  initialValues,
}: ProductEditDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-xl flex-col gap-0 overflow-y-auto bg-card p-0 sm:max-w-xl"
      >
        <SheetHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b border-border/60 bg-card/95 px-6 py-4 backdrop-blur">
          <div className="space-y-1">
            <SheetTitle className="font-heading text-xl">
              Editar producto
            </SheetTitle>
            <SheetDescription>
              Modifica los datos y guarda. La actualización es inmediata.
            </SheetDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
        </SheetHeader>
        <div className="px-6 pb-24 pt-2">
          <ProductForm
            mode="edit"
            action={action}
            categoryList={categoryList}
            initialValues={initialValues}
            bare
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
