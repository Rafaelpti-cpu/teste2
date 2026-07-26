"use client";

/**
 * The category currently showing in the product grid.
 *
 * A store rather than props because the two ends live in different sections of
 * the page: the category cards set it, the grid reads it, and they are siblings
 * under a Server Component. Lifting the state instead would turn the whole
 * middle of the page into a client tree for one number.
 */

import { create } from "zustand";

import type { ProductCategory } from "@/types/catalog";

/** `null` is "Todas" — no filter. */
export type CategoryFilter = ProductCategory | null;

interface CatalogFilterState {
  category: CategoryFilter;
  setCategory: (category: CategoryFilter) => void;
}

export const useCatalogFilter = create<CatalogFilterState>((set) => ({
  category: null,
  setCategory: (category) => set({ category }),
}));
