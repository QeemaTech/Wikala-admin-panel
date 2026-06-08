import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch } from '@/lib/api/client';

export type CurrencyStatus = 'ACTIVE' | 'INACTIVE';

export interface CurrencyDTO {
  code: string;
  nameAr: string;
  nameEn: string;
  exchangeRateToBase: number;
  status: CurrencyStatus;
  updatedAt: string | null;
}

export interface CreateCurrencyPayload {
  code: string;
  nameAr: string;
  nameEn: string;
  exchangeRateToBase: number;
  status?: CurrencyStatus;
}

export interface UpdateCurrencyPayload {
  nameAr?: string;
  nameEn?: string;
  exchangeRateToBase?: number;
  status?: CurrencyStatus;
}

/** `GET /admin/currencies` → `{ currencies: CurrencyDTO[] }`. */
export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { currencies } = await get<{ currencies: CurrencyDTO[] }>('/admin/currencies');
      return currencies;
    },
    staleTime: 60_000,
  });
}

/** `POST /admin/currencies`. */
export function useCreateCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCurrencyPayload) =>
      post<{ currency: CurrencyDTO }>('/admin/currencies', payload).then((r) => r.currency),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['currencies'] }),
  });
}

/** `PATCH /admin/currencies/:code` — name / rate / status. */
export function useUpdateCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, payload }: { code: string; payload: UpdateCurrencyPayload }) =>
      patch<{ currency: CurrencyDTO }>(`/admin/currencies/${code}`, payload).then((r) => r.currency),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['currencies'] }),
  });
}
