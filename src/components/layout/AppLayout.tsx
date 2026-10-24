import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Plus,
  Settings,
  Tags,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TaskActionsProvider, useTaskActions } from '@/contexts/TaskActionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { todayInput } from '@/lib/dates';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'ภาพรวม', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'งานทั้งหมด', icon: ListTodo },
  { to: '/today', label: 'วันนี้', icon: CalendarDays },
  { to: '/upcoming', label: 'กำลังจะมาถึง', icon: CalendarClock },
  { to: '/completed', label: 'เสร็จแล้ว', icon: CheckCircle2 },
  { to: '/categories', label: 'หมวดหมู่', icon: Tags },
  { to: '/settings', label: 'ตั้งค่า', icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="เมนูหลัก" className="space-y-0.5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 font-semibold">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      </span>
      To-Do
    </div>
  );
}

function Shell() {
  const { user, signOut } = useAuth();
  const { openCreate } = useTaskActions();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // ปิด drawer เมื่อเปลี่ยนหน้า และปิดด้วย Escape
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const createDefaults = () =>
    openCreate(location.pathname === '/today' ? { due_date: todayInput() } : undefined);

  return (
    <div className="min-h-screen lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow dark:focus:bg-zinc-900"
      >
        ข้ามไปยังเนื้อหา
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
        <div className="mb-6 px-2">
          <Brand />
        </div>
        <Button className="mb-5" onClick={createDefaults}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          เพิ่มงาน
        </Button>
        <NavList />
        <div className="mt-auto border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <p className="truncate px-2 text-xs text-zinc-500 dark:text-zinc-400" title={user?.email ?? ''}>
            {user?.email}
          </p>
          <Button variant="ghost" className="mt-2 w-full justify-start" onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 lg:hidden">
          <Brand />
          <button
            type="button"
            className="btn btn-ghost p-2"
            aria-label="เปิดเมนู"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <main id="main" className="mx-auto w-full max-w-4xl px-4 py-6 pb-28 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="เมนู">
          <button
            type="button"
            aria-label="ปิดเมนู"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-white px-4 py-5 shadow-xl dark:bg-zinc-900">
            <div className="mb-5 flex items-center justify-between px-2">
              <Brand />
              <button type="button" className="btn btn-ghost p-1.5" aria-label="ปิดเมนู" onClick={() => setDrawerOpen(false)}>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <NavList onNavigate={() => setDrawerOpen(false)} />
            <div className="mt-auto border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <p className="truncate px-2 text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
              <Button variant="ghost" className="mt-2 w-full justify-start" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile add button */}
      <button
        type="button"
        onClick={createDefaults}
        aria-label="เพิ่มงานใหม่"
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 lg:hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
}

export function AppLayout() {
  return (
    <TaskActionsProvider>
      <Shell />
    </TaskActionsProvider>
  );
}
