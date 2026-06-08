import type { ReportSeverity, ReportStatus, ReportSubjectType } from './use-reports';

export const REPORT_TYPE_LABEL: Record<string, string> = {
  SCAM: 'احتيال',
  FRAUD: 'نصب',
  COUNTERFEIT: 'تقليد',
  HARASSMENT: 'تحرش',
  IMPERSONATION: 'انتحال هوية',
  VIOLENCE: 'عنف',
  SPAM: 'إزعاج',
  INAPPROPRIATE_CONTENT: 'محتوى غير لائق',
  OTHER: 'أخرى',
  SAFETY_FLAG: 'علم أمان',
};

export function reportTypeLabel(type: string): string {
  return REPORT_TYPE_LABEL[type] ?? type;
}

export const SEVERITY_LABEL: Record<ReportSeverity, string> = {
  HIGH: 'عالية',
  MED: 'متوسطة',
  LOW: 'منخفضة',
};

export const SEVERITY_TONE: Record<ReportSeverity, 'red' | 'amber' | 'teal'> = {
  HIGH: 'red',
  MED: 'amber',
  LOW: 'teal',
};

export const STATUS_LABEL: Record<ReportStatus, string> = {
  NEW: 'جديد',
  UNDER_REVIEW: 'قيد المراجعة',
  ESCALATED: 'تصعيد',
  RESOLVED: 'تم الحل',
  DISMISSED: 'مرفوض',
};

export const STATUS_TONE: Record<ReportStatus, 'blue' | 'amber' | 'red' | 'green' | 'gray'> = {
  NEW: 'blue',
  UNDER_REVIEW: 'amber',
  ESCALATED: 'red',
  RESOLVED: 'green',
  DISMISSED: 'gray',
};

export const SUBJECT_TYPE_LABEL: Record<ReportSubjectType, string> = {
  AD: 'إعلان',
  USER: 'مستخدم',
  MESSAGE: 'رسالة',
};
