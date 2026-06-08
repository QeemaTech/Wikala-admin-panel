'use client';

import { useEffect, useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Icon } from '@/components/ui/Icon';
import { Switch, Select } from '@/components/forms/Field';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { OtpChannelsPanel } from '@/components/settings/OtpChannelsPanel';
import { SecuritySettingsPanel } from '@/components/settings/SecuritySettingsPanel';
import { DealRadarLimitsPanel } from '@/components/settings/DealRadarLimitsPanel';
import { CurrencyTable } from '@/components/settings/CurrencyTable';
import { ApiError } from '@/lib/api/errors';
import {
  useSystemSettings,
  useUpdateSystemSettings,
  type SystemSettingsDTO,
} from '@/features/settings/use-system-settings';
import { useCurrencies } from '@/features/settings/use-currencies';

const selectCls =
  'rounded-[8px] border border-border bg-surface px-3 py-1.5 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10';

/** 0–1 score input rendered as a percentage chip (step 5%). */
function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={1}
        step={0.05}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(1, Math.max(0, n)));
        }}
        dir="ltr"
        className="w-[64px] rounded-[8px] border border-border bg-surface px-2 py-1.5 text-center font-mono text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-50"
      />
      <span className="text-[12px] text-muted">{Math.round((value ?? 0) * 100)}%</span>
    </div>
  );
}

export default function SettingsPage() {
  const { data: settings, isLoading, isError } = useSystemSettings();
  const { data: currencies } = useCurrencies();
  const updateSettings = useUpdateSystemSettings();

  const [draft, setDraft] = useState<SystemSettingsDTO | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dirty = !!draft && !!settings && JSON.stringify(draft) !== JSON.stringify(settings);

  // Seed the draft initially, and re-sync it when the server settings change while
  // the user has no unsaved edits (e.g. a background refetch or post-save refresh).
  // Skipping re-sync while dirty preserves in-progress edits.
  useEffect(() => {
    if (settings && !dirty) setDraft(settings);
  }, [settings, dirty]);

  const onChange = (patch: Partial<SystemSettingsDTO>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));

  const patchTrust = (p: Partial<SystemSettingsDTO['trust']>) =>
    setDraft((d) => (d ? { ...d, trust: { ...d.trust, ...p } } : d));

  const patchModeration = (p: Partial<SystemSettingsDTO['moderation']>) =>
    setDraft((d) => (d ? { ...d, moderation: { ...d.moderation, ...p } } : d));

  const patchVerification = (p: Partial<SystemSettingsDTO['verification']>) =>
    setDraft((d) => (d ? { ...d, verification: { ...d.verification, ...p } } : d));

  const onSave = async () => {
    if (!draft) return;
    setSaveError(null);
    try {
      const updated = await updateSettings.mutateAsync(draft);
      setDraft(updated);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : 'تعذّر حفظ التغييرات. حاول مرة أخرى.');
    }
  };

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
        <PageHead title="الإعدادات العامة" />
        <p className="rounded-[10px] bg-red-50 p-4 text-[13px] text-red">تعذّر تحميل الإعدادات. يرجى تحديث الصفحة.</p>
      </div>
    );
  }

  if (isLoading || !draft) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
        <PageHead title="الإعدادات العامة" sub="إعدادات النظام، الأمان، الإشراف الآلي، والقنوات" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-56 animate-pulse rounded-[var(--radius)] bg-surface" />)}
        </div>
      </div>
    );
  }

  const activeCurrencyCodes = (currencies ?? []).filter((c) => c.status === 'ACTIVE').map((c) => c.code);
  const currencyOptions = activeCurrencyCodes.length > 0 ? activeCurrencyCodes : [draft.currencyDefault];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="الإعدادات العامة"
        sub="إعدادات النظام، الأمان، الإشراف الآلي، والقنوات"
        actions={
          <button
            onClick={onSave}
            disabled={!dirty || updateSettings.isPending}
            className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-brand/90 disabled:opacity-50"
          >
            <Icon name="check" size={14} />
            {updateSettings.isPending ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
          </button>
        }
      />

      {saveError && <p className="mb-4 rounded-[8px] bg-red/5 px-3 py-2 text-[12.5px] text-red border border-red/20">{saveError}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Interface & translation */}
        <SettingsSection
          title="الواجهة والترجمة"
          rows={[
            {
              title: 'اللغة الافتراضية',
              desc: 'العربية (RTL) كافتراضي مع دعم الإنجليزية',
              control: (
                <Select value={draft.localeDefault} onChange={(e) => onChange({ localeDefault: e.target.value as 'ar' | 'en' })} className={selectCls}>
                  <option value="ar">العربية (RTL)</option>
                  <option value="en">English</option>
                </Select>
              ),
            },
            {
              title: 'العملة الافتراضية',
              desc: 'العملة الأساسية التي تُحسب عليها أسعار التحويل',
              control: (
                <Select value={draft.currencyDefault} onChange={(e) => onChange({ currencyDefault: e.target.value })} className={selectCls}>
                  {currencyOptions.map((code) => <option key={code} value={code}>{code}</option>)}
                </Select>
              ),
            },
            {
              title: 'الأرقام',
              desc: 'نظام عرض الأرقام في واجهة المستخدم',
              control: (
                <Select value={draft.numberSystem} onChange={(e) => onChange({ numberSystem: e.target.value as 'arabic' | 'latin' })} className={selectCls}>
                  <option value="arabic">العربية الشرقية</option>
                  <option value="latin">اللاتينية</option>
                </Select>
              ),
            },
          ]}
        />

        {/* OTP channels */}
        <OtpChannelsPanel settings={draft} onChange={onChange} />

        {/* Security & trust */}
        <SettingsSection
          title="الأمان والثقة"
          rows={[
            {
              title: 'علامة مائية تلقائية',
              desc: 'إضافة شعار وكالة على كل صورة عند الرفع',
              control: <Switch checked={draft.trust.autoWatermark} onChange={(v) => patchTrust({ autoWatermark: v })} />,
            },
            {
              title: 'كشف الإعلانات المكررة',
              desc: 'مقارنة Hash للصور والوصف',
              control: <Switch checked={draft.trust.duplicateDetection} onChange={(v) => patchTrust({ duplicateDetection: v })} />,
            },
            {
              title: 'كشف الروابط الخارجية في المحادثات',
              desc: 'تنبيه مع خيارات حظر/إبلاغ',
              control: <Switch checked={draft.trust.chatLinkDetection} onChange={(v) => patchTrust({ chatLinkDetection: v })} />,
            },
            {
              title: 'تشفير المحادثات',
              desc: 'End-to-End لجميع الرسائل والمكالمات',
              control: <Switch checked={draft.trust.chatEncryption} onChange={(v) => patchTrust({ chatEncryption: v })} />,
            },
          ]}
        />

        {/* Auto-moderation */}
        <SettingsSection
          title="الإشراف الآلي"
          rows={[
            {
              title: 'الحظر التلقائي',
              desc: 'رفض الإعلان مباشرة عند تجاوز فحص AI للحد الأعلى',
              control: <Switch checked={draft.moderation.autoBanEnabled} onChange={(v) => patchModeration({ autoBanEnabled: v })} />,
            },
            {
              title: 'طابور المراجعة البشرية',
              desc: 'إرسال الإعلانات المشبوهة لطابور المراجعة',
              control: <Switch checked={draft.moderation.humanReviewEnabled} onChange={(v) => patchModeration({ humanReviewEnabled: v })} />,
            },
            {
              title: 'تنفيذ المراجعة خلال',
              desc: 'الحد الأقصى لزمن معالجة طابور المراجعة',
              control: (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={draft.moderation.reviewSlaHours}
                    onChange={(e) => patchModeration({ reviewSlaHours: Number(e.target.value) })}
                    dir="ltr"
                    className="w-[60px] rounded-[8px] border border-border bg-surface px-2 py-1.5 text-center font-mono text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                  />
                  <span className="text-[12px] text-muted">ساعة</span>
                </div>
              ),
            },
          ]}
        />

        {/* Identity-verification AI thresholds */}
        <SettingsSection
          title="عتبات التحقق الذكي (AI)"
          rows={[
            {
              title: 'القرار التلقائي',
              desc: 'الموافقة/الرفض آلياً بناءً على درجات الذكاء الاصطناعي. عند الإيقاف تذهب جميع الطلبات للمراجعة البشرية',
              control: <Switch checked={draft.verification.autoDecisionEnabled} onChange={(v) => patchVerification({ autoDecisionEnabled: v })} />,
            },
            {
              title: 'حد قبول OCR',
              desc: 'أدنى ثقة لقراءة بيانات الهوية للموافقة التلقائية',
              control: (
                <ScoreInput
                  value={draft.verification.ocrApprove}
                  disabled={!draft.verification.autoDecisionEnabled}
                  onChange={(n) => patchVerification({ ocrApprove: n })}
                />
              ),
            },
            {
              title: 'حد قبول الحيوية (Liveness)',
              desc: 'أدنى درجة لإثبات أن السيلفي لشخص حقيقي',
              control: (
                <ScoreInput
                  value={draft.verification.livenessApprove}
                  disabled={!draft.verification.autoDecisionEnabled}
                  onChange={(n) => patchVerification({ livenessApprove: n })}
                />
              ),
            },
            {
              title: 'حد قبول مطابقة الوجه',
              desc: 'أدنى درجة لتطابق وجه السيلفي مع صورة الهوية',
              control: (
                <ScoreInput
                  value={draft.verification.faceMatchApprove}
                  disabled={!draft.verification.autoDecisionEnabled}
                  onChange={(n) => patchVerification({ faceMatchApprove: n })}
                />
              ),
            },
            {
              title: 'أرضية الرفض التلقائي',
              desc: 'أي درجة أقل من هذا الحد تؤدي إلى رفض تلقائي',
              control: (
                <ScoreInput
                  value={draft.verification.rejectFloor}
                  disabled={!draft.verification.autoDecisionEnabled}
                  onChange={(n) => patchVerification({ rejectFloor: n })}
                />
              ),
            },
          ]}
        />

        {/* Currencies (self-managed CRUD) */}
        <CurrencyTable baseCurrency={draft.currencyDefault} />

        {/* Deal Radar limits + geo radius */}
        <DealRadarLimitsPanel settings={draft} onChange={onChange} />

        {/* Security settings */}
        <SecuritySettingsPanel settings={draft} onChange={onChange} />
      </div>
    </div>
  );
}
