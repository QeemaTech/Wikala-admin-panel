import { Donut } from '@/components/charts/Donut';
import { Card } from '@/components/ui/Card';
import type { CategoryDistItem } from '@/features/dashboard/use-dashboard';

interface CategoryDonutProps {
  distribution: CategoryDistItem[];
}

export function CategoryDonut({ distribution }: CategoryDonutProps) {
  const slices = distribution.map((c) => ({
    name: c.name,
    value: c.count,
    color: c.color,
  }));

  return (
    <Card title="توزيع الفئات" sub="الإعلانات النشطة والمنتهية">
      <Donut slices={slices} />
    </Card>
  );
}
