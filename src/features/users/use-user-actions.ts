import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, get, patch, uploadFile } from '@/lib/api/client';
import type { UserDTO, UsersListParams } from './use-users';

interface BanPayload { reason: string; duration?: string }
interface WarnPayload { reason: string }
interface UpdateUserPayload { name?: string; phone?: string; email?: string; role?: string; governorate?: string }
interface CreateUserPayload { name: string; phone: string; email?: string; role?: string; password?: string }
interface GrantSubscriptionPayload { plan: string; durationDays: number; adQuota: number }

function invalidateUsers(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['users'] });
  qc.invalidateQueries({ queryKey: ['users-count'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
}

/**
 * Ban / unban / warn changes the user's standing, which cascades: their ads can
 * be hidden/restored (ads catalog + moderation queue) and their store can be
 * suspended (Stores list). Invalidate those too so the staff don't have to
 * reload the page to see the effect.
 */
function invalidateUserModeration(qc: ReturnType<typeof useQueryClient>) {
  invalidateUsers(qc);
  qc.invalidateQueries({ queryKey: ['admin-ads'] });
  qc.invalidateQueries({ queryKey: ['moderation'] });
  qc.invalidateQueries({ queryKey: ['moderation-count'] });
  qc.invalidateQueries({ queryKey: ['stores'] });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserPayload }) =>
      patch<{ user: UserDTO }>(`/admin/users/${userId}`, payload),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user-detail', userId] });
    },
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: BanPayload }) =>
      post<{ user: UserDTO }>(`/admin/users/${userId}/ban`, payload),
    onSuccess: (_, { userId }) => {
      invalidateUserModeration(qc);
      qc.invalidateQueries({ queryKey: ['user-detail', userId] });
    },
  });
}

export function useWarnUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: WarnPayload }) =>
      post<{ user: UserDTO }>(`/admin/users/${userId}/warn`, payload),
    onSuccess: (_, { userId }) => {
      invalidateUserModeration(qc);
      qc.invalidateQueries({ queryKey: ['user-detail', userId] });
    },
  });
}

export function useUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      post<{ user: UserDTO }>(`/admin/users/${userId}/unban`, {}),
    onSuccess: (_, { userId }) => {
      invalidateUserModeration(qc);
      qc.invalidateQueries({ queryKey: ['user-detail', userId] });
    },
  });
}

export function useBulkBanUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userIds, reason }: { userIds: string[]; reason: string }) =>
      Promise.all(userIds.map((id) => post(`/admin/users/${id}/ban`, { reason }))),
    onSuccess: () => {
      invalidateUserModeration(qc);
    },
  });
}

export function useExportUsers() {
  return useMutation({
    mutationFn: async (params: Pick<UsersListParams, 'tier' | 'status' | 'search'>) => {
      const q = new URLSearchParams();
      if (params.tier && params.tier !== 'ALL') q.set('tier', params.tier);
      if (params.status) q.set('status', params.status);
      if (params.search) q.set('search', params.search);
      const qs = q.toString();
      const { users } = await get<{ users: UserDTO[] }>(`/admin/users/export${qs ? `?${qs}` : ''}`);

      const cols = ['الاسم', 'الهاتف', 'البريد', 'المستوى', 'الحالة', 'الموقع', 'الإعلانات', 'تاريخ التسجيل', 'آخر نشاط'];
      const rows = users.map((u) => [
        u.name,
        u.phone,
        u.email ?? '',
        u.role,
        u.banStatus,
        u.governorate ?? '',
        String(u.adsCount),
        u.joinedAt ?? '',
        u.lastActiveAt ?? '',
      ]);

      const csv = [cols, ...rows]
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const bom = '﻿';
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      post<{ user: UserDTO }>('/admin/users', payload),
    onSuccess: () => {
      invalidateUsers(qc);
    },
  });
}

export function useSetUserPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      post<{ user: UserDTO }>(`/admin/users/${userId}/password`, { password }),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['user-detail', userId] });
    },
  });
}

export function useGrantSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: GrantSubscriptionPayload }) =>
      post<{ user: unknown }>(`/admin/users/${userId}/subscription`, payload),
    onSuccess: (_, { userId }) => {
      invalidateUsers(qc);
      qc.invalidateQueries({ queryKey: ['user-detail', userId] });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return uploadFile<{ avatarUrl: string }>(`/admin/users/${userId}/avatar`, fd);
    },
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['user-detail', userId] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
