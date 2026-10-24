import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { SelectField, TextAreaField, TextField } from '@/components/ui/fields';
import { Modal } from '@/components/ui/Modal';
import { useCategories } from '@/hooks/useCategories';
import { dueDateToInput } from '@/lib/dates';
import { toAppError } from '@/lib/errors';
import { PRIORITY_LABEL, STATUS_LABEL } from '@/lib/labels';
import { fieldErrors } from '@/schemas/authSchema';
import { taskFormSchema, toTaskInput, type TaskFormValues } from '@/schemas/taskSchema';
import { createTask, updateTask } from '@/services/taskService';
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from '@/types/database';

interface DialogProps {
  open: boolean;
  task: Task | null;
  defaults?: Partial<TaskFormValues>;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskDialog({ open, task, defaults, onClose, onSaved }: DialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={task ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}>
      <TaskForm task={task} defaults={defaults} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

function initialValues(task: Task | null, defaults?: Partial<TaskFormValues>): TaskFormValues {
  if (task) {
    return {
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      due_date: dueDateToInput(task.due_date),
      category_id: task.category_id ?? '',
    };
  }
  return {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    category_id: '',
    ...defaults,
  };
}

function TaskForm({ task, defaults, onClose, onSaved }: Omit<DialogProps, 'open'>) {
  const [values, setValues] = useState<TaskFormValues>(() => initialValues(task, defaults));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { categories, loading: loadingCategories } = useCategories();

  const set = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return; // กันกดซ้ำ

    const parsed = taskFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const input = toTaskInput(parsed.data);
      if (task) {
        await updateTask(task.id, input, task.updated_at);
        toast.success('บันทึกการแก้ไขแล้ว');
      } else {
        await createTask(input);
        toast.success('เพิ่มงานแล้ว');
      }
      onSaved();
      onClose();
    } catch (err) {
      const appErr = toAppError(err);
      toast.error(appErr.userMessage);
      if (appErr.code === 'CONFLICT') {
        onSaved();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <TextField
        label="ชื่องาน"
        value={values.title}
        onChange={(e) => set('title', e.target.value)}
        error={errors.title}
        maxLength={200}
        autoFocus
        required
      />
      <TextAreaField
        label="รายละเอียด"
        value={values.description}
        onChange={(e) => set('description', e.target.value)}
        error={errors.description}
        maxLength={2000}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="สถานะ" value={values.status} onChange={(e) => set('status', e.target.value as TaskFormValues['status'])}>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="ความสำคัญ"
          value={values.priority}
          onChange={(e) => set('priority', e.target.value as TaskFormValues['priority'])}
        >
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="วันครบกำหนด"
          type="date"
          value={values.due_date}
          onChange={(e) => set('due_date', e.target.value)}
          error={errors.due_date}
        />
        <SelectField
          label="หมวดหมู่"
          value={values.category_id}
          onChange={(e) => set('category_id', e.target.value)}
          error={errors.category_id}
          disabled={loadingCategories}
        >
          <option value="">ไม่มีหมวดหมู่</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          ยกเลิก
        </Button>
        <Button type="submit" loading={submitting}>
          {task ? 'บันทึก' : 'เพิ่มงาน'}
        </Button>
      </div>
    </form>
  );
}
