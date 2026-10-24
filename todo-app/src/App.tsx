import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/layout/RouteGuards';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from '@/pages/AuthPages';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TasksPage } from '@/pages/TasksPage';
import { isSupabaseConfigured } from '@/lib/supabase';

function MissingConfig() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md p-6">
        <h1 className="text-lg font-semibold">ยังไม่ได้ตั้งค่า Supabase</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          สร้างไฟล์ <code>.env.local</code> แล้วกำหนดค่า <code>VITE_SUPABASE_URL</code> และ{' '}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> จากนั้นรีสตาร์ต dev server
          (บน Netlify ให้ตั้งค่าที่ Site configuration → Environment variables แล้ว Deploy ใหม่)
        </p>
      </div>
    </main>
  );
}

export default function App() {
  if (!isSupabaseConfigured) return <MissingConfig />;

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* ต้องเข้าได้ทั้งตอนมี recovery session จากลิงก์อีเมล */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage key="all" view="all" />} />
          <Route path="today" element={<TasksPage key="today" view="today" />} />
          <Route path="upcoming" element={<TasksPage key="upcoming" view="upcoming" />} />
          <Route path="completed" element={<TasksPage key="completed" view="completed" />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
