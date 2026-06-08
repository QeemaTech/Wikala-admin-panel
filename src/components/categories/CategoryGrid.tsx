'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatNumber } from '@/lib/i18n/format';
import { useDeleteCategory } from '@/features/categories/use-category-mutations';
import { CategoryForm } from './CategoryForm';
import { FieldSchemaTable } from './FieldSchemaTable';
import { CategoryAnalyticsDrawer } from './CategoryAnalyticsDrawer';
import type { CategoryDTO } from '@/features/categories/use-categories';

// ── Sub-category manager panel ───────────────────────────────────────────────

interface SubCategoryManagerProps {
  parent: CategoryDTO;
  onClose: () => void;
}

function SubCategoryManager({ parent, onClose }: SubCategoryManagerProps) {
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [expandedL2Id, setExpandedL2Id] = useState<string | null>(null);
  const [editingL3Id, setEditingL3Id] = useState<string | null>(null);
  const [addL3ForId, setAddL3ForId] = useState<string | null>(null);
  const deleteCategory = useDeleteCategory();

  // Derive live objects from the parent prop (which updates on query refetch)
  const editingSub = editingSubId ? (parent.children.find((c) => c.id === editingSubId) ?? null) : null;
  const expandedL2 = expandedL2Id ? (parent.children.find((c) => c.id === expandedL2Id) ?? null) : null;
  const editingL3 = editingL3Id && expandedL2
    ? (expandedL2.children.find((c) => c.id === editingL3Id) ?? null)
    : null;

  const handleDelete = (sub: CategoryDTO) => {
    if (confirm(`هل تريد حذف القسم الفرعي "${sub.nameAr}"؟`)) {
      deleteCategory.mutate(sub.id);
    }
  };

  const toggleL2 = (id: string) =>
    setExpandedL2Id((prev) => (prev === id ? null : id));

  return (
    <div className="col-span-full rounded-[var(--radius)] border border-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CategoryIcon glyph={parent.glyph} size={20} />
          <span className="text-[13px] font-semibold text-ink">{parent.nameAr}</span>
          <span className="text-[12px] text-muted">— الأقسام الفرعية</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-[7px] border border-border bg-surface px-2.5 py-1.5 text-[12px] font-medium text-ink hover:bg-surface-2"
          >
            <Icon name="plus" size={12} />
            إضافة قسم فرعي
          </button>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>

      {parent.children.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">لا توجد أقسام فرعية</p>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2.5 text-start font-medium text-muted">الاسم</th>
                <th className="px-3 py-2.5 text-start font-medium text-muted">الإعلانات</th>
                <th className="px-3 py-2.5 text-start font-medium text-muted">الترتيب</th>
                <th className="px-3 py-2.5 text-start font-medium text-muted">الحالة</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {parent.children.map((sub) => (
                <>
                  <tr key={sub.id} className="border-b border-border">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <CategoryIcon glyph={sub.glyph || parent.glyph} size={18} />
                        <div>
                          <div className="font-medium text-ink">{sub.nameAr}</div>
                          {sub.nameEn && (
                            <div className="font-mono text-[11px] text-muted">{sub.nameEn}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-ink">
                      {formatNumber(sub.adCount)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px] text-muted">
                      {formatNumber(sub.order)}
                    </td>
                    <td className="px-3 py-2.5">
                      {sub.isActive
                        ? <Chip tone="green" dot>نشط</Chip>
                        : <Chip tone="gray" dot>معطّل</Chip>
                      }
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleL2(sub.id)}
                          title="إدارة الأقسام الفرعية (المستوى 3)"
                          className={`flex items-center gap-1 rounded-[5px] px-2 py-1 text-[12px] transition-colors ${
                            expandedL2Id === sub.id
                              ? 'bg-brand/10 text-brand'
                              : 'text-muted hover:bg-surface hover:text-ink'
                          }`}
                        >
                          <Icon name="layers" size={12} />
                          {sub.children.length > 0 ? formatNumber(sub.children.length) : '—'}
                        </button>
                        <button
                          onClick={() => setEditingSubId(sub.id)}
                          className="flex items-center gap-1 rounded-[5px] px-2 py-1 text-[12px] text-muted hover:bg-surface hover:text-ink"
                        >
                          <Icon name="pencil" size={12} />
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(sub)}
                          className="grid h-6 w-6 place-items-center rounded-[5px] text-muted hover:bg-red/10 hover:text-red"
                          disabled={deleteCategory.isPending}
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Level 3 expansion */}
                  {expandedL2Id === sub.id && (
                    <tr key={`${sub.id}-l3`} className="border-b border-border bg-surface/40">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[12px] font-medium text-muted">
                            الأقسام الفرعية لـ «{sub.nameAr}» (المستوى 3)
                          </span>
                          <button
                            onClick={() => setAddL3ForId(sub.id)}
                            className="flex items-center gap-1 rounded-[6px] border border-border bg-white px-2 py-1 text-[11.5px] font-medium text-ink hover:bg-surface"
                          >
                            <Icon name="plus" size={11} />
                            إضافة
                          </button>
                        </div>
                        {sub.children.length === 0 ? (
                          <p className="py-2 text-[12px] text-muted">لا توجد أقسام فرعية من المستوى الثالث</p>
                        ) : (
                          <div className="overflow-hidden rounded-[8px] border border-border bg-white">
                            <table className="w-full text-[12px]">
                              <tbody>
                                {sub.children.map((l3) => (
                                  <tr key={l3.id} className="border-b border-border last:border-0">
                                    <td className="px-3 py-2">
                                      <span className="me-1.5 inline-flex align-middle"><CategoryIcon glyph={l3.glyph || sub.glyph} size={16} /></span>
                                      <span className="font-medium text-ink">{l3.nameAr}</span>
                                      {l3.nameEn && (
                                        <span className="ms-1.5 font-mono text-[11px] text-muted">{l3.nameEn}</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 font-mono text-muted">{formatNumber(l3.adCount)}</td>
                                    <td className="px-3 py-2">
                                      {l3.isActive
                                        ? <Chip tone="green" dot>نشط</Chip>
                                        : <Chip tone="gray" dot>معطّل</Chip>
                                      }
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => setEditingL3Id(l3.id)}
                                          className="flex items-center gap-1 rounded-[5px] px-1.5 py-1 text-[11.5px] text-muted hover:bg-surface hover:text-ink"
                                        >
                                          <Icon name="pencil" size={11} />
                                          تعديل
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm(`هل تريد حذف "${l3.nameAr}"؟`)) deleteCategory.mutate(l3.id);
                                          }}
                                          className="grid h-5 w-5 place-items-center rounded-[4px] text-muted hover:bg-red/10 hover:text-red"
                                          disabled={deleteCategory.isPending}
                                        >
                                          <Icon name="trash" size={12} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingSub && (
        <CategoryForm category={editingSub} onClose={() => setEditingSubId(null)} />
      )}
      {addOpen && (
        <CategoryForm parentId={parent.id} onClose={() => setAddOpen(false)} />
      )}
      {editingL3 && (
        <CategoryForm category={editingL3} onClose={() => setEditingL3Id(null)} />
      )}
      {addL3ForId && (
        <CategoryForm parentId={addL3ForId} onClose={() => setAddL3ForId(null)} />
      )}
    </div>
  );
}

// ── Category tile ────────────────────────────────────────────────────────────

interface CategoryTileProps {
  category: CategoryDTO;
  onEdit: (c: CategoryDTO) => void;
  onManageSubs: (c: CategoryDTO) => void;
  onAnalytics: (c: CategoryDTO) => void;
}

function CategoryTile({ category, onEdit, onManageSubs, onAnalytics }: CategoryTileProps) {
  const [showFields, setShowFields] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const deleteCategory = useDeleteCategory();

  const handleDelete = () => {
    if (confirm(`هل تريد حذف فئة "${category.nameAr}"؟`)) {
      deleteCategory.mutate(category.id);
    }
    setMenuOpen(false);
  };

  return (
    <>
      <div className="rounded-[var(--radius)] border border-border bg-white shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
              style={{
                background: `linear-gradient(135deg, ${category.color}22, ${category.color}55)`,
              }}
            >
              <CategoryIcon glyph={category.glyph} size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[14px] font-bold text-ink">{category.nameAr}</h3>
              <p className="mt-0.5 text-[12px] text-muted">
                {category.subCount > 0 ? `${formatNumber(category.subCount)} فئة فرعية` : 'فهرس المتاجر'}
              </p>
            </div>
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink"
              >
                <Icon name="more-v" size={15} />
              </button>
              {menuOpen && (
                <div className="absolute end-0 top-full z-20 mt-1 w-36 rounded-[10px] border border-border bg-white py-1 shadow-lg">
                  <button
                    onClick={() => { onAnalytics(category); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[12.5px] text-ink hover:bg-surface"
                  >
                    <Icon name="pie-chart" size={13} />
                    تحليلات
                  </button>
                  <button
                    onClick={() => { onEdit(category); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[12.5px] text-ink hover:bg-surface"
                  >
                    <Icon name="pencil" size={13} />
                    تعديل
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[12.5px] text-red hover:bg-surface"
                  >
                    <Icon name="trash" size={13} />
                    حذف
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border border-t border-border bg-surface/50">
          <div className="px-3 py-2.5 text-center">
            <p className="font-mono text-[13px] font-semibold" style={{ color: category.color }}>
              {formatNumber(category.adCount)}
            </p>
            <p className="text-[11px] text-muted">إعلانات نشطة</p>
          </div>
          <div className="px-3 py-2.5 text-center">
            <p className="font-mono text-[13px] font-semibold text-ink">
              {formatNumber(category.fieldCount)}
            </p>
            <p className="text-[11px] text-muted">حقول ديناميكية</p>
          </div>
          <div className="px-3 py-2.5 text-center">
            <p className="font-mono text-[13px] font-semibold text-ink">{formatNumber(category.order)}</p>
            <p className="text-[11px] text-muted">ترتيب الواجهة</p>
          </div>
        </div>

        <div className="flex gap-2 border-t border-border px-4 py-3">
          <button
            onClick={() => onManageSubs(category)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[7px] border border-border bg-surface px-2.5 py-1.5 text-[12px] font-medium text-ink hover:bg-surface-2"
          >
            <Icon name="layers" size={13} />
            إدارة الأقسام
          </button>
          <button
            onClick={() => setShowFields((v) => !v)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[7px] border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
              showFields
                ? 'border-brand/30 bg-brand/8 text-brand'
                : 'border-border bg-surface text-ink hover:bg-surface-2'
            }`}
          >
            <Icon name="sliders" size={13} />
            الحقول
          </button>
        </div>
      </div>

      {showFields && (
        <div className="col-span-full rounded-[var(--radius)] border border-border bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <CategoryIcon glyph={category.glyph} size={20} />
            <span className="text-[13px] font-semibold text-ink">{category.nameAr}</span>
          </div>
          <FieldSchemaTable categoryId={category.id} />
        </div>
      )}
    </>
  );
}

// ── Grid ─────────────────────────────────────────────────────────────────────

interface CategoryGridProps {
  categories: CategoryDTO[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [managingSubsForId, setManagingSubsForId] = useState<string | null>(null);
  const [analyticsForId, setAnalyticsForId] = useState<string | null>(null);

  // Always derive from live prop so mutations + refetch reflect immediately
  const editingCategory = editingCategoryId ? (categories.find((c) => c.id === editingCategoryId) ?? null) : null;
  const managingSubsFor = managingSubsForId ? (categories.find((c) => c.id === managingSubsForId) ?? null) : null;
  const analyticsFor = analyticsForId ? (categories.find((c) => c.id === analyticsForId) ?? null) : null;

  const handleManageSubs = (cat: CategoryDTO) => {
    setManagingSubsForId((prev) => (prev === cat.id ? null : cat.id));
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <CategoryTile
            key={cat.id}
            category={cat}
            onEdit={(c) => setEditingCategoryId(c.id)}
            onManageSubs={handleManageSubs}
            onAnalytics={(c) => setAnalyticsForId(c.id)}
          />
        ))}

        {managingSubsFor && (
          <SubCategoryManager
            parent={managingSubsFor}
            onClose={() => setManagingSubsForId(null)}
          />
        )}
      </div>

      {editingCategory && (
        <CategoryForm
          category={editingCategory}
          onClose={() => setEditingCategoryId(null)}
        />
      )}

      {analyticsFor && (
        <CategoryAnalyticsDrawer
          category={analyticsFor}
          onClose={() => setAnalyticsForId(null)}
        />
      )}
    </>
  );
}
