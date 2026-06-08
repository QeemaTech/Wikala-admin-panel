import type { StaffRole, StaffPermission, StaffUserDTO } from '@/features/auth/auth-store';

type StaffStatus = StaffUserDTO['status'];

/** The 8 staff roles (API Contract §StaffRole) with their Arabic labels. */
export const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'مدير عام' },
  { value: 'ADMIN', label: 'مدير' },
  { value: 'CONTENT_MANAGER', label: 'مدير المحتوى' },
  { value: 'VERIFICATION_REVIEWER', label: 'مراجع التوثيق' },
  { value: 'SUPPORT', label: 'دعم العملاء' },
  { value: 'FINANCE', label: 'المالية' },
  { value: 'BANNER_EDITOR', label: 'محرر البانرات' },
  { value: 'TECH', label: 'تقني' },
];

const ROLE_LABEL = new Map(STAFF_ROLES.map((r) => [r.value, r.label]));
export const roleLabel = (role: string): string => ROLE_LABEL.get(role as StaffRole) ?? role;

/**
 * The permission catalogue powering the RBAC matrix (TASK-F-15.3). Mirrors the
 * `StaffPermission` union the admin app's guards (`features/auth/permissions.ts`)
 * already enforce — kept in sync with that union so toggles map 1:1 onto guards.
 */
export const STAFF_PERMISSIONS: { value: StaffPermission; label: string }[] = [
  { value: 'MODERATION', label: 'الإشراف على الإعلانات' },
  { value: 'REPORTS', label: 'البلاغات' },
  { value: 'VERIFICATIONS', label: 'التوثيق' },
  { value: 'USERS', label: 'المستخدمون' },
  { value: 'STAFF', label: 'الفريق والصلاحيات' },
  { value: 'CATEGORIES', label: 'الفئات والأقسام' },
  { value: 'AUCTIONS', label: 'المزادات' },
  { value: 'BANNERS', label: 'البانرات' },
  { value: 'FLASH_SALES', label: 'العروض الفلاش' },
  { value: 'BOOSTS', label: 'باقات التعزيز' },
  { value: 'PLANS', label: 'خطط الاشتراك' },
  { value: 'NOTIFICATIONS', label: 'الإشعارات والحملات' },
  { value: 'ANALYTICS', label: 'التحليلات' },
  { value: 'SETTINGS', label: 'الإعدادات' },
  { value: 'CHAT_SAFETY', label: 'حماية المحادثات' },
  { value: 'AI_RULES', label: 'قواعد الذكاء الاصطناعي' },
  { value: 'FINANCE', label: 'المالية' },
];

const STATUS_META: Record<StaffStatus, { label: string; tone: 'green' | 'amber' | 'red' | 'gray' }> = {
  active: { label: 'نشط', tone: 'green' },
  pending_2fa: { label: 'بانتظار التحقق بخطوتين', tone: 'amber' },
  suspended: { label: 'موقوف', tone: 'red' },
  disabled: { label: 'معطّل', tone: 'gray' },
};

export const statusMeta = (status: StaffStatus) => STATUS_META[status] ?? STATUS_META.disabled;
