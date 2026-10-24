import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTaskActions } from '@/contexts/TaskActionsContext';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import type { Category, Task } from '@/types/database';
import { TaskItem } from './TaskItem';

export function TaskListSection({ tasks, categories }: { tasks: Task[]; categories: Map<string, Category> }) {
  const { openEdit } = useTaskActions();
  const mutations = useTaskMutations();
  const [toDelete, setToDelete] = useState<Task | null>(null);

  return (
    <>
      <ul className="card divide-y divide-zinc-100 dark:divide-zinc-800">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            category={task.category_id ? categories.get(task.category_id) : undefined}
            pending={mutations.pending.has(task.id)}
            onToggle={mutations.toggle}
            onStatusChange={mutations.changeStatus}
            onEdit={openEdit}
            onDelete={setToDelete}
          />
        ))}
      </ul>
      <ConfirmDialog
        open={toDelete !== null}
        title="ลบงานนี้?"
        description={toDelete ? `“${toDelete.title}” จะถูกลบถาวรและกู้คืนไม่ได้` : ''}
        confirmLabel="ลบงาน"
        busy={toDelete ? mutations.pending.has(toDelete.id) : false}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await mutations.remove(toDelete); // สำเร็จหรือล้มเหลว toast จะแจ้งผล แล้วปิด dialog
          setToDelete(null);
        }}
      />
    </>
  );
}
