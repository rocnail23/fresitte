"use client";

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
  CategoryForm,
  type CategoryFormValues,
} from "@/components/admin/category/category-form";

interface CategoryEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: (formData: FormData) => Promise<void>;
  initialValues: CategoryFormValues;
}

export function CategoryEditDrawer({
  open,
  onOpenChange,
  action,
  initialValues,
}: CategoryEditDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-xl flex-col gap-0 overflow-y-auto bg-card p-0 sm:max-w-xl"
      >
        <SheetHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b border-border/60 bg-card/95 px-6 py-4 backdrop-blur">
          <div className="space-y-1">
            <SheetTitle className="font-heading text-xl">
              Editar categoría
            </SheetTitle>
            <SheetDescription>
              Actualiza los datos. El catálogo se refresca al guardar.
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
          <CategoryForm
            mode="edit"
            action={action}
            initialValues={initialValues}
            bare
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
