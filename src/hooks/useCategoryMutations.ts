"use client";

import { useMutation } from "@apollo/client";
import {
  CREATE_CATEGORY,
  DASHBOARD_QUERY,
  DELETE_CATEGORY,
} from "@/lib/graphql";
import type { Category } from "@/lib/types";

const refetchAfter = { refetchQueries: [{ query: DASHBOARD_QUERY }] };

export function useCategoryMutations() {
  const [createCategoryM] = useMutation(CREATE_CATEGORY, refetchAfter);
  const [deleteCategoryM] = useMutation(DELETE_CATEGORY, refetchAfter);

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

  return { createCategory, deleteCategory };
}
