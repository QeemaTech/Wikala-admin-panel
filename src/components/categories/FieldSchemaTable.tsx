'use client';

import { useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Switch } from '@/components/forms/Field';
import { FieldForm } from './FieldForm';
import { useCategoryFields } from '@/features/categories/use-categories';
import { useUpdateField, useDeleteField } from '@/features/categories/use-category-fields';
import type { CategoryFieldDTO } from '@/features/categories/use-categories';

const TYPE_LABEL: Record<string, string> = {
  text: 'نص',
  number: 'رقم',
  select: 'اختيار',
  boolean: 'نعم/لا',
};

interface FieldSchemaTableProps {
  categoryId: string;
}

export function FieldSchemaTable({ categoryId }: FieldSchemaTableProps) {
  const { data, isLoading } = useCategoryFields(categoryId);
  const updateField = useUpdateField(categoryId);
  const deleteField = useDeleteField(categoryId);
  const [editingField, setEditingField] = useState<CategoryFieldDTO | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const fields = data?.items ?? [];

  const handleToggle = (field: CategoryFieldDTO, key: 'searchable' | 'filterable') => {
    updateField.mutate({
      fieldId: field._id,
      payload: { [key]: !field[key] },
    });
  };

  const handleDelete = (fieldId: string) => {
    if (confirm('هل تريد حذف هذا الحقل؟')) {
      deleteField.mutate(fieldId);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-ink">الحقول الديناميكية</h3>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-[7px] border border-border bg-surface px-2.5 py-1.5 text-[12px] font-medium text-ink hover:bg-surface-2"
        >
          <Icon name="plus" size={12} />
          إضافة حقل
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-[8px] bg-surface" />)}
        </div>
      ) : fields.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">لا توجد حقول لهذه الفئة</p>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2.5 text-start font-medium text-muted">الاسم</th>
                <th className="px-3 py-2.5 text-start font-medium text-muted">النوع</th>
                <th className="px-3 py-2.5 text-start font-medium text-muted">إلزامي</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted">قابل للبحث</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted">قابل للفلترة</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field._id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-ink">{field.label_ar}</span>
                    <span className="ms-1.5 font-mono text-[11px] text-muted">{field.key}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Chip tone="gray">{TYPE_LABEL[field.type] ?? field.type}</Chip>
                  </td>
                  <td className="px-3 py-2.5">
                    {field.required
                      ? <Chip tone="green" dot>إلزامي</Chip>
                      : <Chip tone="gray" dot>اختياري</Chip>
                    }
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Switch
                      checked={field.searchable}
                      onChange={() => handleToggle(field, 'searchable')}
                      disabled={updateField.isPending}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Switch
                      checked={field.filterable}
                      onChange={() => handleToggle(field, 'filterable')}
                      disabled={updateField.isPending}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingField(field)}
                        className="flex items-center gap-1 rounded-[5px] px-2 py-1 text-[12px] text-muted hover:bg-surface hover:text-ink"
                      >
                        <Icon name="pencil" size={12} />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(field._id)}
                        className="grid h-6 w-6 place-items-center rounded-[5px] text-muted hover:bg-red/10 hover:text-red"
                        disabled={deleteField.isPending}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingField && (
        <FieldForm
          categoryId={categoryId}
          field={editingField}
          onClose={() => setEditingField(null)}
        />
      )}
      {addOpen && (
        <FieldForm
          categoryId={categoryId}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}
