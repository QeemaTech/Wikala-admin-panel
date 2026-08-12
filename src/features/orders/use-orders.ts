import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api/client';
import { buildQuery, type ListMeta } from '@/features/products/use-products';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'CARD' | 'WALLET' | 'COD';
export type OrderPaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'بانتظار الدفع',
  CONFIRMED: 'مؤكَّد',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
  REFUNDED: 'مُسترجع',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: 'بطاقة',
  WALLET: 'محفظة إلكترونية',
  COD: 'الدفع عند الاستلام',
};

/**
 * Mirrors the server's fulfilment state machine (`adminOrdersService.TRANSITIONS`)
 * so the drawer only offers legal moves — the API 409s on anything else.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export interface OrderItemDTO {
  productId: string;
  title: string;
  coverUrl: string | null;
  unitPriceMinor: number;
  compareAtPriceMinor: number | null;
  qty: number;
  subtotalMinor: number;
}

export interface OrderDTO {
  id: string;
  orderNo: string;
  userId: string | null;
  items: OrderItemDTO[];
  subtotalMinor: number;
  deliveryFeeMinor: number;
  discountMinor: number;
  totalMinor: number;
  currency: string;
  couponCode: string | null;
  deliveryAddress: {
    fullName: string;
    phone: string;
    governorate: string;
    district: string;
    street: string;
    notes: string | null;
  } | null;
  paymentMethod: PaymentMethod;
  paymentStatus: OrderPaymentStatus;
  status: OrderStatus;
  timeline: { status: string; at: string | null; note: string | null }[];
  placedAt: string | null;
  cancelReason: string | null;
  buyer?: { id: string; name: string; phone: string; avatarUrl: string | null } | null;
}

export function useOrders(
  params: { status?: OrderStatus | ''; paymentStatus?: string; search?: string; page?: number } = {},
) {
  const qs = buildQuery({ ...params, page: params.page });
  return useQuery({
    queryKey: ['admin-orders', params],
    queryFn: () => get<{ items: OrderDTO[]; meta: ListMeta }>(`/admin/orders${qs}`),
    staleTime: 30_000,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => get<OrderDTO>(`/admin/orders/${id}`),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      patch<OrderDTO>(`/admin/orders/${id}/status`, { status, ...(note ? { note } : {}) }),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-order', id] });
      // DELIVERED captures a COD transaction; REFUNDED flips it — the ledger moves.
      qc.invalidateQueries({ queryKey: ['admin-transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-transactions-summary'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
