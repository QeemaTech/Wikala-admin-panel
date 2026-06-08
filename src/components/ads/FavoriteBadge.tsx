import { Icon } from '@/components/ui/Icon';
import { formatNumber } from '@/lib/i18n/format';

interface FavoriteBadgeProps {
  /** Ad `favCount` (API Contract §9 AdDTO). Read-only — admins never write favorites. */
  count: number | null | undefined;
  size?: number;
  className?: string;
}

/**
 * Read-only favorite-count indicator for ad cards and the ad detail view.
 * Renders nothing when no count is available (e.g. card DTOs that omit
 * `favCount`), so callers can pass the field unconditionally.
 */
export function FavoriteBadge({ count, size = 13, className }: FavoriteBadgeProps) {
  if (count == null || !Number.isFinite(count)) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-muted ${className ?? ''}`}
      title="عدد الإضافات للمفضلة"
    >
      <Icon name="heart" size={size} className="text-red" />
      <span className="font-mono text-[12px]">{formatNumber(count)}</span>
    </span>
  );
}
