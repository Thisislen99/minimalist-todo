import { describe, expect, it } from 'vitest';
import { completionRate, dueDateFromInput, dueDateToInput, isOverdue, sanitizeSearch } from '@/lib/dates';

describe('completionRate', () => {
  it('คืน 0 เมื่อไม่มีงาน', () => expect(completionRate(0, 0)).toBe(0));
  it('ปัดเศษเป็นจำนวนเต็ม', () => {
    expect(completionRate(1, 3)).toBe(33);
    expect(completionRate(2, 3)).toBe(67);
    expect(completionRate(5, 5)).toBe(100);
  });
});

describe('isOverdue', () => {
  const now = new Date('2026-10-24T12:00:00Z');
  it('เลยกำหนดเมื่อ due_date ผ่านแล้วและยังไม่เสร็จ', () => {
    expect(isOverdue({ due_date: '2026-10-23T00:00:00Z', status: 'todo' }, now)).toBe(true);
    expect(isOverdue({ due_date: '2026-10-23T00:00:00Z', status: 'in_progress' }, now)).toBe(true);
  });
  it('ไม่เลยกำหนดเมื่อเสร็จแล้ว, ไม่มี due_date หรือยังไม่ถึง', () => {
    expect(isOverdue({ due_date: '2026-10-23T00:00:00Z', status: 'completed' }, now)).toBe(false);
    expect(isOverdue({ due_date: null, status: 'todo' }, now)).toBe(false);
    expect(isOverdue({ due_date: '2026-10-25T00:00:00Z', status: 'todo' }, now)).toBe(false);
  });
});

describe('due date conversion', () => {
  it('แปลงไปกลับได้วันเดิม (เวลาท้องถิ่น)', () => {
    const iso = dueDateFromInput('2026-12-31');
    expect(iso).not.toBeNull();
    expect(dueDateToInput(iso)).toBe('2026-12-31');
  });
  it('ค่าว่างหรือไม่ถูกต้องเป็น null', () => {
    expect(dueDateFromInput('')).toBeNull();
    expect(dueDateFromInput('not-a-date')).toBeNull();
    expect(dueDateToInput(null)).toBe('');
  });
});

describe('sanitizeSearch', () => {
  it('ตัดอักขระที่ทำให้ or() filter ของ PostgREST พัง', () => {
    expect(sanitizeSearch('a,b(c)"d"')).toBe('a b c d');
  });
  it('escape wildcard ของ LIKE', () => {
    expect(sanitizeSearch('50%_off')).toBe('50\\%\\_off');
  });
  it('ตัดช่องว่างหัวท้าย', () => expect(sanitizeSearch('   งาน   ')).toBe('งาน'));
});
