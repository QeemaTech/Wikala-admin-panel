// Enum value → Arabic label maps mirroring API Contract §9 enums
// (`Governorate`, `AdCondition`). Used by the shared search/filter bar and
// any view that renders these enums. Values match the contract exactly.

export const GOVERNORATES = [
  // Egypt
  'CAIRO', 'GIZA', 'ALEXANDRIA', 'QALYUBIA', 'DAKAHLIA', 'SHARQIA', 'BEHEIRA',
  'MINYA', 'SOHAG', 'ASYUT', 'ASWAN', 'LUXOR', 'RED_SEA', 'MATRUH', 'NEW_VALLEY',
  'NORTH_SINAI', 'SOUTH_SINAI', 'PORT_SAID', 'ISMAILIA', 'SUEZ', 'DAMIETTA',
  'KAFR_EL_SHEIKH', 'GHARBIA', 'MENOUFIA', 'FAYOUM', 'BENI_SUEF', 'QENA',
  // Saudi Arabia (13 regions)
  'RIYADH', 'MAKKAH', 'MADINAH', 'EASTERN_PROVINCE', 'QASSIM', 'ASIR', 'TABUK',
  'HAIL', 'NORTHERN_BORDERS', 'JAZAN', 'NAJRAN', 'BAHAH', 'JAWF',
  // United Arab Emirates (7 emirates)
  'ABU_DHABI', 'DUBAI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH',
] as const;

export type Governorate = (typeof GOVERNORATES)[number];

export const GOVERNORATE_LABELS: Record<Governorate, string> = {
  CAIRO: 'القاهرة',
  GIZA: 'الجيزة',
  ALEXANDRIA: 'الإسكندرية',
  QALYUBIA: 'القليوبية',
  DAKAHLIA: 'الدقهلية',
  SHARQIA: 'الشرقية',
  BEHEIRA: 'البحيرة',
  MINYA: 'المنيا',
  SOHAG: 'سوهاج',
  ASYUT: 'أسيوط',
  ASWAN: 'أسوان',
  LUXOR: 'الأقصر',
  RED_SEA: 'البحر الأحمر',
  MATRUH: 'مطروح',
  NEW_VALLEY: 'الوادي الجديد',
  NORTH_SINAI: 'شمال سيناء',
  SOUTH_SINAI: 'جنوب سيناء',
  PORT_SAID: 'بورسعيد',
  ISMAILIA: 'الإسماعيلية',
  SUEZ: 'السويس',
  DAMIETTA: 'دمياط',
  KAFR_EL_SHEIKH: 'كفر الشيخ',
  GHARBIA: 'الغربية',
  MENOUFIA: 'المنوفية',
  FAYOUM: 'الفيوم',
  BENI_SUEF: 'بني سويف',
  QENA: 'قنا',
  // Saudi Arabia
  RIYADH: 'الرياض',
  MAKKAH: 'مكة المكرمة',
  MADINAH: 'المدينة المنورة',
  EASTERN_PROVINCE: 'المنطقة الشرقية',
  QASSIM: 'القصيم',
  ASIR: 'عسير',
  TABUK: 'تبوك',
  HAIL: 'حائل',
  NORTHERN_BORDERS: 'الحدود الشمالية',
  JAZAN: 'جازان',
  NAJRAN: 'نجران',
  BAHAH: 'الباحة',
  JAWF: 'الجوف',
  // United Arab Emirates
  ABU_DHABI: 'أبو ظبي',
  DUBAI: 'دبي',
  SHARJAH: 'الشارقة',
  AJMAN: 'عجمان',
  UMM_AL_QUWAIN: 'أم القيوين',
  RAS_AL_KHAIMAH: 'رأس الخيمة',
  FUJAIRAH: 'الفجيرة',
};

/**
 * Best-effort map of a reverse-geocoded place string (Arabic, e.g. Google's
 * "محافظة القاهرة") to a `Governorate` enum key by matching its Arabic label.
 * Returns null when no enum label is contained in the string, so callers can
 * fall back to a manual selection rather than submitting an invalid enum.
 */
export function matchGovernorate(geocoded: string | null | undefined): Governorate | null {
  if (!geocoded) return null;
  const normalized = geocoded.replace(/محافظة/g, '').trim();
  for (const key of GOVERNORATES) {
    const label = GOVERNORATE_LABELS[key];
    if (normalized.includes(label) || geocoded.includes(label)) return key;
  }
  return null;
}

export function governorateLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return GOVERNORATE_LABELS[value as Governorate] ?? value;
}

export const AD_CONDITIONS = ['NEW', 'PRELOVED', 'REFURBISHED'] as const;
export type AdCondition = (typeof AD_CONDITIONS)[number];

export const CONDITION_LABELS: Record<AdCondition, string> = {
  NEW: 'جديد',
  PRELOVED: 'مستعمل',
  REFURBISHED: 'مُجدّد',
};

export function conditionLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return CONDITION_LABELS[value as AdCondition] ?? value;
}
