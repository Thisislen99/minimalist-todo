import { useEffect, useState, type FormEvent } from 'react';
import { LogOut, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/fields';
import { ErrorState, PageHeader, Skeleton } from '@/components/ui/feedback';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext';
import { useProfile } from '@/hooks/useProfile';
import { toAppError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { fieldErrors, profileSchema } from '@/schemas/authSchema';
import { saveProfile } from '@/services/profileService';

const THEMES: Array<{ value: ThemeMode; label: string; icon: LucideIcon }> = [
  { value: 'light', label: 'สว่าง', icon: Sun },
  { value: 'dark', label: 'มืด', icon: Moon },
  { value: 'system', label: 'ตามระบบ', icon: Monitor },
];

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { profile, setProfile, loading, error, refetch } = useProfile();
  const [values, setValues] = useState({ display_name: '', avatar_url: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setValues({ display_name: profile.display_name ?? '', avatar_url: profile.avatar_url ?? '' });
  }, [profile]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSaving(true);
    try {
      setProfile(await saveProfile(parsed.data));
      toast.success('บันทึกโปรไฟล์แล้ว');
    } catch (err) {
      toast.error(toAppError(err).userMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="ตั้งค่า" description="จัดการโปรไฟล์และรูปแบบการแสดงผล" />

      <section className="card p-5" aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="mb-4 text-base font-semibold">
          โปรไฟล์
        </h2>
        {error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : loading && !profile ? (
          <Skeleton className="h-40" />
        ) : (
          <form onSubmit={onSubmit} noValidate className="max-w-md space-y-4">
            <TextField label="อีเมล" value={user?.email ?? ''} readOnly disabled hint="เปลี่ยนอีเมลไม่ได้จากหน้านี้" />
            <TextField
              label="ชื่อที่แสดง"
              value={values.display_name}
              onChange={(e) => setValues((v) => ({ ...v, display_name: e.target.value }))}
              error={errors.display_name}
              maxLength={80}
            />
            <TextField
              label="ลิงก์รูปโปรไฟล์ (ไม่บังคับ)"
              type="url"
              placeholder="https://"
              value={values.avatar_url}
              onChange={(e) => setValues((v) => ({ ...v, avatar_url: e.target.value }))}
              error={errors.avatar_url}
            />
            <Button type="submit" loading={saving}>
              บันทึกโปรไฟล์
            </Button>
          </form>
        )}
      </section>

      <section className="card mt-6 p-5" aria-labelledby="theme-heading">
        <h2 id="theme-heading" className="mb-4 text-base font-semibold">
          ธีม
        </h2>
        <div role="radiogroup" aria-labelledby="theme-heading" className="grid max-w-md grid-cols-3 gap-2">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border px-3 py-3 text-sm transition-colors',
                theme === value
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                  : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="card mt-6 p-5" aria-labelledby="account-heading">
        <h2 id="account-heading" className="mb-4 text-base font-semibold">
          บัญชี
        </h2>
        <Button variant="secondary" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          ออกจากระบบ
        </Button>
      </section>
    </>
  );
}
