import type { IconName } from '@/components/ui/Icon';
import type {
  ChatSafetyReason,
  ChatSafetySeverity,
  ChatSafetyAutoAction,
  ReviewerDecision,
} from './use-flagged-threads';

export const REASON_LABEL: Record<ChatSafetyReason, string> = {
  external_url: 'رابط خارجي',
  phone_in_text: 'رقم تليفون داخل النص',
  no_watermark: 'صورة بدون علامة مائية',
  fraud_match: 'محتوى يطابق احتيال مُسجّل',
};

export const REASON_ICON: Record<ChatSafetyReason, IconName> = {
  external_url: 'globe',
  phone_in_text: 'phone',
  no_watermark: 'image-frame',
  fraud_match: 'flame',
};

export const AUTO_ACTION_LABEL: Record<ChatSafetyAutoAction, string> = {
  warn: 'تنبيه',
  hide_phone: 'إخفاء الرقم',
  block_link: 'حظر الرابط',
  flag: 'علم للمراجعة',
};

export const SEVERITY_LABEL: Record<ChatSafetySeverity, string> = {
  high: 'عالية',
  med: 'متوسطة',
  low: 'منخفضة',
};

export const SEVERITY_TONE: Record<ChatSafetySeverity, 'red' | 'amber' | 'gray'> = {
  high: 'red',
  med: 'amber',
  low: 'gray',
};

export const DECISION_LABEL: Record<ReviewerDecision, string> = {
  CONFIRM_BLOCK: 'تأكيد الحظر',
  DISMISS: 'تجاهل',
  WARN_USER: 'تحذير المستخدم',
  BAN_USER: 'حظر المستخدم',
};

export const DECISION_TONE: Record<ReviewerDecision, 'red' | 'green' | 'amber'> = {
  CONFIRM_BLOCK: 'red',
  DISMISS: 'green',
  WARN_USER: 'amber',
  BAN_USER: 'red',
};
