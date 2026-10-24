import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/fields';
import { FullPageSpinner } from '@/components/ui/feedback';
import { useAuth } from '@/contexts/AuthContext';
import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import {
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/schemas/authSchema';

type Errors = Record<string, string>;

const linkClass = 'font-medium text-blue-600 hover:underline dark:text-blue-400';

export function LoginPage() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<{ message: string; code?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSubmitting(true);
    // เมื่อสำเร็จ AuthContext จะอัปเดต session และ PublicOnlyRoute จะ redirect ให้เอง
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      const err = toAppError({ ...error, code: (error as { code?: string }).code });
      setFormError({ message: err.userMessage, code: err.code });
      setSubmitting(false);
    }
  }

  async function resend() {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: values.email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) toast.error(toAppError(error).userMessage);
    else toast.success('ส่งอีเมลยืนยันอีกครั้งแล้ว');
  }

  return (
    <AuthShell title="เข้าสู่ระบบ" description="จัดการงานของคุณให้เป็นระเบียบ">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {formError.message}
            {formError.code === 'email_not_confirmed' && (
              <button type="button" onClick={() => void resend()} className="ml-1 font-medium underline">
                ส่งอีเมลยืนยันอีกครั้ง
              </button>
            )}
          </div>
        )}
        <TextField
          label="อีเมล"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          error={errors.email}
        />
        <TextField
          label="รหัสผ่าน"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          error={errors.password}
        />
        <div className="text-right text-sm">
          <Link to="/forgot-password" className={linkClass}>
            ลืมรหัสผ่าน?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={submitting}>
          เข้าสู่ระบบ
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        ยังไม่มีบัญชี?{' '}
        <Link to="/register" className={linkClass}>
          สมัครสมาชิก
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [values, setValues] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setSubmitting(false);
    if (error) {
      setFormError(toAppError({ ...error, code: (error as { code?: string }).code }).userMessage);
      return;
    }
    // ถ้าปิดการยืนยันอีเมลใน Supabase จะได้ session ทันที -> PublicOnlyRoute พาเข้าแอปให้เอง
    // ถ้าเปิดอยู่ แสดงข้อความกลางๆ (ไม่เปิดเผยว่าอีเมลนี้เคยสมัครแล้วหรือไม่)
    if (!data.session) setSentTo(parsed.data.email);
  }

  if (sentTo) {
    return (
      <AuthShell title="ตรวจสอบอีเมลของคุณ">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          หากอีเมล <strong>{sentTo}</strong> ยังไม่เคยสมัคร เราได้ส่งลิงก์ยืนยันไปให้แล้ว
          กรุณากดลิงก์ในอีเมลเพื่อเปิดใช้งานบัญชี แล้วกลับมาเข้าสู่ระบบ
        </p>
        <Link to="/login" className={`${linkClass} mt-6 inline-block text-sm`}>
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="สมัครสมาชิก" description="สร้างบัญชีเพื่อเริ่มจัดการงาน">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </div>
        )}
        <TextField
          label="ชื่อที่แสดง"
          autoComplete="name"
          value={values.displayName}
          onChange={(e) => setValues((v) => ({ ...v, displayName: e.target.value }))}
          error={errors.displayName}
        />
        <TextField
          label="อีเมล"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          error={errors.email}
        />
        <TextField
          label="รหัสผ่าน"
          type="password"
          autoComplete="new-password"
          hint="อย่างน้อย 8 ตัวอักษร"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          error={errors.password}
        />
        <TextField
          label="ยืนยันรหัสผ่าน"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
          error={errors.confirmPassword}
        />
        <Button type="submit" className="w-full" loading={submitting}>
          สมัครสมาชิก
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        มีบัญชีอยู่แล้ว?{' '}
        <Link to="/login" className={linkClass}>
          เข้าสู่ระบบ
        </Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) return setError(fieldErrors(parsed.error).email);
    setError(undefined);
    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (err) {
      const appErr = toAppError({ ...err, code: (err as { code?: string }).code });
      // แจ้งเฉพาะความผิดพลาดที่ไม่เกี่ยวกับการมีอยู่ของอีเมล (เช่น rate limit/เครือข่าย)
      if (appErr.code === 'RATE_LIMIT' || appErr.code === 'NETWORK') return setFormError(appErr.userMessage);
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="ตรวจสอบอีเมลของคุณ">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          หากมีบัญชีที่ใช้อีเมล <strong>{email}</strong> เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว
        </p>
        <Link to="/login" className={`${linkClass} mt-6 inline-block text-sm`}>
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="ลืมรหัสผ่าน" description="กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </div>
        )}
        <TextField label="อีเมล" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
        <Button type="submit" className="w-full" loading={submitting}>
          ส่งลิงก์รีเซ็ตรหัสผ่าน
        </Button>
      </form>
      <Link to="/login" className={`${linkClass} mt-6 inline-block text-sm`}>
        กลับไปหน้าเข้าสู่ระบบ
      </Link>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <FullPageSpinner label="กำลังตรวจสอบลิงก์…" />;

  // ลิงก์จากอีเมลจะสร้าง recovery session ให้ ถ้าไม่มี session แปลว่าลิงก์ไม่ถูกต้องหรือหมดอายุ
  if (!session) {
    return (
      <AuthShell title="ลิงก์ไม่ถูกต้องหรือหมดอายุ">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">กรุณาขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง</p>
        <Link to="/forgot-password" className={`${linkClass} mt-6 inline-block text-sm`}>
          ขอลิงก์ใหม่
        </Link>
      </AuthShell>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    const parsed = resetPasswordSchema.safeParse(values);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSubmitting(false);
    if (error) {
      setFormError(toAppError({ ...error, code: (error as { code?: string }).code }).userMessage);
      return;
    }
    toast.success('ตั้งรหัสผ่านใหม่แล้ว');
    navigate('/', { replace: true });
  }

  return (
    <AuthShell title="ตั้งรหัสผ่านใหม่">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </div>
        )}
        <TextField
          label="รหัสผ่านใหม่"
          type="password"
          autoComplete="new-password"
          hint="อย่างน้อย 8 ตัวอักษร"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          error={errors.password}
        />
        <TextField
          label="ยืนยันรหัสผ่านใหม่"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
          error={errors.confirmPassword}
        />
        <Button type="submit" className="w-full" loading={submitting}>
          บันทึกรหัสผ่านใหม่
        </Button>
      </form>
    </AuthShell>
  );
}
