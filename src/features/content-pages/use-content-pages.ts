import { useQuery } from '@tanstack/react-query';
import { get, getPaged, type PageMeta } from '@/lib/api/client';

export type ContentPageKind = 'LEGAL' | 'HELP' | 'ABOUT' | 'FAQ' | 'OTHER';
export type ContentPageStatus = 'DRAFT' | 'PUBLISHED';

export const KIND_LABELS: Record<ContentPageKind, string> = {
  LEGAL: 'قانوني',
  HELP: 'مساعدة',
  ABOUT: 'عن التطبيق',
  FAQ: 'أسئلة شائعة',
  OTHER: 'أخرى',
};

export const STATUS_LABELS: Record<ContentPageStatus, string> = {
  DRAFT: 'مسودة',
  PUBLISHED: 'منشور',
};

export interface FaqItemDTO {
  id: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  order: number;
}

export interface ContentPageDTO {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  kind: ContentPageKind;
  status: ContentPageStatus;
  icon: string | null;
  order: number;
  showInAppMenu: boolean;
  version: number;
  bodyAr: string;
  bodyEn: string;
  faqItems: FaqItemDTO[];
  publishedAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  createdAt: string | null;
}

export interface ContentPagesParams {
  status?: ContentPageStatus;
  kind?: ContentPageKind;
  page?: number;
}

function buildQuery(params: ContentPagesParams): string {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.kind) q.set('kind', params.kind);
  if (params.page && params.page > 1) q.set('page', String(params.page));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function useContentPages(params: ContentPagesParams = {}) {
  return useQuery({
    queryKey: ['content-pages', params],
    queryFn: () => getPaged<ContentPageDTO>(`/admin/content-pages${buildQuery(params)}`),
    staleTime: 15_000,
  });
}

export function useContentPage(id: string | null) {
  return useQuery({
    queryKey: ['content-pages', id],
    queryFn: () => get<ContentPageDTO>(`/admin/content-pages/${id}`),
    enabled: !!id,
  });
}

export type { PageMeta };
