import { describe, expect, it } from 'vitest';
import { AppError, toAppError } from '@/lib/errors';

describe('toAppError', () => {
  it('คืน AppError เดิม', () => {
    const e = new AppError('x', 'CONFLICT');
    expect(toAppError(e)).toBe(e);
  });
  it('แปลง network error', () => {
    expect(toAppError(new TypeError('Failed to fetch')).code).toBe('NETWORK');
  });
  it('แปลง RLS/permission, duplicate, FK', () => {
    expect(toAppError({ code: '42501', message: 'new row violates row-level security policy' }).code).toBe('FORBIDDEN');
    expect(toAppError({ code: '23505' }).code).toBe('DUPLICATE');
    expect(toAppError({ code: '23503' }).code).toBe('REFERENCE');
  });
  it('แปลง session หมดอายุ', () => {
    expect(toAppError({ message: 'JWT expired' }).code).toBe('SESSION');
    expect(toAppError({ status: 401 }).code).toBe('SESSION');
  });
  it('แปลง error ของ auth', () => {
    expect(toAppError({ code: 'invalid_credentials' }).userMessage).toContain('ไม่ถูกต้อง');
    expect(toAppError({ code: 'email_not_confirmed' }).userMessage).toContain('ยืนยันอีเมล');
  });
  it('ไม่เปิดเผยข้อความภายในของระบบ', () => {
    const e = toAppError({ message: 'relation "public.tasks" does not exist at character 15' });
    expect(e.userMessage).not.toContain('public.tasks');
    expect(e.code).toBe('UNKNOWN');
  });
});
