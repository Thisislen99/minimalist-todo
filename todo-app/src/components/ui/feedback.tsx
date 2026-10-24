import type { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800', className)} />;
}

export function FullPageSpinner({ label = 'กำลังโหลด…' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center text-zinc-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      {icon && <div className="mb-3 text-zinc-400 dark:text-zinc-500">{icon}</div>}
      <h3 className="text-base font-medium">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card flex flex-col items-center px-6 py-10 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-red-500" aria-hidden="true" />
      <h3 className="text-base font-medium">โหลดข้อมูลไม่สำเร็จ</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          ลองอีกครั้ง
        </Button>
      )}
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
