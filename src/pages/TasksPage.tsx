import { useCallback } from 'react';
import { ChevronLeft, ChevronRight, ListTodo, Plus, SearchX } from 'lucide-react';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskListSection } from '@/components/tasks/TaskListSection';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/feedback';
import { useTaskActions } from '@/contexts/TaskActionsContext';
import { useCategories } from '@/hooks/useCategories';
import { useTasks } from '@/hooks/useTasks';
import { todayInput } from '@/lib/dates';
import { VIEW_DESCRIPTION, VIEW_TITLE } from '@/lib/labels';
import type { TaskQuery, TaskView } from '@/types/database';

const VIEW_DEFAULTS: Record<TaskView, Partial<TaskQuery>> = {
  all: { sortKey: 'created_at', sortDir: 'desc' },
  today: { sortKey: 'due_date', sortDir: 'asc' },
  upcoming: { sortKey: 'due_date', sortDir: 'asc' },
  completed: { sortKey: 'created_at', sortDir: 'desc' },
};

export function TasksPage({ view }: { view: TaskView }) {
  const { openCreate } = useTaskActions();
  const { categories, byId } = useCategories();
  const { query, setQuery, tasks, total, loading, error, refetch } = useTasks({ view, ...VIEW_DEFAULTS[view] });

  const hasActiveFilters =
    query.search !== '' || query.status !== '' || query.priority !== '' || query.categoryId !== '' || query.overdueOnly;

  const clearFilters = useCallback(
    () => setQuery({ search: '', status: '', priority: '', categoryId: '', overdueOnly: false }),
    [setQuery],
  );

  const create = () =>
    openCreate(
      view === 'today'
        ? { due_date: todayInput() }
        : view === 'completed'
          ? { status: 'completed' }
          : undefined,
    );

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <>
      <PageHeader
        title={VIEW_TITLE[view]}
        description={VIEW_DESCRIPTION[view]}
        action={
          <Button onClick={create}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            เพิ่มงาน
          </Button>
        }
      />

      <TaskFilters
        query={query}
        categories={categories}
        onChange={setQuery}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : loading && tasks.length === 0 ? (
        <div className="space-y-3" aria-busy="true" aria-label="กำลังโหลดงาน">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<SearchX className="h-10 w-10" aria-hidden="true" />}
            title="ไม่พบงานที่ตรงกับเงื่อนไข"
            description="ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง"
            action={
              <Button variant="secondary" onClick={clearFilters}>
                ล้างตัวกรอง
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<ListTodo className="h-10 w-10" aria-hidden="true" />}
            title="ยังไม่มีงานในหน้านี้"
            description="เพิ่มงานใหม่เพื่อเริ่มต้น"
            action={<Button onClick={create}>เพิ่มงาน</Button>}
          />
        )
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : undefined}>
          <TaskListSection tasks={tasks} categories={byId} />
          <div className="mt-4 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
            <span aria-live="polite">
              {total.toLocaleString('th-TH')} งาน · หน้า {query.page} จาก {totalPages}
            </span>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  aria-label="หน้าก่อนหน้า"
                  disabled={query.page <= 1 || loading}
                  onClick={() => setQuery({ page: query.page - 1 })}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="secondary"
                  aria-label="หน้าถัดไป"
                  disabled={query.page >= totalPages || loading}
                  onClick={() => setQuery({ page: query.page + 1 })}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
