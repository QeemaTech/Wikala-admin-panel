'use client';

import { MobilePreviewPane } from '@/components/preview/MobilePreviewPane';
import { Icon } from '@/components/ui/Icon';
import { SLOT_LABELS, type BannerSlot } from '@/features/banners/use-banners';

interface BannerHomePreviewProps {
  title: string;
  subtitle?: string;
  ctaText: string;
  imageUrl?: string | null;
  slot: BannerSlot;
}

function BannerMock({ title, subtitle, ctaText, imageUrl }: Omit<BannerHomePreviewProps, 'slot'>) {
  return (
    <div className="relative mb-2 h-16 overflow-hidden rounded-[8px] bg-gradient-to-br from-wk-blue to-[#4d85bc] p-2">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      ) : (
        <div className="relative flex h-full flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-white">{title || 'عنوان البانر'}</div>
            {subtitle && <div className="text-[9px] text-white/80">{subtitle}</div>}
          </div>
          <span className="w-fit rounded-full bg-white/25 px-1.5 py-0.5 text-[8px] font-medium text-white">{ctaText || 'اطلب الآن'}</span>
        </div>
      )}
    </div>
  );
}

/** Mobile home preview with the draft banner placed in its slot (design Banners). */
export function BannerHomePreview(props: BannerHomePreviewProps) {
  const { slot } = props;
  const inHomeTop = slot === 'HOME_TOP';
  const inHomeMid = slot === 'HOME_MID';
  const inCategorySlot = slot.startsWith('CATEGORY_') || slot === 'AUCTIONS';

  return (
    <div className="flex flex-col items-center gap-3">
      <MobilePreviewPane scale={0.95}>
        {/* Header */}
        <div className="mb-2.5 flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-avatar text-[10px] font-semibold text-white">م</div>
          <div className="flex-1 text-[11px]">
            <div className="font-bold text-ink">مرحباً مروة</div>
            <div className="text-[10px] text-muted">مدينة نصر</div>
          </div>
          <Icon name="bell" size={14} className="text-muted" />
        </div>

        {/* Search */}
        <div className="mb-2.5 flex items-center gap-1.5 rounded-[8px] border border-border px-2 py-1.5">
          <Icon name="search" size={12} className="text-muted" />
          <span className="text-[11px] text-muted">بحث...</span>
        </div>

        {inHomeTop && <BannerMock {...props} />}

        {/* Category grid */}
        <div className="mb-2.5 grid grid-cols-5 gap-1.5">
          {['🏪', '🏠', '📱', '👗', '🍼'].map((g, i) => (
            <div key={i} className="rounded-[6px] bg-surface-2 py-1.5 text-center text-[14px]">{g}</div>
          ))}
        </div>

        {inHomeMid && <BannerMock {...props} />}

        {/* Flash row */}
        <div className="mb-1.5 text-[10px] font-bold text-ink">عروض الفلاش</div>
        <div className="flex gap-1.5">
          <div className="h-[84px] flex-1 rounded-[8px] bg-surface-2" />
          <div className="h-[84px] flex-1 rounded-[8px] bg-surface-2" />
        </div>
      </MobilePreviewPane>

      {inCategorySlot && (
        <p className="text-center text-[11.5px] text-muted">
          هذا البانر يظهر في <b className="text-ink">{SLOT_LABELS[slot]}</b> وليس على الصفحة الرئيسية.
        </p>
      )}
    </div>
  );
}
