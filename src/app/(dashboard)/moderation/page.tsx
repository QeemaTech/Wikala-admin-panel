'use client';

import { useState, useMemo, useCallback } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Tabs } from '@/components/ui/Tabs';
import { Segmented } from '@/components/ui/Segmented';
import { Icon } from '@/components/ui/Icon';
import { AdDetail } from '@/components/ads/AdDetail';
import { ModerationQueue } from '@/components/moderation/ModerationQueue';
import { BulkApproveBar } from '@/components/moderation/BulkApproveBar';
import { AiRulesEditor } from '@/components/moderation/AiRulesEditor';
import { AdvancedFilterPanel } from '@/components/moderation/AdvancedFilterPanel';
import { SearchFilterBar } from '@/components/search/SearchFilterBar';
import { EMPTY_FILTERS, type SearchFilters } from '@/features/search/use-search-filters';
import {
  useApproveAd,
  useRejectAd,
  useEscalateAd,
} from '@/features/moderation/use-moderation-actions';
import { useTabCounts, useModerationStats } from '@/features/moderation/use-moderation-queue';
import { useModerationSocket } from '@/features/moderation/use-moderation-socket';
import { useCategories } from '@/features/categories/use-categories';
import type { ModerationTab, ModerationRisk, ModerationItemDTO } from '@/features/moderation/use-moderation-queue';
import type { AdvancedFilters } from '@/components/moderation/AdvancedFilterPanel';

const RISK_OPTIONS = [
  { value: 'ALL', label: 'الكل' },
  { value: 'HIGH', label: 'مخاطر عالية' },
  { value: 'MED', label: 'متوسطة' },
  { value: 'LOW', label: 'منخفضة' },
  { value: 'AUCTIONS', label: 'مزادات' },
];

export default function ModerationPage() {
  const [tab, setTab] = useState<ModerationTab>('QUEUE');
  const [risk, setRisk] = useState<ModerationRisk>('ALL');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ModerationItemDTO | null>(null);

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [escalateId, setEscalateId] = useState<string | null>(null);
  const [escalateReason, setEscalateReason] = useState('');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAiRules, setShowAiRules] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const approveAd = useApproveAd();
  const rejectAd = useRejectAd();
  const escalateAd = useEscalateAd();
  const tabCounts = useTabCounts();
  const statsQuery = useModerationStats();
  const categoriesQuery = useCategories();

  useModerationSocket();

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (cats: { id: string; nameAr: string; children?: unknown[] }[]) => {
      for (const c of cats) {
        map.set(c.id, c.nameAr);
        if (Array.isArray(c.children) && c.children.length) walk(c.children as typeof cats);
      }
    };
    if (categoriesQuery.data?.items) walk(categoriesQuery.data.items);
    return map;
  }, [categoriesQuery.data]);

  // Shared search/filter bar drives the moderation queue's own `search` param
  // (NOT /search — that endpoint is ACTIVE-ads-only). The bar debounces text
  // internally, so we apply its emitted value directly. Category/tier/date/AI
  // filters remain in the advanced panel.
  const searchFilters = useMemo<SearchFilters>(
    () => ({ ...EMPTY_FILTERS, q: debouncedSearch }),
    [debouncedSearch],
  );
  const handleSearchChange = useCallback((next: SearchFilters) => {
    setDebouncedSearch(next.q);
    setPage(1);
  }, []);

  const handleTabChange = (id: string) => {
    setTab(id as ModerationTab);
    setPage(1);
    setSelected(new Set());
  };

  const handleToggleSelect = (adId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(adId)) next.delete(adId);
      else next.add(adId);
      return next;
    });
  };

  const handleApprove = (adId: string) => {
    setActionError(null);
    approveAd.mutate(adId, {
      onError: (e) => setActionError(e instanceof Error ? e.message : 'تعذّر قبول الإعلان.'),
    });
  };

  const confirmReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setActionError(null);
    try {
      await rejectAd.mutateAsync({ adId: rejectId, reason: rejectReason });
      setRejectId(null);
      setRejectReason('');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'تعذّر رفض الإعلان.');
    }
  };

  const confirmEscalate = async () => {
    if (!escalateId) return;
    setActionError(null);
    try {
      await escalateAd.mutateAsync({ adId: escalateId, reason: escalateReason.trim() || 'بدون سبب' });
      setEscalateId(null);
      setEscalateReason('');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'تعذّر تصعيد الإعلان.');
    }
  };

  const stats = statsQuery.data;
  const fmtReviewTime = (seconds: number): string => {
    if (seconds <= 0) return '—';
    if (seconds < 60) return `${seconds} ثانية`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} دقيقة`;
    return `${Math.round(seconds / 3600)} ساعة`;
  };
  const subtitle = stats
    ? `${stats.queueSize} في انتظار المراجعة · متوسط المراجعة ${fmtReviewTime(stats.avgReviewSeconds)} · عالج AI ${stats.aiAutoHandledPct}% تلقائياً`
    : 'مراجعة الإعلانات المُعلَّمة آليًا · قبول، رفض، أو تصعيد';

  const tabItems = [
    { id: 'QUEUE', label: 'قائمة الانتظار', count: tabCounts['QUEUE'] ?? null },
    { id: 'FLAGGED', label: 'مُبلَّغ عنها', count: tabCounts['FLAGGED'] ?? null },
    { id: 'APPROVED', label: 'تمت الموافقة', count: tabCounts['APPROVED'] ?? null },
    { id: 'REJECTED', label: 'مرفوضة', count: tabCounts['REJECTED'] ?? null },
  ];

  const activeFiltersCount = Object.values(advancedFilters).filter(Boolean).length;

  const params = {
    tab,
    risk,
    search: debouncedSearch || undefined,
    page,
    ...advancedFilters,
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="مراجعة الإعلانات"
        sub={subtitle}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAiRules(true)}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
            >
              <Icon name="sliders" size={14} /> إعداد قواعد AI
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-40"
            >
              <Icon name="check" size={14} />
              موافقة مجمّعة{selected.size > 0 ? ` (${selected.size})` : ''}
            </button>
          </div>
        }
      />

      <Tabs items={tabItems} value={tab} onChange={handleTabChange} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            options={RISK_OPTIONS}
            value={risk}
            onChange={(v) => { setRisk(v as ModerationRisk); setPage(1); }}
          />
          <div className="min-w-[280px] flex-1">
            <SearchFilterBar
              value={searchFilters}
              onChange={handleSearchChange}
              show={{ category: false, price: false, condition: false, brand: false, governorate: false, district: false }}
              placeholder="بحث برقم الإعلان أو البائع..."
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className={`flex items-center gap-1.5 rounded-[8px] border px-3.5 py-2 text-[13px] font-medium transition-colors ${
              activeFiltersCount > 0
                ? 'border-wk-blue bg-wk-blue/5 text-wk-blue'
                : 'border-border text-ink hover:bg-surface-2'
            }`}
          >
            <Icon name="filter" size={14} />
            فلتر متقدم
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-wk-blue px-1.5 py-0.5 text-[10px] text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {actionError && (
          <div className="flex items-center justify-between gap-3 rounded-[8px] border border-red/30 bg-red-50 px-4 py-2.5 text-[13px] text-red">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} aria-label="إغلاق" className="shrink-0">
              <Icon name="x" size={14} />
            </button>
          </div>
        )}

        <ModerationQueue
          params={params}
          selected={selected}
          onToggleSelect={handleToggleSelect}
          onView={setDetail}
          onApprove={handleApprove}
          onReject={(adId) => setRejectId(adId)}
          onEscalate={(adId) => setEscalateId(adId)}
          onPageChange={setPage}
        />
      </div>

      <BulkApproveBar selected={selected} onClear={() => setSelected(new Set())} />

      {detail && (
        <AdDetail
          ad={detail.ad}
          categoryName={detail.ad.categoryId ? categoryMap.get(detail.ad.categoryId) ?? null : null}
          onClose={() => setDetail(null)}
        />
      )}

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
            <h3 className="mb-1 text-[15px] font-semibold text-ink">رفض الإعلان</h3>
            <p className="mb-3 text-[12.5px] text-muted">سيتم إخطار البائع بسبب الرفض.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="سبب الرفض..."
              rows={3}
              className="w-full resize-none rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
              >
                إلغاء
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim() || rejectAd.isPending}
                className="rounded-[8px] bg-red px-4 py-2 text-[13px] font-medium text-white hover:bg-red/90 disabled:opacity-50"
              >
                {rejectAd.isPending ? 'جاري الرفض...' : 'تأكيد الرفض'}
              </button>
            </div>
          </div>
        </div>
      )}

      {escalateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
            <h3 className="mb-1 text-[15px] font-semibold text-ink">تصعيد الإعلان</h3>
            <p className="mb-3 text-[12.5px] text-muted">سيُعاد توجيه الإعلان إلى قائمة المشرفين.</p>
            <textarea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="سبب التصعيد (اختياري)..."
              rows={2}
              className="w-full resize-none rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => { setEscalateId(null); setEscalateReason(''); }}
                className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
              >
                إلغاء
              </button>
              <button
                onClick={confirmEscalate}
                disabled={escalateAd.isPending}
                className="rounded-[8px] bg-amber px-4 py-2 text-[13px] font-medium text-white hover:bg-amber/90 disabled:opacity-50"
              >
                {escalateAd.isPending ? 'جاري التصعيد...' : 'تصعيد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAiRules && <AiRulesEditor onClose={() => setShowAiRules(false)} />}
      {showFilters && (
        <AdvancedFilterPanel
          value={advancedFilters}
          onChange={setAdvancedFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}
