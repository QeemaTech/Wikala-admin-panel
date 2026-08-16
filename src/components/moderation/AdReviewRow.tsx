'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { StatusPill } from '@/components/ui/StatusPill';
import { Stars } from '@/components/products/ReviewRow';
import { formatRelativeTime } from '@/lib/i18n/format';
import type { AdReviewDTO } from '@/features/ads/use-ad-reviews';

interface AdReviewRowProps {
  review: AdReviewDTO;
  /** Hidden on an ad's own page, where every row is the same ad. */
  showAd?: boolean;
  pending: boolean;
  onModerate: (id: string, status: 'PUBLISHED' | 'REJECTED') => void;
}

/**
 * One ad-review moderation row. Same shape as the product review row, but the
 * two DTOs differ (`adTitle` vs `productTitle`) and they hit different
 * endpoints, so they stay separate rather than sharing a loosely-typed prop.
 */
export function AdReviewRow({ review, showAd = true, pending, onModerate }: AdReviewRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-[10px] border border-border bg-white p-3.5">
      <Avatar name={review.author?.name ?? '؟'} src={review.author?.avatarUrl ?? undefined} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-ink">
            {review.author?.name ?? 'مستخدم محذوف'}
          </span>
          <Stars rating={review.rating} />
          <StatusPill status={review.status} />
          {review.createdAt && (
            <span className="text-[11px] text-muted">{formatRelativeTime(review.createdAt)}</span>
          )}
        </div>
        {showAd && <p className="mt-0.5 text-[11.5px] text-muted">{review.adTitle ?? '—'}</p>}
        {review.body && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{review.body}</p>}
      </div>
      {review.status !== 'PUBLISHED' && (
        <button
          onClick={() => onModerate(review.id, 'PUBLISHED')}
          disabled={pending}
          className="flex items-center gap-1 rounded-[7px] border border-green/30 bg-green/10 px-2.5 py-1.5 text-[12px] font-medium text-green disabled:opacity-50"
        >
          <Icon name="check" size={12} /> نشر
        </button>
      )}
      {review.status !== 'REJECTED' && (
        <button
          onClick={() => onModerate(review.id, 'REJECTED')}
          disabled={pending}
          className="flex items-center gap-1 rounded-[7px] border border-border px-2.5 py-1.5 text-[12px] font-medium text-muted hover:text-red disabled:opacity-50"
        >
          <Icon name="x" size={12} /> رفض
        </button>
      )}
    </div>
  );
}
