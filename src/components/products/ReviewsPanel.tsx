'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Segmented';
import { ReviewRow } from './ReviewRow';
import { formatNumber } from '@/lib/i18n/format';
import {
  useModerateReview,
  useReviewQueue,
  type ReviewStatus,
} from '@/features/products/use-reviews';

const FILTERS = [
  { value: 'PENDING', label: 'بانتظار المراجعة' },
  { value: 'PUBLISHED', label: 'منشورة' },
  { value: 'REJECTED', label: 'مرفوضة' },
  { value: '', label: 'الكل' },
];

export function ReviewsPanel() {
  const [status, setStatus] = useState<ReviewStatus | ''>('PENDING');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useReviewQueue({ status, page });
  const moderate = useModerateReview();
  const [error, setError] = useState<string | null>(null);

  const act = (id: string, next: 'PUBLISHED' | 'REJECTED') => {
    setError(null);
    moderate.mutate(
      { id, status: next },
      { onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر تنفيذ الإجراء.') },
    );
  };

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <Segmented
        options={FILTERS}
        value={status}
        onChange={(v) => {
          setStatus(v as ReviewStatus | '');
          setPage(1);
        }}
      />

      {error && <p className="text-[12.5px] text-red">{error}</p>}

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-[10px] bg-surface-2" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-10 text-center text-[13px] text-muted">تعذّر تحميل التقييمات</p>
      ) : items.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
          <Icon name="star" size={28} className="mx-auto text-muted" />
          <p className="mt-2 text-[13px] text-muted">لا توجد تقييمات في هذه القائمة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <ReviewRow key={r.id} review={r} pending={moderate.isPending} onModerate={act} />
          ))}
        </div>
      )}

      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-[12.5px] text-muted">
          <span>
            صفحة {formatNumber(meta.page)} من {formatNumber(meta.pages)} · {formatNumber(meta.total)} تقييم
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="السابق"
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
            >
              <Icon name="chevron-end" size={14} />
            </button>
            <span className="px-2 font-mono">{formatNumber(meta.page)}</span>
            <button
              disabled={meta.page >= meta.pages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="التالي"
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
            >
              <Icon name="chevron-start" size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
