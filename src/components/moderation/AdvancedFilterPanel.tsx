'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { useCategories } from '@/features/categories/use-categories';
import type { AiVerdict } from '@/features/moderation/use-moderation-queue';

export interface AdvancedFilters {
  categoryId?: string;
  sellerTier?: string;
  dateFrom?: string;
  dateTo?: string;
  aiVerdict?: AiVerdict;
}

interface AdvancedFilterPanelProps {
  value: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
  onClose: () => void;
}

const SELLER_TIERS = [
  { value: 'basic', label: 'عادي' },
  { value: 'verified', label: 'موثّق' },
  { value: 'premium', label: 'مميز' },
];

const AI_VERDICTS: { value: AiVerdict; label: string }[] = [
  { value: 'APPROVE', label: 'قبول آلي' },
  { value: 'FLAG', label: 'مُعلَّم' },
  { value: 'REJECT', label: 'رفض آلي' },
];

function RemovableChip({
  children,
  onRemove,
  label,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  label: string;
}) {
  return (
    <Chip tone="gray">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={label}
        className="-me-1 ms-0.5 rounded-full p-0.5 text-muted hover:bg-border hover:text-ink"
      >
        <Icon name="x" size={11} />
      </button>
    </Chip>
  );
}

export function AdvancedFilterPanel({ value, onChange, onClose }: AdvancedFilterPanelProps) {
  const [draft, setDraft] = useState<AdvancedFilters>(value);
  const categoriesQuery = useCategories();

  const categories = categoriesQuery.data?.items ?? [];

  const apply = () => {
    onChange(draft);
    onClose();
  };

  const reset = () => {
    const empty: AdvancedFilters = {};
    setDraft(empty);
    onChange(empty);
    onClose();
  };

  const set = <K extends keyof AdvancedFilters>(key: K, val: AdvancedFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/20">
      <div className="flex h-full w-80 flex-col overflow-hidden bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-bold text-ink">فلتر متقدم</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] p-1.5 text-muted hover:bg-surface-2"
            aria-label="إغلاق"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Category */}
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">
              الفئة
            </label>
            <select
              value={draft.categoryId ?? ''}
              onChange={(e) => set('categoryId', e.target.value || undefined)}
              className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
            >
              <option value="">كل الفئات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Seller Tier */}
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">
              مستوى البائع
            </label>
            <div className="flex flex-wrap gap-2">
              {SELLER_TIERS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    set('sellerTier', draft.sellerTier === t.value ? undefined : t.value)
                  }
                  className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                    draft.sellerTier === t.value
                      ? 'border-wk-blue bg-wk-blue text-white'
                      : 'border-border text-muted hover:bg-surface-2'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">
              نطاق التاريخ
            </label>
            <div className="flex flex-col gap-2">
              <input
                type="date"
                value={draft.dateFrom ?? ''}
                onChange={(e) => set('dateFrom', e.target.value || undefined)}
                className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
              />
              <input
                type="date"
                value={draft.dateTo ?? ''}
                onChange={(e) => set('dateTo', e.target.value || undefined)}
                className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* AI Verdict */}
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">
              حكم AI
            </label>
            <div className="flex flex-wrap gap-2">
              {AI_VERDICTS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() =>
                    set('aiVerdict', draft.aiVerdict === v.value ? undefined : v.value)
                  }
                  className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                    draft.aiVerdict === v.value
                      ? 'border-wk-blue bg-wk-blue text-white'
                      : 'border-border text-muted hover:bg-surface-2'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Applied chips — each individually removable */}
        {Object.values(draft).some(Boolean) && (
          <div className="flex flex-wrap gap-1.5 border-t border-border px-5 py-3">
            {draft.categoryId && (
              <RemovableChip onRemove={() => set('categoryId', undefined)} label="إزالة فلتر الفئة">
                فئة: {categories.find((c) => c.id === draft.categoryId)?.nameAr ?? draft.categoryId}
              </RemovableChip>
            )}
            {draft.sellerTier && (
              <RemovableChip onRemove={() => set('sellerTier', undefined)} label="إزالة فلتر مستوى البائع">
                {SELLER_TIERS.find((t) => t.value === draft.sellerTier)?.label}
              </RemovableChip>
            )}
            {(draft.dateFrom || draft.dateTo) && (
              <RemovableChip
                onRemove={() => setDraft((p) => ({ ...p, dateFrom: undefined, dateTo: undefined }))}
                label="إزالة فلتر التاريخ"
              >
                {draft.dateFrom ?? '—'} ← {draft.dateTo ?? '—'}
              </RemovableChip>
            )}
            {draft.aiVerdict && (
              <RemovableChip onRemove={() => set('aiVerdict', undefined)} label="إزالة فلتر حكم AI">
                {AI_VERDICTS.find((v) => v.value === draft.aiVerdict)?.label}
              </RemovableChip>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-[8px] border border-border py-2 text-[13px] font-medium text-muted hover:bg-surface-2"
          >
            إعادة تعيين
          </button>
          <button
            type="button"
            onClick={apply}
            className="flex-1 rounded-[8px] bg-brand py-2 text-[13px] font-medium text-white hover:bg-brand-700"
          >
            تطبيق
          </button>
        </div>
      </div>
    </div>
  );
}
