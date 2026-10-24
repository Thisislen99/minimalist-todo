import { addDays, endOfDay } from 'date-fns';
import { AppError, toAppError } from '@/lib/errors';
import { sanitizeSearch } from '@/lib/dates';
import { requireUserId, supabase } from '@/lib/supabase';
import type { DashboardStats, Task, TaskFilters, TaskInput, TaskQuery, TaskStatus } from '@/types/database';

export const TASK_PAGE_SIZE = 20;

/** ส่วนของ PostgREST filter builder ที่ใช้ (แยกไว้เพื่อให้ทดสอบ logic ได้) */
export interface FilterBuilder {
  eq(column: string, value: string): this;
  neq(column: string, value: string): this;
  lt(column: string, value: string): this;
  lte(column: string, value: string): this;
  gt(column: string, value: string): this;
  gte(column: string, value: string): this;
  or(filters: string): this;
}

export function applyTaskFilters<T extends FilterBuilder>(query: T, f: TaskFilters, now: Date = new Date()): T {
  let q = query;

  switch (f.view) {
    case 'today':
      // วันนี้ + เลยกำหนด (ยังไม่เสร็จ); งานที่ไม่มี due_date จะไม่ถูกรวม
      q = q.neq('status', 'completed').lte('due_date', endOfDay(now).toISOString());
      break;
    case 'upcoming':
      q = q.neq('status', 'completed').gt('due_date', endOfDay(now).toISOString());
      break;
    case 'completed':
      q = q.eq('status', 'completed');
      break;
    case 'all':
      break;
  }

  if (f.status) q = q.eq('status', f.status);
  if (f.priority) q = q.eq('priority', f.priority);
  if (f.categoryId) q = q.eq('category_id', f.categoryId);
  if (f.overdueOnly) q = q.neq('status', 'completed').lt('due_date', now.toISOString());

  const s = sanitizeSearch(f.search);
  if (s) q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`);

  return q;
}

export async function listTasks(query: TaskQuery): Promise<{ tasks: Task[]; total: number }> {
  try {
    const base = supabase.from('tasks').select('*', { count: 'exact' });
    let q = applyTaskFilters(base as unknown as FilterBuilder, query) as unknown as typeof base;

    const asc = query.sortDir === 'asc';
    if (query.sortKey === 'due_date') {
      q = q.order('due_date', { ascending: asc, nullsFirst: false }).order('created_at', { ascending: false });
    } else if (query.sortKey === 'priority') {
      q = q.order('priority_rank', { ascending: asc }).order('created_at', { ascending: false });
    } else {
      q = q.order('created_at', { ascending: asc });
    }

    const from = (query.page - 1) * query.pageSize;
    const { data, error, count } = await q.range(from, from + query.pageSize - 1);
    if (error) throw error;
    return { tasks: (data ?? []) as Task[], total: count ?? 0 };
  } catch (e) {
    throw toAppError(e);
  }
}

export async function createTask(input: TaskInput): Promise<Task> {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Task;
  } catch (e) {
    throw toAppError(e);
  }
}

const CONFLICT_MESSAGE = 'งานนี้ถูกลบหรือมีการแก้ไขจากที่อื่นแล้ว ระบบจะโหลดข้อมูลล่าสุดให้';

/** อัปเดตงาน; ถ้าส่ง expectedUpdatedAt จะตรวจว่าไม่มี session อื่นแก้ไขไปก่อน */
export async function updateTask(id: string, patch: Partial<TaskInput>, expectedUpdatedAt?: string): Promise<Task> {
  try {
    const match: Record<string, string> = { id };
    if (expectedUpdatedAt) match.updated_at = expectedUpdatedAt;
    const { data, error } = await supabase.from('tasks').update(patch).match(match).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError(CONFLICT_MESSAGE, 'CONFLICT');
    return data as Task;
  } catch (e) {
    throw toAppError(e);
  }
}

export function setTaskStatus(task: Task, status: TaskStatus): Promise<Task> {
  return updateTask(task.id, { status }, task.updated_at);
}

export async function deleteTask(id: string): Promise<void> {
  try {
    const { data, error } = await supabase.from('tasks').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new AppError(CONFLICT_MESSAGE, 'CONFLICT');
  } catch (e) {
    throw toAppError(e);
  }
}

type CountQuery = FilterBuilder & PromiseLike<{ count: number | null; error: unknown }>;

async function countTasks(apply?: (q: FilterBuilder) => FilterBuilder): Promise<number> {
  const base = supabase.from('tasks').select('id', { count: 'exact', head: true }) as unknown as CountQuery;
  const q: PromiseLike<{ count: number | null; error: unknown }> = apply ? (apply(base) as unknown as CountQuery) : base;
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

export async function getDashboardData(): Promise<{ stats: DashboardStats; upcoming: Task[]; recent: Task[] }> {
  try {
    const now = new Date();
    const soon = addDays(now, 7);

    const [total, todo, inProgress, completed, overdue, upcomingRes, recentRes] = await Promise.all([
      countTasks(),
      countTasks((q) => q.eq('status', 'todo')),
      countTasks((q) => q.eq('status', 'in_progress')),
      countTasks((q) => q.eq('status', 'completed')),
      countTasks((q) => q.neq('status', 'completed').lt('due_date', now.toISOString())),
      supabase
        .from('tasks')
        .select('*')
        .neq('status', 'completed')
        .gte('due_date', now.toISOString())
        .lte('due_date', soon.toISOString())
        .order('due_date', { ascending: true })
        .limit(5),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    if (upcomingRes.error) throw upcomingRes.error;
    if (recentRes.error) throw recentRes.error;

    return {
      stats: { total, todo, in_progress: inProgress, completed, overdue },
      upcoming: (upcomingRes.data ?? []) as Task[],
      recent: (recentRes.data ?? []) as Task[],
    };
  } catch (e) {
    throw toAppError(e);
  }
}
