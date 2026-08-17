'use client';

import { Card } from '@/components/ui/Card';
import type { SystemSettingsDTO } from '@/features/settings/use-system-settings';

interface AdPostingLimitsPanelProps {
  settings: SystemSettingsDTO;
  onChange: (patch: Partial<SystemSettingsDTO>) => void;
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-ink">{title}</div>
        <div className="mt-0.5 text-[12px] leading-relaxed text-muted">{desc}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

const numInput =
  'w-[72px] rounded-[8px] border border-border bg-surface px-2 py-1.5 text-center font-mono text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10';

/**
 * Free-tier ad allowance + ad lifetime.
 *
 * Both values were already stored in system settings and accepted by
 * `PUT /admin/settings`, but no screen rendered them — so the only way to
 * change the number of ads a free user may post was to edit the database by
 * hand. That number gates the entire posting funnel, so it belongs here.
 *
 * Paid plans are NOT governed by this: a subscriber's allowance comes from
 * their plan's `adQuotaTotal`, edited on the Plans page.
 */
export function AdPostingLimitsPanel({ settings, onChange }: AdPostingLimitsPanelProps) {
  const freeLimit = settings.freeTierAdLimit;

  return (
    <Card
      title="حدود نشر الإعلانات"
      sub="الحد المجاني ومدة صلاحية الإعلان — حصص الباقات المدفوعة تُدار من صفحة الباقات"
      pad={false}
    >
      <div className="px-5">
        <Row
          title="عدد الإعلانات للخطة المجانية"
          desc="أقصى عدد إعلانات نشطة (بما فيها المسودات) للمستخدم غير المشترك"
        >
          <input
            type="number"
            min={0}
            max={1000}
            value={freeLimit}
            onChange={(e) => onChange({ freeTierAdLimit: Number(e.target.value) })}
            dir="ltr"
            className={numInput}
            aria-label="عدد الإعلانات للخطة المجانية"
          />
          <span className="text-[12px] text-muted">إعلان</span>
        </Row>

        {/* The swap flow needs two live ads to work: the item being offered and
            the one being requested. At a limit of 1 the second publish fails
            with QUOTA_EXCEEDED, so the Swap button leads to a dead end. */}
        {freeLimit === 1 && (
          <p className="border-b border-border py-2.5 text-[12px] leading-relaxed text-amber-700">
            بحد إعلان واحد، لن يتمكن المستخدم المجاني من عرض المقايضة (يحتاج إعلانًا منشورًا ليقايض به).
          </p>
        )}

        {freeLimit === 0 && (
          <p className="border-b border-border py-2.5 text-[12px] leading-relaxed text-red">
            الحد صفر يمنع أي مستخدم مجاني من النشر نهائيًا.
          </p>
        )}

        <Row
          title="مدة صلاحية الإعلان"
          desc="عدد الأيام قبل انتهاء الإعلان تلقائيًا — يُطبَّق عند النشر والتجديد"
        >
          <input
            type="number"
            min={1}
            max={365}
            value={settings.adExpiryDays}
            onChange={(e) => onChange({ adExpiryDays: Number(e.target.value) })}
            dir="ltr"
            className={numInput}
            aria-label="مدة صلاحية الإعلان"
          />
          <span className="text-[12px] text-muted">يوم</span>
        </Row>

        <p className="py-3.5 text-[12px] leading-relaxed text-muted">
          حصص الإعلانات للباقات المدفوعة تُضبط من{' '}
          <span className="font-medium text-ink">صفحة الباقات</span>؛ القيمة المحددة لكل باقة هي المطبَّقة على المشتركين.
        </p>
      </div>
    </Card>
  );
}
