import { toAppError } from '@/lib/errors';
import { requireUserId, supabase } from '@/lib/supabase';
import type { Category, CategoryInput } from '@/types/database';

export async function listCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Category[];
  } catch (e) {
    throw toAppError(e);
  }
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Category;
  } catch (e) {
    throw toAppError(e);
  }
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  try {
    const { data, error } = await supabase.from('categories').update(input).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw toAppError({ code: 'PGRST116' });
    return data as Category;
  } catch (e) {
    throw toAppError(e);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    throw toAppError(e);
  }
}

/** จำนวนงานที่ผูกกับหมวดหมู่ (แสดงในหน้ายืนยันก่อนลบ) */
export async function countTasksInCategory(id: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);
    if (error) throw error;
    return count ?? 0;
  } catch (e) {
    throw toAppError(e);
  }
}
