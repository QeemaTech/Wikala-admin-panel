'use client';

import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatNumber, formatRelativeTime } from '@/lib/i18n/format';
import { governorateLabel, conditionLabel, adTypeLabel } from '@/lib/constants/enums';
import type { AdminAdCard } from '@/features/ads/use-admin-ads';

function fmtPrice(minor: number | null, currency: string): string {
  if (minor == null) return 'السعر عند التواصل';
  return `${formatNumber(Math.round(minor / 100))} ${currency}`;
}

interface AdBrowseCardProps {
  ad: AdminAdCard;
  onView: (ad: AdminAdCard) => void;
  onEdit: (ad: AdminAdCard) => void;
  onTakedown: (ad: AdminAdCard) => void;
  onRestore: (ad: AdminAdCard) => void;
  onDelete: (ad: AdminAdCard) => void;
  /** Feature/unfeature on the app's Today's Deal rail. ACTIVE ads only. */
  onToggleDeal?: (ad: AdminAdCard) => void;
  busy?: boolean;
}

/**
 * Manageable ad tile for the Ads Management grid. Renders the admin card DTO
 * (AdCardDTO + status) with status-aware actions: view, edit, takedown (ACTIVE),
 * restore (ARCHIVED), delete.
 */
export function AdBrowseCard({ ad, onView, onEdit, onTakedown, onRestore, onDelete, onToggleDeal, busy }: AdBrowseCardProps) {
  const loc = [governorateLabel(ad.governorate), ad.district].filter(Boolean).join(' · ');
  const deal = ad.todaysDeal;
  // Featured but past its window. Shown as its own state rather than folded
  // into "not featured", or staff re-feature something already flagged and
  // wonder why the button does nothing.
  const dealExpired = !!deal?.isTodaysDeal && !!deal.dealEndsAt
    && new Date(deal.dealEndsAt).getTime() <= Date.now();

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
      <div className="relative grid h-36 place-items-center bg-surface-2 text-white">
        {ad.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.coverUrl} alt={ad.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Icon name="image-frame" size={38} color="rgba(120,140,160,.6)" strokeWidth={1.2} />
        )}
        <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
          <StatusPill status={ad.status} />
          {ad.type && ad.type !== 'SELL' && (
            <Chip tone={ad.type === 'AUCTION' ? 'violet' : 'amber'}>{adTypeLabel(ad.type)}</Chip>
          )}
        </div>
        {ad.priceMinor != null && (
          <div className="absolute top-2.5 end-2.5 rounded-[8px] bg-white/95 px-2.5 py-1 font-mono text-[12px] font-bold text-wk-blue">
            {fmtPrice(ad.priceMinor, ad.currency)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h4 className="line-clamp-1 text-[14px] font-bold text-ink">{ad.title}</h4>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {ad.condition && <Chip tone="gray">{conditionLabel(ad.condition)}</Chip>}
          {deal?.isTodaysDeal && (
            <Chip tone={dealExpired ? 'red' : 'violet'}>
              {dealExpired ? 'صفقة اليوم · انتهت' : 'صفقة اليوم'}
            </Chip>
          )}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11.5px] text-muted">
          <span className="flex items-center gap-1 truncate">
            <Icon name="location" size={12} className="shrink-0 text-brand" />
            {loc || '—'}
          </span>
          <span className="shrink-0">{ad.publishedAt ? formatRelativeTime(ad.publishedAt) : ''}</span>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => onView(ad)}
            className="flex flex-1 items-center justify-center gap-1 rounded-[8px] border border-border bg-surface px-2 py-[7px] text-[12px] font-medium text-ink transition-colors hover:bg-surface-2"
          >
            <Icon name="eye" size={13} /> عرض
          </button>
          <button
            type="button"
            onClick={() => onEdit(ad)}
            className="flex flex-1 items-center justify-center gap-1 rounded-[8px] border border-border bg-surface px-2 py-[7px] text-[12px] font-medium text-ink transition-colors hover:bg-surface-2"
          >
            <Icon name="pencil" size={13} /> تعديل
          </button>
          {ad.status === 'ACTIVE' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onTakedown(ad)}
              className="flex flex-1 items-center justify-center gap-1 rounded-[8px] border border-amber/30 bg-amber/5 px-2 py-[7px] text-[12px] font-medium text-amber transition-colors hover:bg-amber/10 disabled:opacity-50"
            >
              <Icon name="arrow-down" size={13} /> سحب
            </button>
          )}
          {ad.status === 'ARCHIVED' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRestore(ad)}
              className="flex flex-1 items-center justify-center gap-1 rounded-[8px] border border-green/30 bg-green/5 px-2 py-[7px] text-[12px] font-medium text-green transition-colors hover:bg-green/10 disabled:opacity-50"
            >
              <Icon name="arrow-up" size={13} /> استرجاع
            </button>
          )}
          {/* Only ACTIVE ads can be featured — the backend refuses anything
              else with a 409, and the rail would filter it out regardless. */}
          {onToggleDeal && ad.status === 'ACTIVE' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onToggleDeal(ad)}
              aria-label={deal?.isTodaysDeal ? 'إلغاء صفقة اليوم' : 'إضافة إلى صفقات اليوم'}
              title={deal?.isTodaysDeal ? 'إلغاء صفقة اليوم' : 'إضافة إلى صفقات اليوم'}
              className={`grid h-[33px] w-[33px] shrink-0 place-items-center rounded-[8px] border transition-colors disabled:opacity-50 ${
                deal?.isTodaysDeal
                  ? 'border-violet/40 bg-violet/10 text-violet'
                  : 'border-border bg-surface text-muted hover:bg-violet/10 hover:text-violet'
              }`}
            >
              <Icon name="bolt" size={14} />
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(ad)}
            aria-label="حذف"
            className="grid h-[33px] w-[33px] shrink-0 place-items-center rounded-[8px] border border-border bg-surface text-muted transition-colors hover:bg-red/10 hover:text-red disabled:opacity-50"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
