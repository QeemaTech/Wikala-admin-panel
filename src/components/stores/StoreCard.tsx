'use client';

import { Icon } from '@/components/ui/Icon';
import { formatNumber } from '@/lib/i18n/format';
import { StoreLogo, storeBannerStyle } from './StoreLogo';
import type { StoreDTO } from '@/features/stores/use-stores';

const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;

function joinedLabel(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(AR_GREG, { month: 'long', year: 'numeric' }).format(new Date(iso)).replace(BIDI, '');
}

interface StoreCardProps {
  store: StoreDTO;
  onView: (store: StoreDTO) => void;
  onSettings: (store: StoreDTO) => void;
}

export function StoreCard({ store, onView, onSettings }: StoreCardProps) {
  const category = store.categoryNames[0] ?? 'غير مصنّف';

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-sm">
      <div className="relative h-[110px]" style={storeBannerStyle(store.bannerUrl)}>
        {store.premiumActive && (
          <div className="absolute end-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-violet">
            <Icon name="crown" size={12} /> Premium
          </div>
        )}
        <StoreLogo name={store.name} logoUrl={store.logoUrl} className="absolute -bottom-[22px] start-3.5 h-14 w-14 text-[18px]" />
      </div>

      <div className="px-[18px] pb-3.5 pt-7">
        <div className="text-[15px] font-bold text-ink">{store.name}</div>
        <div className="mt-0.5 text-[12px] text-muted">
          {category} · {formatNumber(store.branches.length)} فرع
        </div>
        <div className="mt-3 flex items-center gap-3.5 text-[12.5px]">
          <span className="flex items-center gap-1" title="الزيارات">
            <Icon name="eye" size={13} className="text-muted" />
            <b className="font-mono text-ink">{formatNumber(store.stats.views)}</b>
          </span>
          <span className="flex items-center gap-1" title="الإعلانات">
            <Icon name="shopping-bag" size={13} className="text-muted" />
            <b className="font-mono text-ink">{formatNumber(store.adsCount)}</b>
          </span>
          <span className="flex items-center gap-1" title="التقييم">
            <Icon name="star" size={13} className="text-amber" />
            <b className="font-mono text-ink">{store.rating != null ? store.rating.toFixed(1) : '—'}</b>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-3.5 py-2.5">
        <span className="flex-1 text-[12px] text-muted">منضم منذ {joinedLabel(store.joinedAt)}</span>
        <button
          type="button"
          onClick={() => onView(store)}
          className="rounded-[7px] border border-border px-2.5 py-1 text-[12px] font-medium text-ink-2 hover:bg-surface-2"
        >
          عرض
        </button>
        <button
          type="button"
          onClick={() => onSettings(store)}
          aria-label="إعدادات المتجر"
          className="flex items-center gap-1 rounded-[7px] border border-border px-2.5 py-1 text-[12px] font-medium text-ink-2 hover:bg-surface-2"
        >
          <Icon name="cog" size={13} /> إعدادات
        </button>
      </div>
    </div>
  );
}
