import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

/** Which catalogue a category tree belongs to (Contract — CategoryScope). */
export type CategoryScope = 'ADS' | 'PRODUCTS';

export interface CategoryDTO {
  id: string;
  scope: CategoryScope;
  slug: string;
  nameAr: string;
  nameEn: string;
  glyph: string;
  color: string;
  parentId: string | null;
  order: number;
  adCount: number;
  /** Scope-aware count: ads for `ADS`, products for `PRODUCTS`. */
  itemCount: number;
  subCount: number;
  fieldCount: number;
  isActive: boolean;
  children: CategoryDTO[];
}

export interface CategoryFieldDTO {
  _id: string;
  category_id: string;
  key: string;
  label_ar: string;
  label_en: string;
  type: 'number' | 'text' | 'select' | 'boolean';
  required: boolean;
  searchable: boolean;
  filterable: boolean;
  options: { value: string; label_ar: string; label_en: string }[];
  order: number;
  is_active: boolean;
}

export function useCategories(scope: CategoryScope = 'ADS') {
  return useQuery({
    queryKey: ['categories', scope],
    queryFn: () => get<{ items: CategoryDTO[] }>(`/admin/categories?scope=${scope}`),
    staleTime: 60_000,
  });
}

export function useCategoryFields(categoryId: string | null) {
  return useQuery({
    queryKey: ['category-fields', categoryId],
    queryFn: () => get<{ items: CategoryFieldDTO[] }>(`/admin/categories/${categoryId}/fields`),
    enabled: !!categoryId,
    staleTime: 30_000,
  });
}
