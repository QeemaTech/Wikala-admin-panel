import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, del } from '@/lib/api/client';
import type { FlashSaleDTO, FlashSource } from './use-flash-sales';

export interface FlashSaleCreatePayload {
  adId: string;
  title: string;
  originalPriceMinor: number;
  salePriceMinor: number;
  currency: string;
  stock: number;
  endsAt: string;
  source: FlashSource;
}

export type FlashSaleUpdatePayload = Partial<
  Pick<FlashSaleCreatePayload, 'title' | 'originalPriceMinor' | 'salePriceMinor' | 'stock' | 'endsAt'>
>;

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['flash-sales'] });
}

export function useCreateFlashSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FlashSaleCreatePayload) => post<FlashSaleDTO>('/admin/flash-sales', payload),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateFlashSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FlashSaleUpdatePayload }) =>
      patch<FlashSaleDTO>(`/admin/flash-sales/${id}`, payload),
    onSuccess: () => invalidate(qc),
  });
}

export function useEndFlashSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<{ flashSaleId: string; status: string }>(`/admin/flash-sales/${id}/end`, {}),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteFlashSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<{ flashSaleId: string; deleted: boolean }>(`/admin/flash-sales/${id}`),
    onSuccess: () => invalidate(qc),
  });
}
