import { cn } from '@/lib/utils';

export function StatCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'danger' }) {
  return (
    <div className="card px-4 py-3.5">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold tabular-nums', tone === 'danger' && value > 0 && 'text-red-600 dark:text-red-400')}>
        {value.toLocaleString('th-TH')}
      </p>
    </div>
  );
}
