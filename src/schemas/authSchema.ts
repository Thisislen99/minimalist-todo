import { z } from 'zod';

const email = z.string().trim().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง');
const password = z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร').max(72, 'รหัสผ่านยาวเกินไป');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(1, 'กรุณากรอกชื่อที่แสดง').max(80, 'ชื่อต้องไม่เกิน 80 ตัวอักษร'),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'รหัสผ่านไม่ตรงกัน',
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'รหัสผ่านไม่ตรงกัน',
  });

export const profileSchema = z.object({
  display_name: z.string().trim().min(1, 'กรุณากรอกชื่อที่แสดง').max(80, 'ชื่อต้องไม่เกิน 80 ตัวอักษร'),
  avatar_url: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https:\/\/\S+$/i.test(v), 'ลิงก์รูปต้องขึ้นต้นด้วย https://'),
});

/** แปลง error ของ zod เป็น { field: message } (ข้อความแรกของแต่ละฟิลด์) */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
