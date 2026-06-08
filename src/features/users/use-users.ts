import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

export type UserTier = 'ALL' | 'REGISTERED' | 'VERIFIED' | 'PREMIUM';
export type UserStatus = 'ACTIVE' | 'WARNED' | 'BANNED';

export interface UserDTO {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  banStatus: string;
  banReason: string | null;
  banAt: string | null;
  verificationStatus: string | null;
  governorate: string | null;
  avatarUrl: string | null;
  joinedAt: string | null;
  lastActiveAt: string | null;
  adsCount: number;
  subscriptionPlan: string | null;
}

export interface UserSubscriptionDTO {
  plan: string;
  status: string;
  periodEnd: string | null;
  adQuotaTotal: number;
  adQuotaUsed: number;
}

export interface UserActivityDTO {
  id: string;
  action: string;
  label: string;
  tone: 'success' | 'info' | 'warning' | 'danger';
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
}

export interface UserDetailDTO extends UserDTO {
  adsCount: number;
  subscription: UserSubscriptionDTO | null;
}

export interface UsersPage {
  items: UserDTO[];
  total: number;
  page: number;
  pages: number;
}

export interface UsersListParams {
  tier?: UserTier;
  status?: UserStatus;
  search?: string;
  page?: number;
}

export interface UserKpis {
  total: number;
  verified: number;
  premium: number;
  bannedOrMonitored: number;
}

function buildQuery(params: UsersListParams): string {
  const q = new URLSearchParams();
  if (params.tier && params.tier !== 'ALL') q.set('tier', params.tier);
  if (params.status) q.set('status', params.status);
  if (params.search) q.set('search', params.search);
  if (params.page && params.page > 1) q.set('page', String(params.page));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function useUsers(params: UsersListParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => get<UsersPage>(`/admin/users${buildQuery(params)}`),
    staleTime: 30_000,
  });
}

export function useUserKpis() {
  const total = useQuery({
    queryKey: ['users-count', 'ALL'],
    queryFn: () => get<UsersPage>('/admin/users?page=1'),
    staleTime: 60_000,
    select: (d) => d.total,
  });
  const verified = useQuery({
    queryKey: ['users-count', 'VERIFIED'],
    queryFn: () => get<UsersPage>('/admin/users?tier=VERIFIED&page=1'),
    staleTime: 60_000,
    select: (d) => d.total,
  });
  const premium = useQuery({
    queryKey: ['users-count', 'PREMIUM'],
    queryFn: () => get<UsersPage>('/admin/users?tier=PREMIUM&page=1'),
    staleTime: 60_000,
    select: (d) => d.total,
  });
  const banned = useQuery({
    queryKey: ['users-count', 'BANNED'],
    queryFn: () => get<UsersPage>('/admin/users?status=BANNED&page=1'),
    staleTime: 60_000,
    select: (d) => d.total,
  });
  const warned = useQuery({
    queryKey: ['users-count', 'WARNED'],
    queryFn: () => get<UsersPage>('/admin/users?status=WARNED&page=1'),
    staleTime: 60_000,
    select: (d) => d.total,
  });

  const isLoading = total.isLoading || verified.isLoading || premium.isLoading || banned.isLoading || warned.isLoading;

  return {
    kpis: {
      total: total.data ?? 0,
      verified: verified.data ?? 0,
      premium: premium.data ?? 0,
      bannedOrMonitored: (banned.data ?? 0) + (warned.data ?? 0),
    } as UserKpis,
    isLoading,
  };
}

export function useUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => get<{ user: UserDetailDTO }>(`/admin/users/${userId}`),
    enabled: !!userId,
    staleTime: 30_000,
    select: (d) => d.user,
  });
}

export function useUserActivity(userId: string | null) {
  return useQuery({
    queryKey: ['user-activity', userId],
    queryFn: () => get<{ activities: UserActivityDTO[] }>(`/admin/users/${userId}/activity`),
    enabled: !!userId,
    staleTime: 60_000,
    select: (d) => d.activities,
  });
}
