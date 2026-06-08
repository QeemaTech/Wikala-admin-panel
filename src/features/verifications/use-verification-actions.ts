import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/lib/api/client';
import type { VerificationDTO } from './use-verifications';

export type VerificationDecision = 'approve' | 'reject' | 'return-for-revision';

export interface VerificationActionPayload {
  id: string;
  action: VerificationDecision;
  /** Required for reject + return-for-revision. */
  reason?: string;
  /** Optional for return-for-revision. */
  missingDocs?: string[];
}

/**
 * Approve / reject / return-for-revision a verification
 * (POST /admin/verifications/:id/{approve,reject,return-for-revision}).
 *
 * A decision changes data OUTSIDE the verifications feature: approving a STORE
 * verification flips the store to VERIFIED (Stores list), approving an
 * INDIVIDUAL verification adds the verified badge to the user (Users list +
 * tier counts), and either shifts the dashboard KPIs. We can't tell STORE from
 * INDIVIDUAL from `vars`, so we invalidate both unconditionally — invalidating
 * an unmounted query is free, it just refetches on its next mount.
 */
export function useVerificationActions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason, missingDocs }: VerificationActionPayload) => {
      const body: Record<string, unknown> = {};
      if (reason != null) body.reason = reason;
      if (missingDocs != null) body.missingDocs = missingDocs;
      return post<VerificationDTO>(`/admin/verifications/${id}/${action}`, body);
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['verifications'] });
      if (vars.id) qc.invalidateQueries({ queryKey: ['verifications', 'detail', vars.id] });
      // Cross-feature: a verified store/user now surfaces elsewhere.
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users-count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
