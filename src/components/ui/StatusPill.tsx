import { Chip } from './Chip';

type ChipTone = 'green' | 'red' | 'amber' | 'violet' | 'teal' | 'blue' | 'gray';

const STATUS_MAP: Record<string, { label: string; tone: ChipTone }> = {
  ACTIVE: { label: 'نشط', tone: 'green' },
  PENDING: { label: 'قيد المراجعة', tone: 'amber' },
  UNDER_REVIEW: { label: 'تحت المراجعة', tone: 'blue' },
  APPROVED: { label: 'مقبول', tone: 'green' },
  REJECTED: { label: 'مرفوض', tone: 'red' },
  EXPIRED: { label: 'منتهي', tone: 'gray' },
  WARNED: { label: 'محذَّر', tone: 'amber' },
  BANNED: { label: 'محظور', tone: 'red' },
  SUSPENDED: { label: 'موقوف', tone: 'red' },
  SUBMITTED: { label: 'مُقدَّم', tone: 'violet' },
  VERIFIED: { label: 'موثَّق', tone: 'green' },
  PREMIUM: { label: 'مميز', tone: 'violet' },
  OPEN: { label: 'مفتوح', tone: 'amber' },
  RESOLVED: { label: 'تم الحل', tone: 'green' },
  DISMISSED: { label: 'مُغلق', tone: 'gray' },
  // Products
  DRAFT: { label: 'مسودة', tone: 'gray' },
  HIDDEN: { label: 'مخفي', tone: 'gray' },
  OUT_OF_STOCK: { label: 'نفدت الكمية', tone: 'red' },
  // Orders
  PENDING_PAYMENT: { label: 'بانتظار الدفع', tone: 'amber' },
  CONFIRMED: { label: 'مؤكَّد', tone: 'blue' },
  SHIPPED: { label: 'تم الشحن', tone: 'violet' },
  DELIVERED: { label: 'تم التسليم', tone: 'green' },
  CANCELLED: { label: 'ملغي', tone: 'gray' },
  REFUNDED: { label: 'مُسترجع', tone: 'gray' },
  // Order payment status
  UNPAID: { label: 'غير مدفوع', tone: 'amber' },
  PAID: { label: 'مدفوع', tone: 'green' },
  FAILED: { label: 'فشل', tone: 'red' },
  active: { label: 'نشط', tone: 'green' },
  suspended: { label: 'موقوف', tone: 'red' },
  pending_2fa: { label: 'في الانتظار', tone: 'amber' },
  disabled: { label: 'معطَّل', tone: 'gray' },
};

interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const map = STATUS_MAP[status] ?? { label: status, tone: 'gray' as ChipTone };
  return (
    <Chip tone={map.tone} dot>
      {map.label}
    </Chip>
  );
}
