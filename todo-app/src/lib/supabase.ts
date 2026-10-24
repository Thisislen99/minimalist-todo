import { createClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);

// ใช้เฉพาะ publishable/anon key ฝั่ง client เท่านั้น (ห้ามใส่ service role key)
export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'not-configured', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new AppError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง', 'SESSION');
  }
  return data.session.user.id;
}
