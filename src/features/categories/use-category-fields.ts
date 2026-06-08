import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, put, del } from '@/lib/api/client';
import type { CategoryFieldDTO } from './use-categories';

interface CreateFieldPayload {
  key: string;
  labelAr: string;
  labelEn?: string;
  type: 'number' | 'text' | 'select' | 'boolean';
  required?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  options?: { value: string; label_ar: string; label_en: string }[];
  order?: number;
}

interface UpdateFieldPayload {
  labelAr?: string;
  labelEn?: string;
  required?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  options?: { value: string; label_ar: string; label_en: string }[];
  order?: number;
  isActive?: boolean;
}

export function useCreateField(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFieldPayload) =>
      post<{ field: CategoryFieldDTO }>(`/admin/categories/${categoryId}/fields`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['category-fields', categoryId] }),
  });
}

export function useUpdateField(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fieldId, payload }: { fieldId: string; payload: UpdateFieldPayload }) =>
      patch<{ field: CategoryFieldDTO }>(`/admin/categories/${categoryId}/fields/${fieldId}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['category-fields', categoryId] }),
  });
}

export function useDeleteField(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fieldId: string) =>
      del<void>(`/admin/categories/${categoryId}/fields/${fieldId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['category-fields', categoryId] }),
  });
}

export function useReplaceFields(categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields: CreateFieldPayload[]) =>
      put<{ fields: CategoryFieldDTO[] }>(`/admin/categories/${categoryId}/fields`, { fields }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['category-fields', categoryId] }),
  });
}
