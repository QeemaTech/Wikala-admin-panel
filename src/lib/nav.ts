import type { IconName } from '@/components/ui/icon-map';
import type { StaffPermission } from '@/features/auth/auth-store';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: IconName;
  /** Breadcrumb label shown in the topbar for this route. */
  crumb: string;
  /** Queue count badge — fed by §7.44 Admin Dashboard API in Week 2. */
  count?: number;
  /** Tailwind color variant for the badge: 'danger' | 'amber' | 'info' | undefined (neutral). */
  countClass?: 'danger' | 'amber' | 'info';
  /** Required permission to see this item. Absent means visible to all authenticated staff. */
  permission?: StaffPermission;
}

/** Static admin identity — replaced by the auth store in TASK-F-S.2 (Week 2). */
export const ADMIN_PLACEHOLDER = {
  name: 'مروة الصدقاني',
  initials: 'م ص',
  role: 'مديرة المحتوى',
} as const;

export interface NavGroup {
  group: string;
  items: NavItem[];
}

/**
 * Sidebar navigation — structure, routes and Arabic labels mirror
 * `design/wikala/project/src/data.jsx` (`NAV`). This is static route
 * configuration; no API data is involved.
 *
 * Badge counts are live: the Sidebar maps the Admin Dashboard `queues`
 * (Contract §7.43 `GET /admin/dashboard`) onto items by id. `countClass` here
 * only sets the badge color; the number itself comes from the API.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    group: 'الرئيسية',
    items: [
      { id: 'dashboard', label: 'لوحة التحكم', href: '/', icon: 'grid', crumb: 'لوحة التحكم' },
      {
        id: 'activity',
        label: 'سجل النشاط',
        href: '/activity',
        icon: 'activity',
        crumb: 'سجل النشاط',
      },
    ],
  },
  {
    group: 'الإشراف',
    items: [
      {
        id: 'moderation',
        label: 'مراجعة الإعلانات',
        href: '/moderation',
        icon: 'shield-alert',
        crumb: 'مراجعة الإعلانات',
        countClass: 'danger',
        permission: 'MODERATION',
      },
      { id: 'reports', label: 'البلاغات', href: '/reports', icon: 'flag', crumb: 'البلاغات', countClass: 'amber', permission: 'REPORTS' },
      {
        id: 'verifications',
        label: 'التوثيق',
        href: '/verifications',
        icon: 'badge-check',
        crumb: 'طلبات التوثيق',
        permission: 'VERIFICATIONS',
      },
      {
        id: 'chat-safety',
        label: 'حماية المحادثات',
        href: '/chat-safety',
        icon: 'message-square',
        crumb: 'حماية المحادثات',
        permission: 'CHAT_SAFETY',
      },
    ],
  },
  {
    group: 'الأشخاص',
    items: [
      { id: 'users', label: 'المستخدمون', href: '/users', icon: 'users', crumb: 'المستخدمون', permission: 'USERS' },
      { id: 'stores', label: 'المتاجر', href: '/stores', icon: 'store', crumb: 'المتاجر', permission: 'USERS' },
      { id: 'staff', label: 'فريق الإدارة', href: '/staff', icon: 'user', crumb: 'فريق الإدارة', permission: 'STAFF' },
    ],
  },
  {
    group: 'المحتوى',
    items: [
      {
        id: 'ads',
        label: 'إدارة الإعلانات',
        href: '/ads',
        icon: 'shopping-bag',
        crumb: 'إدارة الإعلانات',
        countClass: 'info',
        permission: 'MODERATION',
      },
      {
        id: 'categories',
        label: 'الفئات والأقسام',
        href: '/categories',
        icon: 'layers',
        crumb: 'الفئات والأقسام',
        permission: 'CATEGORIES',
      },
      { id: 'auctions', label: 'المزادات', href: '/auctions', icon: 'gavel', crumb: 'المزادات', permission: 'AUCTIONS' },
      {
        id: 'banners',
        label: 'البانرات الترويجية',
        href: '/banners',
        icon: 'image-frame',
        crumb: 'البانرات الترويجية',
        permission: 'BANNERS',
      },
      { id: 'flash', label: 'العروض الفلاش', href: '/flash', icon: 'bolt', crumb: 'العروض الفلاش', permission: 'FLASH_SALES' },
      {
        id: 'products',
        label: 'المنتجات',
        href: '/products',
        icon: 'archive',
        crumb: 'المنتجات',
        permission: 'PRODUCTS',
      },
      {
        id: 'content-pages',
        label: 'الصفحات والمحتوى',
        href: '/content-pages',
        icon: 'doc',
        crumb: 'الصفحات والمحتوى',
        permission: 'CONTENT_PAGES',
      },
    ],
  },
  {
    group: 'المالية',
    items: [
      { id: 'payments', label: 'المدفوعات', href: '/payments', icon: 'wallet', crumb: 'المدفوعات', permission: 'FINANCE' },
      { id: 'coupons', label: 'كوبونات الخصم', href: '/coupons', icon: 'ticket', crumb: 'كوبونات الخصم', permission: 'FINANCE' },
    ],
  },
  {
    group: 'النمو',
    items: [
      { id: 'boosts', label: 'باقات التعزيز', href: '/boosts', icon: 'flame', crumb: 'باقات التعزيز', permission: 'BOOSTS' },
      { id: 'plans', label: 'الاشتراكات', href: '/plans', icon: 'crown', crumb: 'خطط الاشتراك', permission: 'PLANS' },
      {
        id: 'notifications',
        label: 'الإشعارات والحملات',
        href: '/notifications',
        icon: 'megaphone',
        crumb: 'الإشعارات والحملات',
        permission: 'NOTIFICATIONS',
      },
      {
        id: 'analytics',
        label: 'التحليلات',
        href: '/analytics',
        icon: 'pie-chart',
        crumb: 'التحليلات',
        permission: 'ANALYTICS',
      },
    ],
  },
  {
    group: 'النظام',
    items: [
      {
        id: 'settings',
        label: 'الإعدادات العامة',
        href: '/settings',
        icon: 'cog',
        crumb: 'الإعدادات العامة',
        permission: 'SETTINGS',
      },
    ],
  },
];

const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Resolves the topbar breadcrumb label for a given pathname. */
export function routeCrumb(pathname: string): string {
  const exact = ALL_NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) return exact.crumb;

  const nested = ALL_NAV_ITEMS.filter((item) => item.href !== '/').find((item) =>
    pathname.startsWith(`${item.href}/`),
  );
  return nested?.crumb ?? '';
}

/** True when a nav item should render as the active route. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
