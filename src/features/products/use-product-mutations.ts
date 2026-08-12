import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, del } from '@/lib/api/client';
import type { ProductDTO, ProductPlacement, ProductStatus } from './use-products';

/** Media is resubmitted whole; only the public id and order are load-bearing. */
export interface ProductMediaInput {
  cloudinaryPublicId: string;
  order: number;
}

export interface ProductPayload {
  title?: string;
  description?: string;
  categoryId?: string;
  subCategoryId?: string | null;
  dynamicFields?: Record<string, unknown>;
  media?: ProductMediaInput[];
  priceMinor?: number;
  compareAtPriceMinor?: number | null;
  currency?: string;
  stock?: number;
  sku?: string | null;
  weightGrams?: number | null;
  badgeText?: string | null;
  placement?: ProductPlacement;
  dealStartsAt?: string | null;
  dealEndsAt?: string | null;
  status?: ProductStatus;
}

/** Both lists and the category counters move when a product is written. */
function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['products'] });
  qc.invalidateQueries({ queryKey: ['categories'] });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductPayload) => post<ProductDTO>('/admin/products', payload),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductPayload }) =>
      patch<ProductDTO>(`/admin/products/${id}`, payload),
    onSuccess: (_d, { id }) => {
      invalidate(qc);
      qc.invalidateQueries({ queryKey: ['product', id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/admin/products/${id}`),
    onSuccess: () => invalidate(qc),
  });
}
