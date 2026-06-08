'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  useDetectionRules,
  useUpdateDetectionRules,
  type DetectionRulesDTO,
  type DetectionRuleKey,
} from '@/features/chat-safety/use-detection-rules';
import { REASON_ICON, SEVERITY_LABEL, AUTO_ACTION_LABEL } from '@/features/chat-safety/labels';
import type { ChatSafetySeverity, ChatSafetyAutoAction, ChatSafetyReason } from '@/features/chat-safety/use-flagged-threads';

const RULE_META: { key: DetectionRuleKey; reason: ChatSafetyReason; label: string }[] = [
  { key: 'externalUrl', reason: 'external_url', label: 'روابط خارجية' },
  { key: 'phoneInText', reason: 'phone_in_text', label: 'أرقام هواتف داخل النص' },
  { key: 'noWatermark', reason: 'no_watermark', label: 'صور بدون علامة مائية' },
  { key: 'fraudMatch', reason: 'fraud_match', label: 'مطابقة احتيال مُسجّل' },
];

const SEVERITIES: ChatSafetySeverity[] = ['high', 'med', 'low'];
const ACTIONS: ChatSafetyAutoAction[] = ['warn', 'hide_phone', 'block_link', 'flag'];
const DOMAIN_RE = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

interface DetectionRulesPanelProps {
  onClose: () => void;
}

export function DetectionRulesPanel({ onClose }: DetectionRulesPanelProps) {
  const { data, isLoading, isError } = useDetectionRules();

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/30" role="dialog" aria-modal="true">
      <button type="button" aria-label="إغلاق" className="flex-1" onClick={onClose} />
      <div className="flex h-full w-full max-w-lg flex-col overflow-hidden bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-brand/10 text-brand">
              <Icon name="sliders" size={20} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-ink">قواعد الكشف</h2>
              <p className="text-[12px] text-muted">إعدادات مكافحة الاحتيال في المحادثات</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-[8px] p-1.5 text-muted hover:bg-surface-2" aria-label="إغلاق">
            <Icon name="x" size={16} />
          </button>
        </div>

        {isError ? (
          <div className="grid flex-1 place-items-center p-8 text-center text-[13px] text-muted">
            <div>
              <Icon name="alert-triangle" size={24} className="mx-auto text-red" />
              <p className="mt-2">تعذّر تحميل قواعد الكشف</p>
            </div>
          </div>
        ) : isLoading || !data ? (
          <div className="flex-1 space-y-3 p-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-[10px] bg-surface-2" />
            ))}
          </div>
        ) : (
          <DetectionRulesForm data={data} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function DetectionRulesForm({ data, onClose }: { data: DetectionRulesDTO; onClose: () => void }) {
  const update = useUpdateDetectionRules();
  const [draft, setDraft] = useState<DetectionRulesDTO>(() => structuredClone(data));
  const [newDomain, setNewDomain] = useState('');
  const [newPhrase, setNewPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(data), [draft, data]);
  const allowlistValid = draft.urlAllowlist.every((d) => DOMAIN_RE.test(d));
  const canSave = dirty && allowlistValid && !update.isPending;

  const setRule = (key: DetectionRuleKey, patch: Partial<DetectionRulesDTO['rules'][DetectionRuleKey]>) =>
    setDraft((d) => ({ ...d, rules: { ...d.rules, [key]: { ...d.rules[key], ...patch } } }));

  const addDomain = () => {
    const v = newDomain.trim().toLowerCase();
    if (!v) return;
    if (!DOMAIN_RE.test(v)) { setError('نطاق غير صالح'); return; }
    if (draft.urlAllowlist.includes(v)) { setNewDomain(''); return; }
    setDraft((d) => ({ ...d, urlAllowlist: [...d.urlAllowlist, v] }));
    setNewDomain('');
    setError(null);
  };
  const removeDomain = (v: string) =>
    setDraft((d) => ({ ...d, urlAllowlist: d.urlAllowlist.filter((x) => x !== v) }));

  const addPhrase = () => {
    const v = newPhrase.trim();
    if (!v || draft.fraudPhrases.includes(v)) { setNewPhrase(''); return; }
    setDraft((d) => ({ ...d, fraudPhrases: [...d.fraudPhrases, v] }));
    setNewPhrase('');
  };
  const removePhrase = (v: string) =>
    setDraft((d) => ({ ...d, fraudPhrases: d.fraudPhrases.filter((x) => x !== v) }));

  const save = () => {
    setError(null);
    update.mutate(
      { urlAllowlist: draft.urlAllowlist, fraudPhrases: draft.fraudPhrases, rules: draft.rules },
      {
        onSuccess: onClose,
        onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر حفظ القواعد.'),
      },
    );
  };

  return (
    <>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* Per-rule controls */}
        <div className="space-y-2.5">
          {RULE_META.map(({ key, reason, label }) => {
            const rule = draft.rules[key];
            return (
              <div key={key} className="rounded-[10px] border border-border bg-white p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-[8px] bg-surface-2 text-ink-2">
                      <Icon name={REASON_ICON[reason]} size={15} />
                    </div>
                    <span className="text-[13px] font-medium text-ink">{label}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rule.enabled}
                    aria-label={label}
                    onClick={() => setRule(key, { enabled: !rule.enabled })}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${rule.enabled ? 'bg-brand' : 'bg-border'}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${rule.enabled ? 'start-0.5' : 'start-[18px]'}`} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-[11.5px] text-muted">
                    الخطورة
                    <select
                      value={rule.severity}
                      disabled={!rule.enabled}
                      onChange={(e) => setRule(key, { severity: e.target.value as ChatSafetySeverity })}
                      className="mt-1 w-full rounded-[7px] border border-border bg-surface px-2 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand disabled:opacity-50"
                    >
                      {SEVERITIES.map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
                    </select>
                  </label>
                  <label className="text-[11.5px] text-muted">
                    الإجراء
                    <select
                      value={rule.action}
                      disabled={!rule.enabled}
                      onChange={(e) => setRule(key, { action: e.target.value as ChatSafetyAutoAction })}
                      className="mt-1 w-full rounded-[7px] border border-border bg-surface px-2 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand disabled:opacity-50"
                    >
                      {ACTIONS.map((a) => <option key={a} value={a}>{AUTO_ACTION_LABEL[a]}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* URL allowlist */}
        <div className="rounded-[10px] border border-border bg-white p-3.5">
          <h3 className="text-[13px] font-semibold text-ink">النطاقات المسموح بها</h3>
          <p className="mt-0.5 text-[11.5px] text-muted">الروابط لهذه النطاقات لا تُحظر.</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {draft.urlAllowlist.map((d) => (
              <span key={d} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[11.5px] text-ink" dir="ltr">
                {d}
                <button type="button" onClick={() => removeDomain(d)} aria-label={`حذف ${d}`} className="text-muted hover:text-red">
                  <Icon name="x" size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDomain(); } }}
              placeholder="example.com"
              dir="ltr"
              className="flex-1 rounded-[7px] border border-border bg-surface px-2.5 py-1.5 font-mono text-[12.5px] text-ink outline-none focus:border-brand"
            />
            <button type="button" onClick={addDomain} className="rounded-[7px] border border-border px-3 text-[12.5px] text-ink hover:bg-surface-2">
              <Icon name="plus" size={13} className="inline-block" /> إضافة
            </button>
          </div>
        </div>

        {/* Fraud phrases */}
        <div className="rounded-[10px] border border-border bg-white p-3.5">
          <h3 className="text-[13px] font-semibold text-ink">عبارات الاحتيال</h3>
          <p className="mt-0.5 text-[11.5px] text-muted">رسائل تحتوي هذه العبارات تُعلَّم.</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {draft.fraudPhrases.map((p) => (
              <span key={p} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11.5px] text-ink">
                {p}
                <button type="button" onClick={() => removePhrase(p)} aria-label={`حذف ${p}`} className="text-muted hover:text-red">
                  <Icon name="x" size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <input
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPhrase(); } }}
              placeholder="أضف عبارة..."
              className="flex-1 rounded-[7px] border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand"
            />
            <button type="button" onClick={addPhrase} className="rounded-[7px] border border-border px-3 text-[12.5px] text-ink hover:bg-surface-2">
              <Icon name="plus" size={13} className="inline-block" /> إضافة
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-white px-5 py-4">
        {error && <p className="mb-2 text-[12px] text-red">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">
            إلغاء
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {update.isPending ? 'جاري الحفظ...' : 'حفظ القواعد'}
          </button>
        </div>
      </div>
    </>
  );
}
