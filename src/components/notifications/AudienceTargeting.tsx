'use client';

import { Icon } from '@/components/ui/Icon';
import { Select } from '@/components/forms/Field';
import { formatNumber } from '@/lib/i18n/format';
import { GOVERNORATES, GOVERNORATE_LABELS } from '@/lib/constants/enums';
import { useCategories } from '@/features/categories/use-categories';
import type { AudienceQuery } from '@/features/notifications/use-campaigns';

interface AudienceTargetingProps {
  value: AudienceQuery;
  onChange: (next: AudienceQuery) => void;
  count: number | null | undefined;
  loading: boolean;
}

const TIERS = [
  { value: 'VERIFIED', label: 'موثقون فقط' },
  { value: 'PREMIUM', label: 'بريميوم فقط' },
];

const LAST_ACTIVE = [
  { value: 30, label: '30 يوم' },
  { value: 7, label: '7 أيام' },
  { value: 1, label: 'اليوم' },
];

export function AudienceTargeting({ value, onChange, count, loading }: AudienceTargetingProps) {
  const { data: cats } = useCategories();
  const categories = cats?.items ?? [];

  const tierValue = value.tier?.[0] ?? '';
  const govValue = value.governorate?.[0] ?? '';

  return (
    <div className="mt-[18px] rounded-[var(--radius)] border border-border bg-surface-2 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[14px] font-bold text-ink">الجمهور المستهدف</div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11.5px] font-medium text-ink">
          {loading ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent" />
              جارٍ التقدير…
            </>
          ) : (
            <>~ {formatNumber(count ?? 0)} مستخدم</>
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="المستوى">
          <Select
            value={tierValue}
            onChange={(e) => onChange({ ...value, tier: e.target.value ? [e.target.value] : undefined })}
          >
            <option value="">الكل</option>
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="المحافظة">
          <Select
            value={govValue}
            onChange={(e) => onChange({ ...value, governorate: e.target.value ? [e.target.value] : undefined })}
          >
            <option value="">الكل</option>
            {GOVERNORATES.map((g) => (
              <option key={g} value={g}>{GOVERNORATE_LABELS[g]}</option>
            ))}
          </Select>
        </Field>

        <Field label="الفئة المهتمة بها">
          <Select
            value={value.categoryId ?? ''}
            onChange={(e) => onChange({ ...value, categoryId: e.target.value || undefined })}
          >
            <option value="">أي فئة</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nameAr}</option>
            ))}
          </Select>
        </Field>

        <Field label="آخر نشاط خلال">
          <Select
            value={value.lastActiveWithinDays ?? ''}
            onChange={(e) =>
              onChange({ ...value, lastActiveWithinDays: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <option value="">أي وقت</option>
            {LAST_ACTIVE.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-ink">{label}</label>
      {children}
    </div>
  );
}
