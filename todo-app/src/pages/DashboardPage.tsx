import { ListChecks, Plus } from 'lucide-react';
import { TaskListSection } from '@/components/tasks/TaskListSection';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/feedback';
import { useTaskActions } from '@/contexts/TaskActionsContext';
import { useCategories } from '@/hooks/useCategories';
import { useDashboard } from '@/hooks/useDashboard';
import { useProfile } from '@/hooks/useProfile';
import { completionRate } from '@/lib/dates';

export function DashboardPage() {
  const { openCreate } = useTaskActions();
  const { data, loading, error, refetch } = useDashboard();
  const { byId } = useCategories();
  const { profile } = useProfile();

  const name = profile?.display_name;
  const addButton = (
    <Button onClick={() => openCreate()}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      เพิ่มงาน
    </Button>
  );

  if (error) {
    return (
      <>
        <PageHeader title="ภาพรวม" />
        <ErrorState message={error} onRetry={() => void refetch()} />
      </>
    );
  }

  if (loading && !data) {
    return (
      <>
        <PageHeader title="ภาพรวม" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="mt-6 h-40" />
      </>
    );
  }

  if (!data) return null;
  const { stats, upcoming, recent } = data;
  const rate = completionRate(stats.completed, stats.total);

  return (
    <>
      <PageHeader
        title={name ? `สวัสดี ${name}` : 'ภาพรวม'}
        description="สรุปงานของคุณ ณ ตอนนี้"
        action={addButton}
      />

      {stats.total === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-10 w-10" aria-hidden="true" />}
          title="ยังไม่มีงาน"
          description="เริ่มจากเพิ่มงานแรกของคุณ แล้วตัวเลขสรุปจะแสดงที่นี่"
          action={addButton}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="งานทั้งหมด" value={stats.total} />
            <StatCard label="ยังไม่เริ่ม" value={stats.todo} />
            <StatCard label="กำลังทำ" value={stats.in_progress} />
            <StatCard label="เสร็จแล้ว" value={stats.completed} />
            <StatCard label="เลยกำหนด" value={stats.overdue} tone="danger" />
          </div>

          <div className="card mt-3 px-4 py-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">ความสำเร็จ</p>
              <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                {stats.completed}/{stats.total} · {rate}%
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="เปอร์เซ็นต์งานที่เสร็จแล้ว"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={rate}
              className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            >
              <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${rate}%` }} />
            </div>
          </div>

          <section className="mt-8" aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading" className="mb-3 text-base font-semibold">
              ใกล้ถึงกำหนด (7 วันข้างหน้า)
            </h2>
            {upcoming.length === 0 ? (
              <p className="card px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                ไม่มีงานที่ใกล้ถึงกำหนดใน 7 วันข้างหน้า
              </p>
            ) : (
              <TaskListSection tasks={upcoming} categories={byId} />
            )}
          </section>

          <section className="mt-8" aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="mb-3 text-base font-semibold">
              งานล่าสุด
            </h2>
            <TaskListSection tasks={recent} categories={byId} />
          </section>
        </>
      )}
    </>
  );
}
