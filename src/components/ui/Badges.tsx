import { PRIORITY_LABEL, STATUS_LABEL } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { Category, TaskPriority, TaskStatus } from '@/types/database';

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  high: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  in_progress: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

const base = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium';

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={cn(base, PRIORITY_STYLE[priority])}>ความสำคัญ{PRIORITY_LABEL[priority]}</span>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={cn(base, STATUS_STYLE[status])}>{STATUS_LABEL[status]}</span>;
}

export function CategoryChip({ category }: { category: Pick<Category, 'name' | 'color'> }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
      {category.name}
    </span>
  );
}
