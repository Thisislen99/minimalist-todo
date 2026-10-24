import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-semibold tabular-nums text-zinc-300 dark:text-zinc-700">404</p>
      <h1 className="mt-4 text-xl font-semibold">ไม่พบหน้าที่ต้องการ</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">ลิงก์อาจไม่ถูกต้อง หรือหน้านี้ถูกย้ายไปแล้ว</p>
      <Link to="/" className="btn btn-primary mt-6">
        กลับหน้าแรก
      </Link>
    </main>
  );
}
