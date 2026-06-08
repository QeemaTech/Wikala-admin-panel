import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

export type DashboardRange = '7d' | '30d' | '90d';

export interface DashboardKpis {
  monthlyActiveUsers: number;
  newAds: number;
  boostRevenueMinor: number;
  reportRate: number;
  deltas: {
    newAds: number | null;
    newUsers: number | null;
    boostRevenue: number | null;
    reportRate: number | null;
  };
}

export interface CategoryDistItem {
  categoryId: string | null;
  name: string;
  count: number;
  color: string;
}

export interface DashboardQueues {
  moderation: number;
  verificationsIndividual: number;
  verificationsStore: number;
  reportsOpen: number;
  auctionsEndingToday: number;
  activeAds: number;
}

export interface TrustIndicators {
  verified: number;
  premium: number;
  monitored: number;
  banned: number;
  deltas: {
    verifiedWeek: number;
    premiumWeek: number;
    monitoredToday: number;
    bannedToday: number;
  };
}

export interface ActivityEntry {
  id: string;
  actor: { id: string | null; type: string; name: string | null };
  action: string;
  subjectType: string | null;
  subjectId: string | null;
  subjectName: string | null;
  detail: string | null;
  tone: string;
  createdAt: string;
}

export interface DashboardData {
  kpis: DashboardKpis;
  adVolumeSeries: { labels: string[]; values: number[] };
  categoryDistribution: CategoryDistItem[];
  queues: DashboardQueues;
  todayRevenue: { totalMinor: number; byPackage: Record<string, number>; subscriptions: number; deltaVsYesterday: number | null };
  topCategoriesByTraffic: { categoryId: string | null; name: string | null; count: number }[];
  trustIndicators: TrustIndicators;
  slaCompliance: { reports7d: number; verifications7d: number };
  recentActivity: ActivityEntry[];
}

export function useDashboard(range: DashboardRange = '30d') {
  return useQuery({
    queryKey: ['dashboard', range],
    queryFn: () => get<DashboardData>(`/admin/dashboard?range=${range}`),
    staleTime: 5 * 60_000,
  });
}
