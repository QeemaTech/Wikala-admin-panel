'use client';

import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { formatPercent } from '@/lib/i18n/format';
import type { VerificationDTO } from '@/features/verifications/use-verifications';

function PhotoPanel({ url, gradient, icon }: { url: string | null; gradient: string; icon: 'id-card' | 'image-frame' }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="aspect-[16/10] w-full object-cover" />
      ) : (
        <div className="grid aspect-[16/10] w-full place-items-center text-wk-blue" style={{ background: gradient }}>
          <Icon name={icon} size={48} strokeWidth={1.4} />
        </div>
      )}
    </div>
  );
}

/** Steps 01 (ID) + 02 (selfie) with their real result chips. Shared by both kinds. */
export function IndividualVerificationDetail({ v }: { v: VerificationDTO }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div>
        <p className="mb-2 text-[12px] font-medium text-muted">الخطوة 01 — صورة الهوية</p>
        <PhotoPanel url={v.idPhotoUrl} gradient="linear-gradient(135deg,#dfeaf5,#bcd0e6)" icon="id-card" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {v.ocrResult ? (
            <Chip tone="green" dot>OCR — {formatPercent(v.ocrResult.confidence, 0)}</Chip>
          ) : (
            <Chip tone="gray">بانتظار OCR</Chip>
          )}
          {v.idPhotoUrl ? <Chip tone="green" dot>صورة مرفوعة</Chip> : <Chip tone="gray">لا توجد صورة</Chip>}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-medium text-muted">الخطوة 02 — صورة شخصية (Selfie)</p>
        <PhotoPanel url={v.selfieUrl} gradient="linear-gradient(135deg,#e9d5d5,#c4a4a4)" icon="image-frame" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {v.faceMatchScore != null ? (
            <Chip tone={v.faceMatchScore >= 0.8 ? 'green' : 'amber'} dot>
              تطابق وجوه {formatPercent(v.faceMatchScore, 0)}
            </Chip>
          ) : (
            <Chip tone="gray">بانتظار المطابقة</Chip>
          )}
          {v.livenessScore != null ? (
            <Chip tone={v.livenessScore >= 0.8 ? 'green' : 'amber'} dot>
              حيوية {formatPercent(v.livenessScore, 0)}
            </Chip>
          ) : (
            <Chip tone="gray">بانتظار الحيوية</Chip>
          )}
        </div>
      </div>
    </div>
  );
}
