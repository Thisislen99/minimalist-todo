import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TextField } from '@/components/ui/fields';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/feedback';
import { Modal } from '@/components/ui/Modal';
import { useTaskActions } from '@/contexts/TaskActionsContext';
import { useCategories } from '@/hooks/useCategories';
import { toAppError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS, categoryFormSchema } from '@/schemas/categorySchema';
import { fieldErrors } from '@/schemas/authSchema';
import { countTasksInCategory, createCategory, deleteCategory, updateCategory } from '@/services/categoryService';
import type { Category } from '@/types/database';

export function CategoriesPage() {
  const { categories, loading, error, refetch } = useCategories();
  const { bump } = useTaskActions();
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<{ category: Category; taskCount: number | null } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function askDelete(category: Category) {
    setToDelete({ category, taskCount: null });
    try {
      const taskCount = await countTasksInCategory(category.id);
      setToDelete((d) => (d && d.category.id === category.id ? { category, taskCount } : d));
    } catch {
      setToDelete((d) => (d && d.category.id === category.id ? { category, taskCount: null } : d));
    }
  }

  async function confirmDelete() {
    if (!toDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteCategory(toDelete.category.id);
      toast.success('ลบหมวดหมู่แล้ว');
      setToDelete(null);
      await refetch();
      bump();
    } catch (e) {
      toast.error(toAppError(e).userMessage);
    } finally {
      setDeleting(false);
    }
  }

  const description = toDelete
    ? toDelete.taskCount === null
      ? `หมวดหมู่ “${toDelete.category.name}” จะถูกลบ งานที่อยู่ในหมวดหมู่นี้จะไม่ถูกลบ แต่จะกลายเป็นงานที่ไม่มีหมวดหมู่`
      : toDelete.taskCount > 0
        ? `มีงาน ${toDelete.taskCount.toLocaleString('th-TH')} รายการในหมวดหมู่ “${toDelete.category.name}” งานเหล่านี้จะไม่ถูกลบ แต่จะกลายเป็นงานที่ไม่มีหมวดหมู่`
        : `หมวดหมู่ “${toDelete.category.name}” ไม่มีงานอยู่ และจะถูกลบถาวร`
    : '';

  return (
    <>
      <PageHeader
        title="หมวดหมู่"
        description="จัดกลุ่มงานด้วยหมวดหมู่และสี"
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            เพิ่มหมวดหมู่
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : loading && categories.length === 0 ? (
        <Skeleton className="h-40" />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-10 w-10" aria-hidden="true" />}
          title="ยังไม่มีหมวดหมู่"
          description="สร้างหมวดหมู่ เช่น งาน เรียน หรือส่วนตัว เพื่อจัดกลุ่มงานของคุณ"
          action={<Button onClick={() => setEditing('new')}>เพิ่มหมวดหมู่</Button>}
        />
      ) : (
        <ul className="card divide-y divide-zinc-100 dark:divide-zinc-800">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
              <button type="button" className="btn btn-ghost p-2" aria-label={`แก้ไข ${c.name}`} onClick={() => setEditing(c)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="btn btn-ghost p-2 hover:text-red-600 dark:hover:text-red-400"
                aria-label={`ลบ ${c.name}`}
                onClick={() => void askDelete(c)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'เพิ่มหมวดหมู่' : 'แก้ไขหมวดหมู่'}>
        {editing !== null && (
          <CategoryForm
            category={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              void refetch();
              bump();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="ลบหมวดหมู่นี้?"
        description={description}
        confirmLabel="ลบหมวดหมู่"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}

function CategoryForm({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState<string>(category?.color ?? CATEGORY_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const parsed = categoryFormSchema.safeParse({ name, color });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSubmitting(true);
    try {
      if (category) await updateCategory(category.id, parsed.data);
      else await createCategory(parsed.data);
      toast.success(category ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มหมวดหมู่แล้ว');
      onSaved();
      onClose();
    } catch (err) {
      const appErr = toAppError(err);
      if (appErr.code === 'DUPLICATE') setErrors({ name: 'มีหมวดหมู่ชื่อนี้อยู่แล้ว' });
      else toast.error(appErr.userMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField label="ชื่อหมวดหมู่" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={40} autoFocus />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">สี</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={`สี ${c}`}
              onClick={() => setColor(c)}
              className={cn(
                'h-8 w-8 rounded-full ring-offset-2 ring-offset-white transition dark:ring-offset-zinc-900',
                color === c && 'ring-2 ring-zinc-900 dark:ring-zinc-100',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        {errors.color && (
          <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {errors.color}
          </p>
        )}
      </fieldset>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          ยกเลิก
        </Button>
        <Button type="submit" loading={submitting}>
          {category ? 'บันทึก' : 'เพิ่มหมวดหมู่'}
        </Button>
      </div>
    </form>
  );
}
