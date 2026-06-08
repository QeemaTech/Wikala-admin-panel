'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type StaffRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'CONTENT_MANAGER'
  | 'VERIFICATION_REVIEWER'
  | 'SUPPORT'
  | 'FINANCE'
  | 'BANNER_EDITOR'
  | 'TECH';

export type StaffPermission =
  | 'MODERATION'
  | 'REPORTS'
  | 'VERIFICATIONS'
  | 'USERS'
  | 'STAFF'
  | 'CATEGORIES'
  | 'AUCTIONS'
  | 'BANNERS'
  | 'FLASH_SALES'
  | 'BOOSTS'
  | 'PLANS'
  | 'NOTIFICATIONS'
  | 'ANALYTICS'
  | 'SETTINGS'
  | 'CHAT_SAFETY'
  | 'AI_RULES'
  | 'FINANCE';

export interface StaffUserDTO {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  permissions: StaffPermission[];
  twoFactorEnabled: boolean;
  status: 'pending_2fa' | 'active' | 'suspended' | 'disabled';
  lastActiveAt: string | null;
  joinedAt: string;
}

interface AuthState {
  challengeToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  staff: StaffUserDTO | null;
  setChallenge: (token: string) => void;
  setSession: (accessToken: string, refreshToken: string, staff: StaffUserDTO) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      challengeToken: null,
      accessToken: null,
      refreshToken: null,
      staff: null,
      setChallenge: (token) => set({ challengeToken: token }),
      setSession: (accessToken, refreshToken, staff) =>
        set({ accessToken, refreshToken, staff, challengeToken: null }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () =>
        set({ challengeToken: null, accessToken: null, refreshToken: null, staff: null }),
    }),
    {
      name: 'wikala-admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        staff: state.staff,
        accessToken: state.accessToken,
      }),
    },
  ),
);
