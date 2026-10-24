-- =====================================================================
-- Minimalist To-Do: schema, triggers, indexes และ Row Level Security
-- รันทั้งไฟล์ใน Supabase Dashboard > SQL Editor ได้ในครั้งเดียว
-- ต้องใช้ PostgreSQL 15+ (โปรเจกต์ Supabase ใหม่ใช้ 15 ขึ้นไปอยู่แล้ว)
-- =====================================================================

-- ---------- Tables ----------

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  avatar_url   text check (avatar_url is null or avatar_url ~* '^https://'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  color      text not null default '#2563eb' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ใช้เป็นเป้าหมายของ composite FK ให้ task ผูกได้เฉพาะหมวดหมู่ของเจ้าของเดียวกัน
  constraint categories_id_user_unique unique (id, user_id)
);

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id   uuid null,
  title         text not null check (char_length(btrim(title)) between 1 and 200),
  description   text null check (description is null or char_length(description) <= 2000),
  status        text not null default 'todo'   check (status in ('todo', 'in_progress', 'completed')),
  priority      text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  -- ใช้เรียงตามความสำคัญ (high > medium > low) ให้ถูกต้อง
  priority_rank smallint generated always as (
    case priority when 'high' then 3 when 'medium' then 2 else 1 end
  ) stored,
  due_date      timestamptz null,
  completed_at  timestamptz null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- (category_id, user_id) ต้องตรงกับหมวดหมู่ของผู้ใช้คนเดียวกัน
  -- ลบหมวดหมู่ -> task ยังอยู่ และถูกตั้ง category_id เป็น NULL (ไม่ลบ task)
  constraint tasks_category_owner_fk
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete set null (category_id),
  -- completed_at ต้องสอดคล้องกับ status
  constraint tasks_completed_at_consistent
    check ((status = 'completed') = (completed_at is not null))
);

-- ---------- Indexes ----------
create index categories_user_id_idx        on public.categories (user_id);
create unique index categories_user_name_uq on public.categories (user_id, lower(btrim(name)));
create index tasks_user_status_idx   on public.tasks (user_id, status);
create index tasks_user_priority_idx on public.tasks (user_id, priority);
create index tasks_user_due_idx      on public.tasks (user_id, due_date);
create index tasks_user_created_idx  on public.tasks (user_id, created_at desc);
create index tasks_category_idx      on public.tasks (category_id);

-- ---------- Trigger functions ----------

create or replace function public.tasks_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id then
      raise exception 'user_id cannot be changed' using errcode = '42501';
    end if;
    new.created_at := old.created_at;
  end if;

  -- ทำให้ completed_at สอดคล้องกับ status เสมอ
  if new.status = 'completed' then
    if tg_op = 'UPDATE' and old.status = 'completed' and old.completed_at is not null then
      new.completed_at := old.completed_at;
    else
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.categories_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id cannot be changed' using errcode = '42501';
  end if;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.profiles_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function public.tasks_before_write();

create trigger categories_before_update
  before update on public.categories
  for each row execute function public.categories_before_update();

create trigger profiles_before_update
  before update on public.profiles
  for each row execute function public.profiles_before_update();

-- สร้าง profile อัตโนมัติหลังสมัครสมาชิก
-- security definer + search_path ว่าง เพื่อความปลอดภัย และไม่เปิดให้เรียกจาก client
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)),
      80
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- สร้าง profile ให้ผู้ใช้ที่มีอยู่ก่อนรัน migration (ถ้ามี)
insert into public.profiles (id, display_name)
select id, left(split_part(email, '@', 1), 80) from auth.users
on conflict (id) do nothing;

-- ---------- Privileges ----------
revoke all on public.profiles, public.categories, public.tasks from anon;
grant select, insert, update on public.profiles   to authenticated;
grant select, insert, update, delete on public.categories, public.tasks to authenticated;

-- ---------- Row Level Security ----------
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.tasks      enable row level security;

-- profiles: เข้าถึงได้เฉพาะของตนเอง (ไม่มี DELETE policy: ลบผ่านการลบ user เท่านั้น)
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- categories
create policy categories_select_own on public.categories
  for select to authenticated using (user_id = (select auth.uid()));
create policy categories_insert_own on public.categories
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy categories_update_own on public.categories
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy categories_delete_own on public.categories
  for delete to authenticated using (user_id = (select auth.uid()));

-- tasks: ตรวจ user_id และตรวจว่า category_id เป็นของผู้ใช้คนเดียวกัน
create policy tasks_select_own on public.tasks
  for select to authenticated using (user_id = (select auth.uid()));

create policy tasks_insert_own on public.tasks
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = (select auth.uid())
      )
    )
  );

create policy tasks_update_own on public.tasks
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = (select auth.uid())
      )
    )
  );

create policy tasks_delete_own on public.tasks
  for delete to authenticated using (user_id = (select auth.uid()));
