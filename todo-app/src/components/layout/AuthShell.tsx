import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

export function AuthShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </span>
          To-Do
        </div>
        <div className="card p-6">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
