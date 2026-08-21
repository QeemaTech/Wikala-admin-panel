import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, del } from '@/lib/api/client';
import type { ContentPageDTO, ContentPageKind, FaqItemDTO } from './use-content-pages';

export interface ContentPageCreatePayload {
  slug: string;
  titleAr: string;
  titleEn?: string;
  bodyAr?: string;
  bodyEn?: string;
  kind: ContentPageKind;
  icon?: string;
  order?: number;
  showInAppMenu?: boolean;
  faqItems?: Omit<FaqItemDTO, 'id'>[];
}

export type ContentPageUpdatePayload = Partial<ContentPageCreatePayload>;

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['content-pages'] });
}

export function useCreateContentPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ContentPageCreatePayload) => post<ContentPageDTO>('/admin/content-pages', payload),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateContentPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ContentPageUpdatePayload }) =>
      patch<ContentPageDTO>(`/admin/content-pages/${id}`, payload),
    onSuccess: () => invalidate(qc),
  });
}

export function usePublishContentPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<ContentPageDTO>(`/admin/content-pages/${id}/publish`, {}),
    onSuccess: () => invalidate(qc),
  });
}

export function useUnpublishContentPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<ContentPageDTO>(`/admin/content-pages/${id}/unpublish`, {}),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteContentPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/admin/content-pages/${id}`),
    onSuccess: () => invalidate(qc),
  });
}
