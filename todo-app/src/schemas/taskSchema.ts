import { z } from 'zod';
import { dueDateFromInput } from '@/lib/dates';
import { TASK_PRIORITIES, TASK_STATUSES, type TaskInput } from '@/types/database';

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'กรุณากรอกชื่องาน')
    .max(200, 'ชื่องานต้องไม่เกิน 200 ตัวอักษร'),
  description: z.string().trim().max(2000, 'รายละเอียดต้องไม่เกิน 2,000 ตัวอักษร'),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  due_date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, 'รูปแบบวันที่ไม่ถูกต้อง'),
  category_id: z.union([z.literal(''), z.string().uuid('หมวดหมู่ไม่ถูกต้อง')]),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export function toTaskInput(values: TaskFormValues): TaskInput {
  return {
    title: values.title,
    description: values.description === '' ? null : values.description,
    status: values.status,
    priority: values.priority,
    due_date: dueDateFromInput(values.due_date),
    category_id: values.category_id === '' ? null : values.category_id,
  };
}
