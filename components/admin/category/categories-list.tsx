"use client";

import {
  CategorySortableList,
  type SortableCategory,
} from "@/components/admin/category/category-sortable-list";

interface CategoriesListProps {
  categories: SortableCategory[];
}

export function CategoriesList({ categories }: CategoriesListProps) {
  return <CategorySortableList categories={categories} />;
}