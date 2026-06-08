/**
 * Curated Fluent Emoji 3D icons for category glyphs (the `glyph` field stores
 * the full Iconify id, e.g. `fluent-emoji:automobile`). Each entry carries an
 * Arabic label + keywords so the picker is searchable in Arabic and English.
 * All names verified present in @iconify-json/fluent-emoji.
 */
export interface CategoryIconOption {
  id: string;   // full iconify id, e.g. 'fluent-emoji:automobile'
  ar: string;   // Arabic label
  kw: string;   // extra search keywords (en + ar)
}

const E = (name: string, ar: string, kw = ''): CategoryIconOption => ({
  id: `fluent-emoji:${name}`,
  ar,
  kw: `${name} ${kw}`,
});

export const CATEGORY_ICONS: CategoryIconOption[] = [
  // Vehicles
  E('automobile', 'سيارة', 'car ملاكي'),
  E('sport-utility-vehicle', 'دفع رباعي', 'suv jeep'),
  E('taxi', 'تاكسي', 'taxi'),
  E('pickup-truck', 'بيك أب', 'truck نقل'),
  E('delivery-truck', 'شاحنة', 'truck نقل'),
  E('racing-car', 'سيارة رياضية', 'sports car'),
  E('motorcycle', 'دراجة نارية', 'motorbike'),
  E('motor-scooter', 'سكوتر', 'scooter'),
  E('bicycle', 'دراجة', 'bike'),
  // Property
  E('house', 'منزل', 'home عقار'),
  E('house-with-garden', 'فيلا', 'villa عقار'),
  E('office-building', 'مبنى', 'office محل'),
  E('building-construction', 'إنشاءات', 'construction'),
  E('convenience-store', 'متجر', 'store shop'),
  E('department-store', 'مركز تجاري', 'mall'),
  // Electronics
  E('mobile-phone', 'جوال', 'phone هاتف'),
  E('laptop', 'لابتوب', 'laptop كمبيوتر'),
  E('desktop-computer', 'كمبيوتر', 'computer pc'),
  E('camera', 'كاميرا', 'camera'),
  E('camera-with-flash', 'كاميرا فلاش', 'camera'),
  E('television', 'تلفزيون', 'tv'),
  E('headphone', 'سماعات', 'headphones'),
  E('keyboard', 'كيبورد', 'keyboard'),
  E('computer-mouse', 'ماوس', 'mouse'),
  E('printer', 'طابعة', 'printer'),
  E('battery', 'بطارية', 'battery'),
  E('video-game', 'ألعاب', 'gaming games'),
  E('joystick', 'يد تحكم', 'controller gaming'),
  // Home & furniture
  E('couch-and-lamp', 'أثاث', 'sofa furniture كنب'),
  E('bed', 'سرير', 'bed غرف نوم'),
  E('chair', 'كرسي', 'chair'),
  E('electric-plug', 'أجهزة منزلية', 'appliance plug'),
  E('light-bulb', 'إضاءة', 'light lamp'),
  E('kitchen-knife', 'مطبخ', 'kitchen'),
  E('fork-and-knife', 'أدوات مائدة', 'dining'),
  E('potted-plant', 'نباتات', 'plant garden'),
  E('bouquet', 'زهور', 'flowers'),
  // Fashion
  E('dress', 'فستان', 'dress ملابس'),
  E('t-shirt', 'ملابس', 'clothes shirt'),
  E('high-heeled-shoe', 'أحذية', 'shoes heels'),
  E('running-shoe', 'حذاء رياضي', 'sneaker shoes'),
  E('handbag', 'حقيبة يد', 'bag purse'),
  E('backpack', 'حقيبة ظهر', 'bag'),
  E('sunglasses', 'نظارات', 'glasses'),
  E('watch', 'ساعة', 'watch'),
  E('ring', 'مجوهرات', 'jewelry ring خاتم'),
  E('gem-stone', 'أحجار كريمة', 'gem jewelry'),
  E('lipstick', 'مكياج', 'makeup cosmetics'),
  // Kids
  E('baby', 'أطفال', 'baby kids'),
  E('baby-bottle', 'مستلزمات أطفال', 'baby'),
  E('teddy-bear', 'ألعاب أطفال', 'toys'),
  // Work / services
  E('briefcase', 'وظائف', 'jobs work'),
  E('hammer-and-wrench', 'خدمات', 'services tools'),
  E('wrench', 'صيانة', 'repair tools'),
  E('toolbox', 'عدة', 'tools'),
  E('gear', 'إعدادات', 'gear settings'),
  // Sports & hobbies
  E('soccer-ball', 'كرة قدم', 'football رياضة'),
  E('basketball', 'كرة سلة', 'basketball رياضة'),
  E('tennis', 'تنس', 'tennis رياضة'),
  E('books', 'كتب', 'books'),
  E('musical-keyboard', 'موسيقى', 'music piano'),
  E('guitar', 'آلات موسيقية', 'music guitar'),
  // Pets
  E('dog-face', 'كلاب', 'dog pets حيوانات'),
  E('cat-face', 'قطط', 'cat pets حيوانات'),
  // Commerce
  E('shopping-cart', 'تسوق', 'cart shopping'),
  E('shopping-bags', 'مشتريات', 'shopping bags'),
  E('package', 'منتجات', 'package box'),
  E('flashlight', 'إضاءة محمولة', 'flashlight'),
];

/** Default glyph used when a category has none. */
export const DEFAULT_CATEGORY_ICON = 'fluent-emoji:package';
