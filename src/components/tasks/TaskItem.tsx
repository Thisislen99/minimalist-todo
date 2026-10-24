import { Calendar, Check, Pencil, Trash2 } from 'lucide-react';
import { CategoryChip, PriorityBadge } from '@/components/ui/Badges';
import { formatDue, isOverdue } from '@/lib/dates';
import { STATUS_LABEL } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { TASK_STATUSES, type Category, type Task, type TaskStatus } from '@/types/database';

interface Props {
  task: Task;
  category?: Category;
  pending: boolean;
  onToggle: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskItem({ task, category, pending, onToggle, onStatusChange, onEdit, onDelete }: Props) {
  const done = task.status === 'completed';
  const overdue = isOverdue(task);

  return (
    <li className={cn('flex items-start gap-3 px-4 py-3.5', pending && 'opacity-60')}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `ทำเครื่องหมายว่ายังไม่เสร็จ: ${task.title}` : `ทำเครื่องหมายว่าเสร็จแล้ว: ${task.title}`}
        disabled={pending}
        onClick={() => onToggle(task)}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
          done
            ? 'border-blue-600 bg-blue-600 text-white'
            : 'border-zinc-300 hover:border-blue-600 dark:border-zinc-600',
        )}
      >
        {done && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('break-words text-sm font-medium', done && 'text-zinc-400 line-through dark:text-zinc-500')}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 line-clamp-2 break-words text-sm text-zinc-500 dark:text-zinc-400">{task.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <PriorityBadge priority={task.priority} />
          {category && <CategoryChip category={category} />}
          {task.due_date && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs',
                overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400',
              )}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {overdue && 'เลยกำหนด · '}
              {formatDue(task.due_date)}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <select
          aria-label={`สถานะของ ${task.title}`}
          value={task.status}
          disabled={pending}
          onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
          className="field hidden w-auto py-1.5 text-xs sm:block"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => onEdit(task)} aria-label={`แก้ไข ${task.title}`} className="btn btn-ghost p-2">
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label={`ลบ ${task.title}`}
          className="btn btn-ghost p-2 hover:text-red-600 dark:hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
