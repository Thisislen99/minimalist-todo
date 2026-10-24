import { useCallback, useEffect, useRef, useState } from 'react';
import { useTaskActions } from '@/contexts/TaskActionsContext';
import { toAppError } from '@/lib/errors';
import { listTasks, TASK_PAGE_SIZE } from '@/services/taskService';
import type { Task, TaskQuery } from '@/types/database';

const BASE_QUERY: TaskQuery = {
  view: 'all',
  search: '',
  status: '',
  priority: '',
  categoryId: '',
  overdueOnly: false,
  sortKey: 'created_at',
  sortDir: 'desc',
  page: 1,
  pageSize: TASK_PAGE_SIZE,
};

export function useTasks(initial: Partial<TaskQuery>) {
  const { version } = useTaskActions();
  const [query, setQueryState] = useState<TaskQuery>({ ...BASE_QUERY, ...initial });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await listTasks(query);
      if (id !== requestId.current) return; // มีคำขอใหม่กว่าแล้ว
      if (result.tasks.length === 0 && query.page > 1 && result.total > 0) {
        // หน้าปัจจุบันว่างหลังลบ/กรอง -> ย้อนไปหน้าสุดท้ายที่มีข้อมูล
        setQueryState((q) => ({ ...q, page: Math.ceil(result.total / q.pageSize) }));
        return;
      }
      setTasks(result.tasks);
      setTotal(result.total);
      setLoading(false);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(toAppError(e).userMessage);
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load, version]);

  /** เปลี่ยนตัวกรอง/การเรียง -> กลับไปหน้า 1 เสมอ (ยกเว้นเปลี่ยน page เอง) */
  const setQuery = useCallback((patch: Partial<TaskQuery>) => {
    setQueryState((q) => ({ ...q, page: 1, ...patch }));
  }, []);

  return { query, setQuery, tasks, total, loading, error, refetch: load };
}
