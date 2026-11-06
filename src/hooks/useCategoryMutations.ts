"use client";

import { useMutation } from "@apollo/client";
import {
  CREATE_CATEGORY,
  DELETE_CATEGORY,
  UPDATE_CATEGORY,
} from "@/lib/graphql";
import type { Category } from "@/lib/types";

import { fullRefetchAfter, insertAfter, syncAfter } from "@/lib/dashboardSync";

export function useCategoryMutations() {
  const [createCategoryM] = useMutation(CREATE_CATEGORY, insertAfter("categories", "createCategory"));
  const [updateCategoryM] = useMutation(UPDATE_CATEGORY, syncAfter);
  const [deleteCategoryM] = useMutation(DELETE_CATEGORY, fullRefetchAfter);

  const createCategory = async (input: {
    name: string;
    color: string;
  }): Promise<Category | null> => {
    try {
      const res = await createCategoryM({ variables: { data: input } });
      return (res.data?.createCategory as Category | undefined) ?? null;
    } catch {
      return null;
    }
  };

  const updateCategory = async (id: string, input: { name: string; color: string }): Promise<boolean> => {
    try {
      await updateCategoryM({ variables: { id, data: input } });
      return true;
    } catch {
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    if (!confirm("Delete this category? Projects in it will become uncategorized.")) {
      return false;
    }
    try {
      await deleteCategoryM({ variables: { id } });
      return true;
    } catch {
      return false;
    }
  };

  return { createCategory, updateCategory, deleteCategory };
}
