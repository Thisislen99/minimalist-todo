import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import type { TaskFormValues } from '@/schemas/taskSchema';
import type { Task } from '@/types/database';

interface TaskActionsValue {
  /** เพิ่มค่าเมื่อข้อมูลงานเปลี่ยน เพื่อให้หน้าต่างๆ โหลดใหม่ */
  version: number;
  bump: () => void;
  openCreate: (defaults?: Partial<TaskFormValues>) => void;
  openEdit: (task: Task) => void;
}

const Ctx = createContext<TaskActionsValue | null>(null);

interface DialogState {
  open: boolean;
  task: Task | null;
  defaults?: Partial<TaskFormValues>;
}

export function TaskActionsProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [dialog, setDialog] = useState<DialogState>({ open: false, task: null });
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo<TaskActionsValue>(
    () => ({
      version,
      bump,
      openCreate: (defaults) => setDialog({ open: true, task: null, defaults }),
      openEdit: (task) => setDialog({ open: true, task }),
    }),
    [version, bump],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <TaskDialog
        open={dialog.open}
        task={dialog.task}
        defaults={dialog.defaults}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSaved={bump}
      />
    </Ctx.Provider>
  );
}

export function useTaskActions(): TaskActionsValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTaskActions must be used within TaskActionsProvider');
  return ctx;
}
