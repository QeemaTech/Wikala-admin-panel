'use client';

import { formatNumber, formatPercent } from '@/lib/i18n/format';
import type { BannerDTO } from '@/features/banners/use-banners';

/**
 * Impression / click / CTR stats for a banner. CTR mirrors the backend's
 * denormalized ratio; banners with no traffic render "—" rather than 0%.
 */
export function BannerStats({ banner, className }: { banner: BannerDTO; className?: string }) {
  const hasTraffic = banner.impressions > 0;
  const ctr = hasTraffic ? formatPercent(banner.ctr || banner.clicks / banner.impressions) : '—';

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] ${className ?? ''}`}>
      <span>
        <span className="text-muted">مشاهدات:</span>{' '}
        <b className="font-mono text-ink">{hasTraffic ? formatNumber(banner.impressions) : '—'}</b>
      </span>
      <span>
        <span className="text-muted">ضغطات:</span>{' '}
        <b className="font-mono text-ink">{hasTraffic ? formatNumber(banner.clicks) : '—'}</b>
      </span>
      <span>
        <span className="text-muted">CTR:</span> <b className="font-mono text-ink">{ctr}</b>
      </span>
    </div>
  );
}
