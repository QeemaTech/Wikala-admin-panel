import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, del } from '@/lib/api/client';
import type { CategoryDTO } from './use-categories';

interface CreateCategoryPayload {
  nameAr: string;
  nameEn?: string;
  slug?: string;
  glyph?: string;
  color?: string;
  parentId?: string | null;
  order?: number;
}

interface UpdateCategoryPayload {
  nameAr?: string;
  nameEn?: string;
  glyph?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      post<{ category: CategoryDTO }>('/admin/categories', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      patch<{ category: CategoryDTO }>(`/admin/categories/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useReorderCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      post<void>('/admin/categories/reorder', { orderedIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}
