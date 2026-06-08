'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { AdCard } from './AdCard';
import { useModerationQueue, type ModerationListParams, type ModerationItemDTO } from '@/features/ads/use-ads';
import { useCategories } from '@/features/categories/use-categories';

interface AdListProps {
  params: ModerationListParams;
  onView?: (item: ModerationItemDTO) => void;
  onApprove?: (adId: string) => void;
  onReject?: (adId: string) => void;
  onPageChange?: (page: number) => void;
}

export function AdList({ params, onView, onApprove, onReject, onPageChange }: AdListProps) {
  const { data, isLoading, isError } = useModerationQueue(params);
  const categoriesQuery = useCategories();

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (cats: { id: string; nameAr: string; children?: unknown[] }[]) => {
      for (const c of cats) {
        map.set(c.id, c.nameAr);
        if (Array.isArray(c.children) && c.children.length) walk(c.children as typeof cats);
      }
    };
    if (categoriesQuery.data?.items) walk(categoriesQuery.data.items);
    return map;
  }, [categoriesQuery.data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[360px] animate-pulse rounded-[var(--radius)] border border-border bg-surface-2" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
        <Icon name="alert-triangle" size={28} className="mx-auto text-red" />
        <p className="mt-2 text-[13px] text-muted">تعذّر تحميل قائمة الإعلانات</p>
      </div>
    );
  }

  const items = data?.items ?? [];
  const meta = data?.meta;

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
        <Icon name="check" size={28} className="mx-auto text-green" />
        <p className="mt-2 text-[13px] text-muted">لا توجد إعلانات في هذه القائمة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <AdCard
            key={item.id}
            item={item}
            categoryName={item.ad.categoryId ? categoryMap.get(item.ad.categoryId) ?? null : null}
            onApprove={onApprove}
            onReject={onReject}
            onView={onView}
          />
        ))}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-[12.5px] text-muted">
          <span>
            صفحة {meta.page} من {meta.totalPages} · {meta.total} إعلان
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => onPageChange?.(meta.page - 1)}
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
              aria-label="السابق"
            >
              <Icon name="chevron-end" size={14} />
            </button>
            <span className="px-2 font-mono">{meta.page}</span>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange?.(meta.page + 1)}
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
              aria-label="التالي"
            >
              <Icon name="chevron-start" size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
