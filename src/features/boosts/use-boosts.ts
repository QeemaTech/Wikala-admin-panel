import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

export type BoostPackage = 'BOOST' | 'HOT' | 'URGENT';

export type BoostPlacement = 'TOP_SEARCH' | 'TOP_FEED' | 'CATEGORY_TOP';
export type BoostBadge = 'NONE' | 'GOLD' | 'FLAME' | 'URGENT';

/** BoostPackageDTO — Contract §7.37 `GET /admin/boosts/packages`. */
export interface BoostPackageDTO {
  package: BoostPackage;
  priceMinor: number;
  currency: string;
  durationDays: number;
  // Structured benefits — the source of truth for the derived `benefits` list.
  placement: BoostPlacement;
  badge: BoostBadge;
  pushToFollowers: boolean;
  marketingBullets: string[];
  /** Derived display bullets (generated server-side from the structured fields). */
  benefits: string[];
  active: boolean;
  /** Count of currently-ACTIVE boosts on this package. */
  activeCount: number;
  /** Captured boost revenue for this package over the last 7 days (minor units). */
  weeklyRevenueMinor: number;
}

/** One point of the 30-day boost revenue series — Contract §7.37 `GET /admin/boosts/revenue`. */
export interface BoostRevenuePoint {
  date: string;
  totalMinor: number;
  byPackage: Record<BoostPackage, number>;
}

type BoostIcon = 'bolt' | 'flame' | 'clock';
interface BoostTone {
  icon: BoostIcon;
  bg: string;
  fg: string;
}

/**
 * Per-package visual tints (presentation only — the package SET itself always
 * comes from the API). Unknown package keys fall back to a neutral tint so a
 * newly-added package still renders.
 */
const BOOST_TONES: Record<string, BoostTone> = {
  BOOST: { icon: 'bolt', bg: '#fcf2dd', fg: '#d98a17' },
  HOT: { icon: 'flame', bg: '#fae6e3', fg: '#d44030' },
  URGENT: { icon: 'clock', bg: '#f1eafa', fg: '#7a4cc4' },
};
const DEFAULT_TONE: BoostTone = { icon: 'bolt', bg: '#eef1f5', fg: '#5a6679' };

export function boostTone(pkg: string): BoostTone {
  return BOOST_TONES[pkg] ?? DEFAULT_TONE;
}

/** Display label derived from the API key (e.g. "BOOST" → "Boost"). */
export function boostPackageLabel(pkg: string): string {
  if (!pkg) return pkg;
  return pkg.charAt(0).toUpperCase() + pkg.slice(1).toLowerCase();
}

/** Catalog display order; any package not listed sorts to the end. */
const ORDER: string[] = ['BOOST', 'HOT', 'URGENT'];
const orderIndex = (pkg: string) => {
  const i = ORDER.indexOf(pkg);
  return i === -1 ? ORDER.length : i;
};

export function useBoostPackages() {
  return useQuery({
    queryKey: ['boost-packages'],
    queryFn: () => get<BoostPackageDTO[]>('/admin/boosts/packages'),
    staleTime: 60_000,
    select: (pkgs) => [...pkgs].sort((a, b) => orderIndex(a.package) - orderIndex(b.package)),
  });
}

export function useBoostRevenue(days = 30) {
  return useQuery({
    queryKey: ['boost-revenue', days],
    queryFn: () => get<{ days: BoostRevenuePoint[] }>(`/admin/boosts/revenue?days=${days}`),
    staleTime: 5 * 60_000,
    select: (d) => d.days,
  });
}
