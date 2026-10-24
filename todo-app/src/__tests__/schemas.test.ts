import { describe, expect, it } from 'vitest';
import { loginSchema, profileSchema, registerSchema, resetPasswordSchema } from '@/schemas/authSchema';
import { categoryFormSchema } from '@/schemas/categorySchema';
import { taskFormSchema, toTaskInput } from '@/schemas/taskSchema';

const validTask = {
  title: '  ซื้อของ  ',
  description: '',
  status: 'todo' as const,
  priority: 'medium' as const,
  due_date: '',
  category_id: '',
};

describe('taskFormSchema', () => {
  it('trim ชื่องานและยอมรับค่าที่ถูกต้อง', () => {
    const r = taskFormSchema.safeParse(validTask);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.title).toBe('ซื้อของ');
  });
  it('ปฏิเสธชื่อว่าง/ช่องว่างล้วน', () => {
    expect(taskFormSchema.safeParse({ ...validTask, title: '   ' }).success).toBe(false);
  });
  it('ปฏิเสธชื่อยาวเกิน 200', () => {
    expect(taskFormSchema.safeParse({ ...validTask, title: 'ก'.repeat(201) }).success).toBe(false);
  });
  it('ปฏิเสธ status/priority ที่ไม่อยู่ในรายการ', () => {
    expect(taskFormSchema.safeParse({ ...validTask, status: 'done' }).success).toBe(false);
    expect(taskFormSchema.safeParse({ ...validTask, priority: 'urgent' }).success).toBe(false);
  });
  it('ปฏิเสธ category_id ที่ไม่ใช่ uuid และวันที่ผิดรูปแบบ', () => {
    expect(taskFormSchema.safeParse({ ...validTask, category_id: 'abc' }).success).toBe(false);
    expect(taskFormSchema.safeParse({ ...validTask, due_date: '31/12/2026' }).success).toBe(false);
  });
});

describe('toTaskInput', () => {
  it('แปลงค่าว่างเป็น null', () => {
    const parsed = taskFormSchema.parse(validTask);
    expect(toTaskInput(parsed)).toMatchObject({ description: null, due_date: null, category_id: null, title: 'ซื้อของ' });
  });
  it('แปลงวันที่เป็น ISO และคง category_id', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const parsed = taskFormSchema.parse({ ...validTask, due_date: '2026-12-31', category_id: id, description: 'รายละเอียด' });
    const input = toTaskInput(parsed);
    expect(input.category_id).toBe(id);
    expect(input.description).toBe('รายละเอียด');
    expect(typeof input.due_date).toBe('string');
    expect(new Date(input.due_date as string).getFullYear()).toBeGreaterThanOrEqual(2026);
  });
});

describe('categoryFormSchema', () => {
  it('ตรวจชื่อและรูปแบบสี hex', () => {
    expect(categoryFormSchema.safeParse({ name: 'งาน', color: '#2563eb' }).success).toBe(true);
    expect(categoryFormSchema.safeParse({ name: '', color: '#2563eb' }).success).toBe(false);
    expect(categoryFormSchema.safeParse({ name: 'งาน', color: 'blue' }).success).toBe(false);
    expect(categoryFormSchema.safeParse({ name: 'ก'.repeat(41), color: '#2563eb' }).success).toBe(false);
  });
});

describe('auth schemas', () => {
  it('login: ต้องมีอีเมลถูกรูปแบบและรหัสผ่าน', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
  it('register: รหัสผ่าน >= 8 ตัวและต้องตรงกัน', () => {
    const base = { displayName: 'สมชาย', email: 'a@b.co', password: 'password1', confirmPassword: 'password1' };
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: 'short', confirmPassword: 'short' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, confirmPassword: 'different1' }).success).toBe(false);
  });
  it('reset password: ต้องตรงกัน', () => {
    expect(resetPasswordSchema.safeParse({ password: 'password1', confirmPassword: 'password2' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: 'password1', confirmPassword: 'password1' }).success).toBe(true);
  });
  it('profile: avatar ต้องเป็น https หรือว่าง', () => {
    expect(profileSchema.safeParse({ display_name: 'a', avatar_url: '' }).success).toBe(true);
    expect(profileSchema.safeParse({ display_name: 'a', avatar_url: 'https://x.co/a.png' }).success).toBe(true);
    expect(profileSchema.safeParse({ display_name: 'a', avatar_url: 'http://x.co/a.png' }).success).toBe(false);
    expect(profileSchema.safeParse({ display_name: 'a', avatar_url: 'javascript:alert(1)' }).success).toBe(false);
  });
});
