import { describe, expect, it } from 'vitest';
import { applyTaskFilters, type FilterBuilder } from '@/services/taskService';
import type { TaskFilters } from '@/types/database';

/** builder ปลอมที่บันทึกการเรียก เพื่อตรวจว่าสร้าง query ถูกต้อง */
class FakeBuilder implements FilterBuilder {
  calls: Array<[string, ...string[]]> = [];
  private rec(name: string, ...args: string[]): this {
    this.calls.push([name, ...args]);
    return this;
  }
  eq(c: string, v: string) { return this.rec('eq', c, v); }
  neq(c: string, v: string) { return this.rec('neq', c, v); }
  lt(c: string, v: string) { return this.rec('lt', c, v); }
  lte(c: string, v: string) { return this.rec('lte', c, v); }
  gt(c: string, v: string) { return this.rec('gt', c, v); }
  gte(c: string, v: string) { return this.rec('gte', c, v); }
  or(f: string) { return this.rec('or', f); }
}

const none: TaskFilters = { view: 'all', search: '', status: '', priority: '', categoryId: '', overdueOnly: false };
const now = new Date('2026-10-24T05:00:00');

function run(f: Partial<TaskFilters>) {
  return applyTaskFilters(new FakeBuilder(), { ...none, ...f }, now).calls;
}

describe('applyTaskFilters', () => {
  it('ไม่มีตัวกรอง -> ไม่เรียกอะไรเลย', () => expect(run({})).toEqual([]));

  it('view completed', () => expect(run({ view: 'completed' })).toEqual([['eq', 'status', 'completed']]));

  it('view today: ไม่รวมงานเสร็จ และ due_date <= สิ้นวันนี้', () => {
    const calls = run({ view: 'today' });
    expect(calls[0]).toEqual(['neq', 'status', 'completed']);
    expect(calls[1]?.[0]).toBe('lte');
    expect(calls[1]?.[1]).toBe('due_date');
    const end = new Date(calls[1]?.[2] as string);
    expect(end.getDate()).toBe(24);
    expect(end.getHours()).toBe(23);
  });

  it('view upcoming: due_date > สิ้นวันนี้', () => {
    const calls = run({ view: 'upcoming' });
    expect(calls[0]).toEqual(['neq', 'status', 'completed']);
    expect(calls[1]?.slice(0, 2)).toEqual(['gt', 'due_date']);
  });

  it('กรอง status / priority / category', () => {
    expect(run({ status: 'in_progress', priority: 'high', categoryId: 'cat-1' })).toEqual([
      ['eq', 'status', 'in_progress'],
      ['eq', 'priority', 'high'],
      ['eq', 'category_id', 'cat-1'],
    ]);
  });

  it('overdueOnly: ไม่รวมงานเสร็จ และ due_date < ตอนนี้', () => {
    expect(run({ overdueOnly: true })).toEqual([
      ['neq', 'status', 'completed'],
      ['lt', 'due_date', now.toISOString()],
    ]);
  });

  it('ค้นหา: ใช้ ilike กับ title และ description พร้อม sanitize', () => {
    expect(run({ search: ' ซื้อ,ของ ' })).toEqual([['or', 'title.ilike.%ซื้อ ของ%,description.ilike.%ซื้อ ของ%']]);
  });

  it('คำค้นว่าง/มีแต่ช่องว่างไม่สร้าง filter', () => expect(run({ search: '   ' })).toEqual([]));
});
