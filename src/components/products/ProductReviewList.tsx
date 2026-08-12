'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ReviewRow } from './ReviewRow';
import { useModerateReview, useReviewQueue } from '@/features/products/use-reviews';

/**
 * Every review on one product, pending ones included — the app-facing endpoint
 * only returns published reviews, so this reads the moderation list filtered by
 * product instead.
 */
export function ProductReviewList({ productId }: { productId: string }) {
  const { data, isLoading, isError } = useReviewQueue({ productId });
  const moderate = useModerateReview();
  const [error, setError] = useState<string | null>(null);

  const act = (id: string, status: 'PUBLISHED' | 'REJECTED') => {
    setError(null);
    moderate.mutate(
      { id, status },
      { onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر تنفيذ الإجراء.') },
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 rounded-[10px] bg-surface-2" />
        ))}
      </div>
    );
  }

  if (isError) return <p className="py-3 text-[13px] text-muted">تعذّر تحميل التقييمات</p>;

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-muted">
        <Icon name="star" size={24} className="mx-auto" />
        <p className="mt-2 text-[12.5px]">لا توجد تقييمات على هذا المنتج</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-[12.5px] text-red">{error}</p>}
      {items.map((r) => (
        <ReviewRow
          key={r.id}
          review={r}
          showProduct={false}
          pending={moderate.isPending}
          onModerate={act}
        />
      ))}
    </div>
  );
}
