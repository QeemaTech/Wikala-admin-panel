import { useAuthStore, type StaffPermission, type StaffRole } from './auth-store';

export const ROLE_PERMISSIONS: Record<StaffRole, StaffPermission[]> = {
  SUPER_ADMIN: [
    'MODERATION', 'REPORTS', 'VERIFICATIONS', 'USERS', 'STAFF', 'CATEGORIES',
    'AUCTIONS', 'BANNERS', 'FLASH_SALES', 'BOOSTS', 'PLANS', 'NOTIFICATIONS',
    'ANALYTICS', 'SETTINGS', 'CHAT_SAFETY', 'AI_RULES', 'FINANCE',
  ],
  ADMIN: [
    'MODERATION', 'REPORTS', 'VERIFICATIONS', 'USERS', 'CATEGORIES',
    'AUCTIONS', 'BANNERS', 'FLASH_SALES', 'BOOSTS', 'PLANS', 'NOTIFICATIONS',
    'ANALYTICS', 'SETTINGS', 'CHAT_SAFETY',
  ],
  CONTENT_MANAGER: ['MODERATION', 'CATEGORIES', 'BANNERS', 'FLASH_SALES'],
  VERIFICATION_REVIEWER: ['VERIFICATIONS'],
  SUPPORT: ['USERS', 'REPORTS'],
  FINANCE: ['FINANCE', 'ANALYTICS', 'BOOSTS', 'PLANS'],
  BANNER_EDITOR: ['BANNERS'],
  TECH: ['SETTINGS', 'ANALYTICS'],
};

export function hasPermission(permission: StaffPermission): boolean {
  const { staff } = useAuthStore.getState();
  if (!staff) return false;
  const explicit = staff.permissions ?? [];
  const fromRole = ROLE_PERMISSIONS[staff.role] ?? [];
  return explicit.includes(permission) || fromRole.includes(permission);
}

export function usePermission(permission: StaffPermission): boolean {
  const staff = useAuthStore((s) => s.staff);
  if (!staff) return false;
  const explicit = staff.permissions ?? [];
  const fromRole = ROLE_PERMISSIONS[staff.role] ?? [];
  return explicit.includes(permission) || fromRole.includes(permission);
}
