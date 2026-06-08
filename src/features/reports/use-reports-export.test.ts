import { describe, expect, it } from 'vitest';
import { reportToCsvRow } from './use-reports-export';
import type { ReportDTO } from './use-reports';

const base: ReportDTO = {
  id: 'report-abc123',
  subjectType: 'AD',
  subjectId: 'ad-998877',
  subjectSnapshot: null,
  subjectLabel: 'آيفون مشبوه',
  reporterId: 'u1',
  reporterName: 'أحمد',
  type: 'SCAM',
  details: 'احتيال',
  attachments: [],
  severity: 'HIGH',
  status: 'NEW',
  slaDueAt: '2026-06-03T12:00:00Z',
  slaRemainingSeconds: 3600,
  createdAt: '2026-06-01T00:00:00Z',
  resolvedAt: null,
  resolverId: null,
  resolutionReason: null,
};

describe('reportToCsvRow', () => {
  it('maps a report to Arabic-headed CSV columns', () => {
    const row = reportToCsvRow(base);
    expect(Object.keys(row)).toEqual([
      'رقم البلاغ', 'النوع', 'المُبلَّغ عنه', 'المُبلِّغ', 'الخطورة',
      'الوقت المتبقي (دقائق)', 'الحالة', 'تاريخ الإنشاء', 'سبب الحل',
    ]);
    expect(row['النوع']).toBe('احتيال');
    expect(row['الخطورة']).toBe('عالية');
    expect(row['الحالة']).toBe('جديد');
    expect(row['الوقت المتبقي (دقائق)']).toBe('60');
    expect(row['المُبلَّغ عنه']).toBe('آيفون مشبوه');
  });

  it('falls back to subject id when no label, and dashes for null SLA', () => {
    const row = reportToCsvRow({ ...base, subjectLabel: null, slaRemainingSeconds: null });
    expect(row['المُبلَّغ عنه']).toBe('إعلان #998877');
    expect(row['الوقت المتبقي (دقائق)']).toBe('—');
  });
});
