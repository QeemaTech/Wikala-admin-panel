import { useQuery } from '@tanstack/react-query';
import { get, getPaged, type PageMeta } from '@/lib/api/client';

export type VerificationKind = 'INDIVIDUAL' | 'STORE';
export type VerificationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'RETURNED' | 'APPROVED' | 'REJECTED';
export type VerificationTab = 'ALL' | 'INDIVIDUAL' | 'STORE' | 'RETURNED';

export interface VerificationUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  governorate: string | null;
}

export interface VerificationDoc {
  id: string;
  type: 'ID_PHOTO' | 'SELFIE' | 'COMMERCIAL_REG' | 'TAX_CERT' | 'LOGO' | 'BANNER';
  url: string;
  sizeBytes: number;
  ocrText: string | null;
  uploadedAt: string | null;
}

export interface VerificationBranch {
  id: string;
  name: string;
  addressText: string;
  location: { lng: number; lat: number } | null;
}

export interface VerificationDTO {
  id: string;
  userId: string;
  kind: VerificationKind;
  status: VerificationStatus;
  idPhotoUrl: string | null;
  selfieUrl: string | null;
  ocrResult: { matchedText: string; confidence: number } | null;
  livenessScore: number | null;
  faceMatchScore: number | null;
  storeDocs: VerificationDoc[];
  branches: VerificationBranch[];
  submittedAt: string | null;
  reviewerId: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
  user: VerificationUser | null;
}

export interface VerificationTimelineEntry {
  action: string;
  actorType: 'user' | 'staff' | 'system';
  actorName: string | null;
  metadata: Record<string, unknown>;
  at: string | null;
}

export interface VerificationDetail extends VerificationDTO {
  timeline: VerificationTimelineEntry[];
}

export interface VerificationCounts {
  all: number;
  individual: number;
  store: number;
  returned: number;
}

export interface VerificationsListResult {
  items: VerificationDTO[];
  meta: PageMeta & { counts: VerificationCounts };
}

export function useVerifications(tab: VerificationTab, page = 1) {
  return useQuery({
    queryKey: ['verifications', tab, page],
    queryFn: () =>
      getPaged<VerificationDTO, PageMeta & { counts: VerificationCounts }>(
        `/admin/verifications?tab=${tab}&page=${page}`,
      ),
    staleTime: 30_000,
  });
}

export function useVerificationDetail(id: string | null) {
  return useQuery({
    queryKey: ['verifications', 'detail', id],
    queryFn: () => get<VerificationDetail>(`/admin/verifications/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}
