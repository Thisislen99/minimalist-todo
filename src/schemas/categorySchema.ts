import { z } from 'zod';

export const CATEGORY_COLORS = [
  '#2563eb',
  '#0891b2',
  '#059669',
  '#65a30d',
  '#d97706',
  '#dc2626',
  '#db2777',
  '#7c3aed',
  '#52525b',
] as const;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อหมวดหมู่').max(40, 'ชื่อหมวดหมู่ต้องไม่เกิน 40 ตัวอักษร'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'สีไม่ถูกต้อง'),
});
