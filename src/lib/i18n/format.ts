const AR_LOCALE = 'ar-SA-u-nu-latn';

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(AR_LOCALE).format(n);
}

export function formatCurrencyMinor(minor: number): string {
  return new Intl.NumberFormat(AR_LOCALE, {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/**
 * Grouped amount (Latin digits, no currency symbol) — render the DTO's own
 * `currency` code beside it, matching the design's `{number} EGP` treatment.
 * Use for auctions/flash/banner prices where the currency varies per record.
 */
export function formatAmountMinor(minor: number): string {
  return new Intl.NumberFormat(AR_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format((minor ?? 0) / 100);
}

/** Compact amount for KPI tiles (e.g. 42.8M) from a minor-unit value. */
export function formatCompactMinor(minor: number): string {
  return new Intl.NumberFormat(AR_LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format((minor ?? 0) / 100);
}

/** ISO 8601 → `YYYY-MM-DDTHH:mm` for a `<input type="datetime-local">` value. */
export function toDatetimeLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Seconds → compact Arabic duration, e.g. 402 → "6د 42ث", 45 → "45ث". */
export function formatDurationShort(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const fmt = (n: number) => new Intl.NumberFormat(AR_LOCALE).format(n);
  if (m === 0) return `${fmt(s)}ث`;
  return s === 0 ? `${fmt(m)}د` : `${fmt(m)}د ${fmt(s)}ث`;
}

export function formatPercent(ratio: number, decimals = 1): string {
  return new Intl.NumberFormat(AR_LOCALE, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(ratio);
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(AR_LOCALE, { numeric: 'auto' });

  if (diff < 60_000) return rtf.format(-Math.round(diff / 1_000), 'second');
  if (diff < 3_600_000) return rtf.format(-Math.round(diff / 60_000), 'minute');
  if (diff < 86_400_000) return rtf.format(-Math.round(diff / 3_600_000), 'hour');
  if (diff < 7 * 86_400_000) return rtf.format(-Math.round(diff / 86_400_000), 'day');
  return new Intl.DateTimeFormat(AR_LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

export type ToneColor = 'green' | 'red' | 'amber' | 'violet' | 'blue';

const TONE_COLORS: Record<ToneColor, string> = {
  green: '#1f9c63',
  red: '#d44030',
  amber: '#d98a17',
  violet: '#7a4cc4',
  blue: '#226199',
};

export function toneColor(tone: ToneColor): string {
  return TONE_COLORS[tone];
}

export function actionToTone(action: string): ToneColor {
  const a = action.toUpperCase();
  if (/^(APPROVE|ACTIVATE|RESTORE|RESOLVE|UNBANNED|ACCEPTED)/.test(a)) return 'green';
  if (/^(REJECT|BAN|SUSPEND|DELETE|REMOVE|DISMISS)/.test(a)) return 'red';
  if (/^(EDIT|UPDATE|WARN|ESCALATE|REASSIGN|RETURNED)/.test(a)) return 'amber';
  if (/^(VERIFY|ENROLL|ASSIGN|GRANT)/.test(a)) return 'violet';
  return 'blue';
}

const ACTION_VERB_AR: Record<string, string> = {
  approved: 'وافق على',
  activated: 'فعّل',
  restored: 'استعاد',
  resolved: 'حلّ',
  rejected: 'رفض',
  banned: 'حظر',
  suspended: 'علّق',
  deleted: 'حذف',
  removed: 'أزال',
  dismissed: 'رفض',
  returned_for_revision: 'أعاد للمراجعة',
  updated: 'عدّل',
  edited: 'عدّل',
  settings_updated: 'عدّل الإعدادات',
  deal_radar_limits_updated: 'عدّل حدود Deal Radar',
  warned: 'أنذر',
  escalated: 'صعّد',
  reassigned: 'أعاد التعيين',
  verified: 'وثّق',
  enrolled: 'سجّل',
  assigned: 'عيّن',
  granted: 'منح',
  unbanned: 'رفع الحظر',
  '2fa_reset': 'أعاد تعيين 2FA',
  offer_submitted: 'قدّم عرضاً',
  offer_countered: 'قدّم عرضاً مضاداً',
  offer_rejected: 'رفض عرضاً',
  offer_accepted: 'قبل عرضاً',
  offer_cancelled: 'ألغى عرضاً',
  swap_submitted: 'طلب مقايضة',
  swap_countered: 'قدّم مقايضة مضادة',
  swap_rejected: 'رفض مقايضة',
  swap_accepted: 'قبل مقايضة',
  report_submitted: 'رفع بلاغاً',
  report_resolved: 'أغلق بلاغاً',
  report_escalated: 'صعّد بلاغاً',
  submitted: 'قدّم',
  created: 'أنشأ',
};

const SUBJECT_TYPE_AR: Record<string, string> = {
  AD: 'إعلان',
  USER: 'مستخدم',
  STORE: 'متجر',
  REPORT: 'بلاغ',
  OFFER: 'عرض',
  SWAP: 'مقايضة',
  AUCTION: 'مزاد',
  VERIFICATION: 'توثيق',
  BANNER: 'بانر',
  STAFF: 'موظف',
  CHAT: 'محادثة',
  SPAM: 'رسائل مزعجة',
  SCAM: 'احتيال',
  FAKE: 'محتوى مزيف',
  INAPPROPRIATE: 'محتوى غير لائق',
  DUPLICATE: 'محتوى مكرر',
};

const ACTOR_TYPE_AR: Record<string, string> = {
  user: 'مستخدم',
  staff: 'موظف',
  system: 'النظام',
};

export interface ActivityParts {
  actor: string;
  verb: string;
  ref: string | null;
  extra: string | null;
}

export function formatActivityEntry(
  action: string,
  actorName: string | null,
  actorType: string,
  subjectType: string | null,
  subjectId: string | null,
  detail: string | null,
  subjectName?: string | null,
): ActivityParts {
  let verb: string;
  if (action === 'submitted' && subjectType) {
    const st = subjectType.toUpperCase();
    if (st === 'REPORT') verb = 'رفع بلاغاً';
    else if (st === 'VERIFICATION') verb = 'قدّم طلب توثيق';
    else verb = 'قدّم';
  } else {
    verb = ACTION_VERB_AR[action.toLowerCase()] ?? action;
  }

  let actor: string;
  if (!actorName || actorName === 'System') {
    actor = ACTOR_TYPE_AR[actorType] ?? actorType;
  } else {
    actor = actorName;
  }

  let ref: string | null = null;
  let extra: string | null = null;

  if (detail) {
    try {
      const meta = JSON.parse(detail) as Record<string, unknown>;
      const primaryId = meta.adId ?? meta.reportId ?? meta.auctionId ?? meta.userId;
      if (primaryId) ref = `#${String(primaryId).slice(-6)}`;
      const extraParts: string[] = [];
      if (meta.type && typeof meta.type === 'string') {
        extraParts.push(SUBJECT_TYPE_AR[meta.type.toUpperCase()] ?? meta.type);
      }
      if (meta.subjectType && typeof meta.subjectType === 'string') {
        extraParts.push(SUBJECT_TYPE_AR[meta.subjectType.toUpperCase()] ?? meta.subjectType);
      }
      if (meta.reason && typeof meta.reason === 'string') extraParts.push(meta.reason);
      if (meta.package && typeof meta.package === 'string') extraParts.push(meta.package);
      if (extraParts.length > 0) extra = extraParts.join(' · ');
    } catch {}
  }

  if (!ref && subjectId) {
    if (subjectName) {
      ref = subjectName;
    } else {
      const prefix = subjectType ? (SUBJECT_TYPE_AR[subjectType.toUpperCase()] ?? '') : '';
      ref = prefix ? `${prefix} #${subjectId.slice(-6)}` : `#${subjectId.slice(-6)}`;
    }
  }

  return { actor, verb, ref, extra };
}

export function translateActorType(type: string): string {
  return ACTOR_TYPE_AR[type] ?? type;
}

export function translateSubjectType(type: string | null): string | null {
  if (!type) return null;
  return SUBJECT_TYPE_AR[type.toUpperCase()] ?? type;
}

const DETAIL_KEY_AR: Record<string, string> = {
  adId: 'معرف الإعلان',
  reportId: 'معرف البلاغ',
  userId: 'معرف المستخدم',
  auctionId: 'معرف المزاد',
  type: 'النوع',
  subjectType: 'نوع الموضوع',
  reason: 'السبب',
  amount: 'المبلغ',
  package: 'الباقة',
};

export function parseActivityDetail(detail: string | null): Array<{ label: string; value: string }> | null {
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail) as Record<string, unknown>;
    if (typeof parsed !== 'object' || parsed === null) return [{ label: 'التفاصيل', value: detail }];
    return Object.entries(parsed)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => ({
        label: DETAIL_KEY_AR[k] ?? k,
        value: SUBJECT_TYPE_AR[String(v).toUpperCase()] ?? String(v),
      }));
  } catch {
    return [{ label: 'التفاصيل', value: detail }];
  }
}
