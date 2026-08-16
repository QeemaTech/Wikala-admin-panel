'use client';

import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Segmented } from '@/components/ui/Segmented';
import { Icon } from '@/components/ui/Icon';
import { SearchFilterBar } from '@/components/search/SearchFilterBar';
import { AdBrowseCard } from '@/components/ads/AdBrowseCard';
import { AdDetail } from '@/components/ads/AdDetail';
import { AdEditForm } from '@/components/ads/AdEditForm';
import { AdLocationMap } from '@/components/map/AdLocationMap';
import { useSearchFilters } from '@/features/search/use-search-filters';
import { useAdminAds, type AdminAdStatusScope, type AdminAdCard } from '@/features/ads/use-admin-ads';
import { useAdDetail } from '@/features/ads/use-ad-detail';
import { useTakedownAd, useRestoreAd, useDeleteAd } from '@/features/ads/use-ad-actions';
import { formatNumber } from '@/lib/i18n/format';

const VIEW_OPTIONS = [
  { value: 'list', label: 'قائمة' },
  { value: 'map', label: 'خريطة' },
];
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'نشطة' },
  { value: 'PENDING', label: 'قيد المراجعة' },
  { value: 'DRAFT', label: 'مسودّات' },
  { value: 'ARCHIVED', label: 'مسحوبة' },
  { value: 'ALL', label: 'الكل' },
];

const PAGE_SIZE = 24;

export default function AdsPage() {
  const { filters, setFilters } = useSearchFilters();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [status, setStatus] = useState<AdminAdStatusScope>('ACTIVE');
  const [page, setPage] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | null>(null);

  const { data, isLoading, isError, isFetching } = useAdminAds(filters, status, page, PAGE_SIZE);
  const detailQuery = useAdDetail(activeId);
  const takedown = useTakedownAd();
  const restore = useRestoreAd();
  const del = useDeleteAd();
  const busy = takedown.isPending || restore.isPending || del.isPending;

  const items = data?.items ?? [];
  const meta = data?.meta;

  const resetPage = () => setPage(1);
  const closeDrawer = () => { setActiveId(null); setMode(null); };

  const onTakedown = (ad: AdminAdCard) => {
    const reason = window.prompt('سبب سحب الإعلان (اختياري):', '');
    if (reason === null) return; // cancelled
    takedown.mutate({ adId: ad.id, reason: reason.trim() || undefined });
  };
  const onRestore = (ad: AdminAdCard) => {
    if (window.confirm(`استرجاع الإعلان «${ad.title}» وإعادته للنشر؟`)) restore.mutate(ad.id);
  };
  const onDelete = (ad: AdminAdCard) => {
    if (window.confirm(`حذف الإعلان «${ad.title}» نهائيًا؟ لا يمكن التراجع.`)) del.mutate(ad.id);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="إدارة الإعلانات"
        sub="تصفّح وبحث وإدارة الإعلانات النشطة عبر مصر والسعودية والإمارات · عرض · تعديل · سحب · استرجاع · حذف"
        actions={<Segmented options={VIEW_OPTIONS} value={view} onChange={(v) => setView(v as 'list' | 'map')} />}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => { setStatus(v as AdminAdStatusScope); resetPage(); }}
          />
          <div className="min-w-[280px] flex-1">
            <SearchFilterBar
              value={filters}
              onChange={(next) => { setFilters(next); resetPage(); }}
              facets={data?.facets}
              facetsLoading={isFetching}
              placeholder="ابحث في الإعلانات…"
            />
          </div>
        </div>

        {view === 'map' ? (
          <AdLocationMap filters={filters} height={560} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[300px] animate-pulse rounded-[var(--radius)] border border-border bg-surface-2" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
            <Icon name="alert-triangle" size={28} className="mx-auto text-red" />
            <p className="mt-2 text-[13px] text-muted">تعذّر تحميل الإعلانات</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-border bg-surface py-16 text-center">
            <Icon name="search" size={28} className="mx-auto text-muted" />
            <p className="mt-2 text-[13px] text-muted">لا توجد إعلانات مطابقة</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-[12.5px] text-muted">
              <span>{meta ? `${formatNumber(meta.total)} إعلان` : ''}</span>
              {(isFetching || busy) && <span>جارٍ التحديث…</span>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((ad) => (
                <AdBrowseCard
                  key={ad.id}
                  ad={ad}
                  busy={busy}
                  onView={(a) => { setActiveId(a.id); setMode('view'); }}
                  onEdit={(a) => { setActiveId(a.id); setMode('edit'); }}
                  onTakedown={onTakedown}
                  onRestore={onRestore}
                  onDelete={onDelete}
                />
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 border-t border-border pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
                  aria-label="السابق"
                >
                  <Icon name="chevron-end" size={14} />
                </button>
                <span className="px-3 font-mono text-[12.5px] text-muted">
                  {formatNumber(page)} / {formatNumber(meta.totalPages)}
                </span>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="grid h-8 w-8 place-items-center rounded-[8px] border border-border bg-surface text-ink disabled:opacity-40"
                  aria-label="التالي"
                >
                  <Icon name="chevron-start" size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* View drawer (same component as moderation) */}
      {mode === 'view' && detailQuery.data && (
        <AdDetail ad={detailQuery.data} onClose={closeDrawer} />
      )}
      {/* Edit form */}
      {mode === 'edit' && detailQuery.data && (
        <AdEditForm ad={detailQuery.data} onClose={closeDrawer} onSuccess={closeDrawer} />
      )}
      {activeId && detailQuery.isLoading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30">
          <div className="rounded-[12px] bg-white px-6 py-4 text-[13px] text-muted shadow-xl">جارٍ تحميل الإعلان…</div>
        </div>
      )}
    </div>
  );
}
