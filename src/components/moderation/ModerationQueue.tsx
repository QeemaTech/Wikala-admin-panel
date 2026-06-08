'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { AdCard } from '@/components/ads/AdCard';
import { useModerationQueue } from '@/features/moderation/use-moderation-queue';
import { useCategories } from '@/features/categories/use-categories';
import type { ModerationListParams, ModerationItemDTO } from '@/features/moderation/use-moderation-queue';

interface ModerationQueueProps {
  params: ModerationListParams;
  selected: Set<string>;
  onToggleSelect: (adId: string) => void;
  onView: (item: ModerationItemDTO) => void;
  onApprove: (adId: string) => void;
  onReject: (adId: string) => void;
  onEscalate: (adId: string) => void;
  onPageChange: (page: number) => void;
}

export function ModerationQueue({
  params,
  selected,
  onToggleSelect,
  onView,
  onApprove,
  onReject,
  onEscalate,
  onPageChange,
}: ModerationQueueProps) {
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

  const start = meta ? (meta.page - 1) * meta.pageSize + 1 : 1;
  const end = meta ? Math.min(meta.page * meta.pageSize, meta.total) : items.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="relative">
            {params.tab === 'QUEUE' && (
              <label className="absolute start-2 top-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-[4px] border-2 border-border bg-white shadow-sm has-[:checked]:border-wk-blue has-[:checked]:bg-wk-blue">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected.has(item.ad.id)}
                  onChange={() => onToggleSelect(item.ad.id)}
                  aria-label={`تحديد ${item.ad.title}`}
                />
                {selected.has(item.ad.id) && (
                  <Icon name="check" size={11} color="#fff" />
                )}
              </label>
            )}
            <AdCard
              item={item}
              categoryName={item.ad.categoryId ? categoryMap.get(item.ad.categoryId) ?? null : null}
              onApprove={onApprove}
              onReject={onReject}
              onEscalate={onEscalate}
              onView={onView}
            />
          </div>
        ))}
      </div>

      {meta && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-[12.5px] text-muted">
          <span>تعرض {start}–{end} من {meta.total} إعلان</span>
          {meta.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => onPageChange(meta.page + 1)}
                className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
                aria-label="التالي"
              >
                <Icon name="chevron-start" size={14} />
              </button>
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`grid h-8 w-8 place-items-center rounded-[8px] border font-mono text-[12px] ${
                      meta.page === p
                        ? 'border-wk-blue bg-wk-blue text-white'
                        : 'border-border bg-surface text-ink hover:bg-surface-2'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              {meta.totalPages > 5 && (
                <>
                  <span className="px-1">...</span>
                  <button
                    onClick={() => onPageChange(meta.totalPages)}
                    className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface font-mono text-[12px] text-ink hover:bg-surface-2"
                  >
                    {meta.totalPages}
                  </button>
                </>
              )}
              <button
                disabled={meta.page <= 1}
                onClick={() => onPageChange(meta.page - 1)}
                className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
                aria-label="السابق"
              >
                <Icon name="chevron-end" size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
