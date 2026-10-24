import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageSpinner } from '@/components/ui/feedback';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner label="กำลังตรวจสอบเซสชัน…" />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** หน้าสำหรับผู้ที่ยังไม่ล็อกอิน (login/register/forgot) — ถ้าล็อกอินแล้วพากลับหน้าเดิมหรือหน้าแรก */
export function PublicOnlyRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner label="กำลังตรวจสอบเซสชัน…" />;
  if (session) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? '/'} replace />;
  }
  return <Outlet />;
}
