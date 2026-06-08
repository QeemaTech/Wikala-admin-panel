'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useReorderCategories } from '@/features/categories/use-category-mutations';
import type { CategoryDTO } from '@/features/categories/use-categories';

interface ReorderPanelProps {
  categories: CategoryDTO[];
  onDone: () => void;
}

export function ReorderPanel({ categories, onDone }: ReorderPanelProps) {
  const [items, setItems] = useState(categories);
  const reorder = useReorderCategories();

  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const handleSave = () => {
    reorder.mutate(
      items.map((c) => c.id),
      { onSuccess: onDone },
    );
  };

  return (
    <div className="rounded-[var(--radius)] border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-[13px] font-medium text-ink">
          رتّب الفئات بالسهمين ثم اضغط حفظ
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onDone}
            className="rounded-[7px] border border-border px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={reorder.isPending}
            className="rounded-[7px] bg-brand px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-brand/90 disabled:opacity-50"
          >
            {reorder.isPending ? 'جارٍ الحفظ…' : 'حفظ الترتيب'}
          </button>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {items.map((cat, i) => (
          <li key={cat.id} className="flex items-center gap-3 px-4 py-3">
            <span className="w-6 text-center font-mono text-[12px] text-muted">{i + 1}</span>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-xl"
              style={{
                background: `linear-gradient(135deg, ${cat.color}33, ${cat.color}88)`,
                color: cat.color,
              }}
            >
              {cat.glyph || '📦'}
            </span>
            <span className="flex-1 text-[13px] font-medium text-ink">{cat.nameAr}</span>
            <div className="flex gap-1">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink disabled:opacity-30"
              >
                <Icon name="chevron-up" size={14} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink disabled:opacity-30"
              >
                <Icon name="chevron-down" size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
