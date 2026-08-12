import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'HIDDEN' | 'OUT_OF_STOCK';
export type ProductPlacement = 'NONE' | 'FLASH' | 'TODAYS_DEAL';

export const PRODUCT_STATUSES: ProductStatus[] = ['DRAFT', 'ACTIVE', 'HIDDEN', 'OUT_OF_STOCK'];

export const PLACEMENT_LABELS: Record<ProductPlacement, string> = {
  NONE: 'بدون',
  FLASH: 'عروض فلاش',
  TODAYS_DEAL: 'صفقات اليوم',
};

export const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'مسودة',
  ACTIVE: 'نشط',
  HIDDEN: 'مخفي',
  OUT_OF_STOCK: 'نفدت الكمية',
};

/** One image on a product, as returned by the admin/app product DTO. */
export interface ProductMediaDTO {
  id: string | null;
  cloudinaryPublicId: string;
  url: string | null;
  thumbUrl: string | null;
  order: number;
}

/** Card shape — shared by the admin table and the app-facing home rails. */
export interface ProductCardDTO {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currency: string;
  badgeText: string | null;
  placement: ProductPlacement;
  dealEndsAt: string | null;
  stock: number;
  ratingAvg: number | null;
  reviewCount: number;
  status: ProductStatus;
}

/** Admin list row — the card plus the denormalised category name and sales. */
export interface ProductRowDTO extends ProductCardDTO {
  categoryId: string | null;
  categoryNameAr: string | null;
  sold: number;
}

export interface ProductDTO extends ProductCardDTO {
  description: string;
  categoryId: string | null;
  subCategoryId: string | null;
  category: { id: string; nameAr: string; nameEn: string | null } | null;
  media: ProductMediaDTO[];
  dynamicFields: Record<string, unknown>;
  specs: { key: string; labelAr: string; labelEn: string | null; value: unknown }[];
  sku: string | null;
  weightGrams: number | null;
  sold: number;
  dealStartsAt: string | null;
  createdAt: string | null;
}

/** `meta` sits inside `data` on every commerce list endpoint, with `pages`. */
export interface ListMeta {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface ProductListParams {
  status?: ProductStatus | '';
  placement?: ProductPlacement | '';
  categoryId?: string;
  search?: string;
  page?: number;
}

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export function useProducts(params: ProductListParams = {}) {
  const qs = buildQuery({
    status: params.status,
    placement: params.placement,
    categoryId: params.categoryId,
    search: params.search,
    page: params.page,
  });
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => get<{ items: ProductRowDTO[]; meta: ListMeta }>(`/admin/products${qs}`),
    staleTime: 30_000,
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => get<ProductDTO>(`/admin/products/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}
