'use client';

import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { StatusPill } from '@/components/ui/StatusPill';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { formatAmountMinor, formatNumber } from '@/lib/i18n/format';
import {
  PLACEMENT_LABELS,
  type ListMeta,
  type ProductRowDTO,
} from '@/features/products/use-products';

const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(AR_GREG, { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(iso))
    .replace(BIDI, '');
}

/** A FLASH deal drops off the app rail the moment it expires — flag that here. */
function placementChip(p: ProductRowDTO) {
  if (p.placement === 'NONE') return <span className="text-[12px] text-muted">—</span>;
  const expired = !!p.dealEndsAt && new Date(p.dealEndsAt).getTime() <= Date.now();
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Chip tone={p.placement === 'FLASH' ? 'amber' : 'violet'}>
        {PLACEMENT_LABELS[p.placement]}
      </Chip>
      {p.dealEndsAt && (
        <span className={`text-[11px] ${expired ? 'text-red' : 'text-muted'}`}>
          {expired ? 'انتهى' : `حتى ${fmtDate(p.dealEndsAt)}`}
        </span>
      )}
    </div>
  );
}

interface ProductsTableProps {
  items: ProductRowDTO[];
  meta?: ListMeta;
  isLoading: boolean;
  isError: boolean;
  onEdit: (p: ProductRowDTO) => void;
  onDelete: (p: ProductRowDTO) => void;
  onPageChange: (page: number) => void;
}

export function ProductsTable({
  items,
  meta,
  isLoading,
  isError,
  onEdit,
  onDelete,
  onPageChange,
}: ProductsTableProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-[10px] bg-surface-2" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
        <Icon name="alert-triangle" size={28} className="mx-auto text-red" />
        <p className="mt-2 text-[13px] text-muted">تعذّر تحميل المنتجات</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
        <Icon name="archive" size={28} className="mx-auto text-muted" />
        <p className="mt-2 text-[13px] text-muted">لا توجد منتجات مطابقة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-white">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-3 py-2.5 text-start font-medium text-muted">المنتج</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">الفئة</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">السعر</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">المخزون</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">العرض</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">التقييم</th>
              <th className="px-3 py-2.5 text-start font-medium text-muted">الحالة</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Thumbnail
                      src={p.coverUrl}
                      alt={p.title}
                      icon="archive"
                      className="h-10 w-10 rounded-[8px] bg-surface-2"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink">{p.title}</div>
                      {p.badgeText && (
                        <span className="text-[11px] text-muted">{p.badgeText}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-ink-2">{p.categoryNameAr ?? '—'}</td>
                <td className="px-3 py-2.5">
                  <span className="font-mono font-semibold text-ink">
                    {formatAmountMinor(p.priceMinor)}
                  </span>
                  <span className="ms-1 text-[10.5px] text-muted">{p.currency}</span>
                  {p.compareAtPriceMinor != null && (
                    <div className="font-mono text-[11px] text-muted line-through">
                      {formatAmountMinor(p.compareAtPriceMinor)}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`font-mono ${p.stock === 0 ? 'font-semibold text-red' : 'text-ink'}`}
                  >
                    {formatNumber(p.stock)}
                  </span>
                  <div className="text-[11px] text-muted">بيع {formatNumber(p.sold)}</div>
                </td>
                <td className="px-3 py-2.5">{placementChip(p)}</td>
                <td className="px-3 py-2.5">
                  {p.ratingAvg == null ? (
                    <span className="text-[12px] text-muted">—</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-ink">
                      <Icon name="star" size={12} className="text-amber" />
                      {p.ratingAvg.toFixed(1)}
                      <span className="text-[11px] text-muted">({formatNumber(p.reviewCount)})</span>
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <StatusPill status={p.status} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(p)}
                      className="flex items-center gap-1 rounded-[5px] px-2 py-1 text-[12px] text-muted hover:bg-surface hover:text-ink"
                    >
                      <Icon name="pencil" size={12} />
                      تعديل
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      aria-label="حذف"
                      className="grid h-6 w-6 place-items-center rounded-[5px] text-muted hover:bg-red/10 hover:text-red"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-[12.5px] text-muted">
          <span>
            صفحة {formatNumber(meta.page)} من {formatNumber(meta.pages)} · {formatNumber(meta.total)} منتج
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              aria-label="السابق"
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
            >
              <Icon name="chevron-end" size={14} />
            </button>
            <span className="px-2 font-mono">{formatNumber(meta.page)}</span>
            <button
              disabled={meta.page >= meta.pages}
              onClick={() => onPageChange(meta.page + 1)}
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
