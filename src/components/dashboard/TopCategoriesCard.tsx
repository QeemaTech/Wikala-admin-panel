import { Card } from '@/components/ui/Card';
import { BarRow } from '@/components/ui/BarRow';

interface TopCategoryItem {
  categoryId: string | null;
  name: string | null;
  count: number;
}

interface TopCategoriesCardProps {
  categories: TopCategoryItem[];
}

export function TopCategoriesCard({ categories }: TopCategoriesCardProps) {
  const max = categories[0]?.count ?? 1;
  return (
    <Card title="أعلى الفئات بحركة الإعلانات">
      <div className="space-y-3">
        {categories.map((cat, i) => (
          <BarRow
            key={cat.categoryId ?? i}
            label={cat.name ?? 'غير محدد'}
            value={cat.count}
            max={max}
            color="#226199"
          />
        ))}
        {categories.length === 0 && (
          <p className="py-2 text-center text-[13px] text-muted">لا توجد بيانات</p>
        )}
      </div>
    </Card>
  );
}
