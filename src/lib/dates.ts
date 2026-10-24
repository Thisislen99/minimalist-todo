import { endOfDay, format, isToday, isTomorrow, isYesterday, parse } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Task } from '@/types/database';

/** แปลงค่าจาก <input type="date"> (yyyy-MM-dd) เป็นสิ้นวันตามเวลาท้องถิ่น (ISO) */
export function dueDateFromInput(value: string): string | null {
  if (!value) return null;
  const d = parse(value, 'yyyy-MM-dd', new Date());
  if (Number.isNaN(d.getTime())) return null;
  return endOfDay(d).toISOString();
}

export function dueDateToInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : format(d, 'yyyy-MM-dd');
}

export function todayInput(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isOverdue(task: Pick<Task, 'due_date' | 'status'>, now: Date = new Date()): boolean {
  if (!task.due_date || task.status === 'completed') return false;
  return new Date(task.due_date).getTime() < now.getTime();
}

export function formatDue(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return 'วันนี้';
  if (isTomorrow(d)) return 'พรุ่งนี้';
  if (isYesterday(d)) return 'เมื่อวาน';
  return format(d, 'd MMM yyyy', { locale: th });
}

export function completionRate(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

/** ทำความสะอาดคำค้นสำหรับ PostgREST or()/ilike: ตัดอักขระที่แยก filter และ escape wildcard */
export function sanitizeSearch(input: string): string {
  return input
    .trim()
    .replace(/[,()"\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[%_]/g, (m) => `\\${m}`)
    .trim();
}
