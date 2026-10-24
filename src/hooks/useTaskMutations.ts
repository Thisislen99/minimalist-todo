import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTaskActions } from '@/contexts/TaskActionsContext';
import { toAppError } from '@/lib/errors';
import { deleteTask, setTaskStatus } from '@/services/taskService';
import type { Task, TaskStatus } from '@/types/database';

/** รวมการเปลี่ยนสถานะ/ลบงาน พร้อมกันกดซ้ำ, toast และ refresh รายการ */
export function useTaskMutations() {
  const { bump } = useTaskActions();
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const inflight = useRef(new Set<string>());

  const run = useCallback(
    async (id: string, action: () => Promise<unknown>, success: string): Promise<boolean> => {
      if (inflight.current.has(id)) return false; // ป้องกันการส่งซ้ำ
      inflight.current.add(id);
      setPending(new Set(inflight.current));
      try {
        await action();
        toast.success(success);
        bump();
        return true;
      } catch (e) {
        const err = toAppError(e);
        toast.error(err.userMessage);
        if (err.code === 'CONFLICT') bump();
        return false;
      } finally {
        inflight.current.delete(id);
        setPending(new Set(inflight.current));
      }
    },
    [bump],
  );

  const changeStatus = useCallback(
    (task: Task, status: TaskStatus) =>
      run(task.id, () => setTaskStatus(task, status), status === 'completed' ? 'ทำเครื่องหมายว่าเสร็จแล้ว' : 'อัปเดตสถานะแล้ว'),
    [run],
  );

  const toggle = useCallback(
    (task: Task) => changeStatus(task, task.status === 'completed' ? 'todo' : 'completed'),
    [changeStatus],
  );

  const remove = useCallback((task: Task) => run(task.id, () => deleteTask(task.id), 'ลบงานแล้ว'), [run]);

  return { pending, changeStatus, toggle, remove };
}
