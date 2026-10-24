import { toAppError } from '@/lib/errors';
import { requireUserId, supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export async function getProfile(): Promise<Profile | null> {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return (data as Profile | null) ?? null;
  } catch (e) {
    throw toAppError(e);
  }
}

/** upsert เผื่อผู้ใช้ที่สมัครก่อนมี trigger ยังไม่มีแถว profile */
export async function saveProfile(input: { display_name: string; avatar_url: string }): Promise<Profile> {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: input.display_name,
        avatar_url: input.avatar_url === '' ? null : input.avatar_url,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  } catch (e) {
    throw toAppError(e);
  }
}
