-- =====================================================================
-- ทดสอบ RLS ด้วยผู้ใช้ 2 บัญชี (A และ B)
-- รันหลัง migration ใน SQL Editor ได้เลย ทุกอย่างอยู่ใน transaction และ ROLLBACK ตอนท้าย
-- ผลลัพธ์ดูที่แท็บ Messages/Notices: ต้องเห็น PASS ทุกบรรทัด และไม่มี FAIL
-- =====================================================================
begin;

-- เตรียมผู้ใช้ทดสอบ (ในฐานะ owner) -> trigger จะสร้าง profile ให้อัตโนมัติ
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@rls-test.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@rls-test.local');

do $$ begin
  if (select count(*) from public.profiles where id in
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')) <> 2
  then raise exception 'FAIL: trigger ไม่ได้สร้าง profile'; end if;
  raise notice 'PASS: สมัครสมาชิกแล้วมี profile อัตโนมัติ';
end $$;

-- ---------- ผู้ใช้ A สร้างข้อมูล ----------
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}', true);
set local role authenticated;

insert into public.categories (id, user_id, name, color)
values ('a1a1a1a1-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'งานของ A', '#2563eb');
insert into public.tasks (id, user_id, category_id, title)
values ('a2a2a2a2-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'a1a1a1a1-0000-0000-0000-000000000001', 'task ของ A');

do $$ begin
  if (select count(*) from public.tasks) <> 1 then raise exception 'FAIL: A ควรเห็น task ของตัวเอง 1 รายการ'; end if;
  raise notice 'PASS: A อ่าน task ของตัวเองได้';
end $$;

-- ---------- ผู้ใช้ B พยายามเข้าถึงข้อมูลของ A ----------
reset role;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}', true);
set local role authenticated;

do $$
declare n int;
begin
  if (select count(*) from public.tasks) <> 0 then raise exception 'FAIL: B อ่าน task ของ A ได้'; end if;
  if (select count(*) from public.categories) <> 0 then raise exception 'FAIL: B อ่าน category ของ A ได้'; end if;
  if (select count(*) from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') <> 0 then
    raise exception 'FAIL: B อ่าน profile ของ A ได้'; end if;
  raise notice 'PASS: B อ่านข้อมูลของ A ไม่ได้ (tasks, categories, profiles)';

  update public.tasks set title = 'ถูกแก้โดย B' where id = 'a2a2a2a2-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B แก้ task ของ A ได้'; end if;
  raise notice 'PASS: B แก้ task ของ A ไม่ได้';

  delete from public.tasks where id = 'a2a2a2a2-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B ลบ task ของ A ได้'; end if;
  raise notice 'PASS: B ลบ task ของ A ไม่ได้';

  update public.categories set name = 'ถูกแก้โดย B' where id = 'a1a1a1a1-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B แก้ category ของ A ได้'; end if;
  raise notice 'PASS: B แก้ category ของ A ไม่ได้';
end $$;

do $$ begin
  begin
    insert into public.tasks (user_id, title) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ปลอม user_id');
    raise exception 'FAIL: B สร้าง task ในชื่อ A ได้';
  exception when insufficient_privilege then
    raise notice 'PASS: B สร้าง task โดยใช้ user_id ของ A ไม่ได้';
  end;
end $$;

do $$ begin
  begin
    insert into public.tasks (user_id, title, category_id)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ใช้ category ของ A', 'a1a1a1a1-0000-0000-0000-000000000001');
    raise exception 'FAIL: B ใช้ category ของ A กับ task ของตนได้';
  exception when insufficient_privilege or foreign_key_violation then
    raise notice 'PASS: B ใช้ category_id ของ A ไม่ได้';
  end;
end $$;

-- B มี task ของตัวเอง แล้วลองโอนความเป็นเจ้าของ / ย้ายไปใช้ category ของ A
insert into public.tasks (id, user_id, title)
values ('b2b2b2b2-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'task ของ B');

do $$ begin
  begin
    update public.tasks set user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    where id = 'b2b2b2b2-0000-0000-0000-000000000001';
    raise exception 'FAIL: B โอน task ให้ A ได้';
  exception when insufficient_privilege then
    raise notice 'PASS: เปลี่ยน user_id เพื่อโอนความเป็นเจ้าของไม่ได้';
  end;
  begin
    update public.tasks set category_id = 'a1a1a1a1-0000-0000-0000-000000000001'
    where id = 'b2b2b2b2-0000-0000-0000-000000000001';
    raise exception 'FAIL: B แก้ task ให้ใช้ category ของ A ได้';
  exception when insufficient_privilege or foreign_key_violation then
    raise notice 'PASS: แก้ task ให้ชี้ category ของคนอื่นไม่ได้';
  end;
end $$;

-- completed_at สอดคล้องกับ status
update public.tasks set status = 'completed' where id = 'b2b2b2b2-0000-0000-0000-000000000001';
do $$ begin
  if (select completed_at from public.tasks where id = 'b2b2b2b2-0000-0000-0000-000000000001') is null
  then raise exception 'FAIL: status=completed แต่ completed_at ว่าง'; end if;
  raise notice 'PASS: ตั้ง completed -> completed_at ถูกกำหนดอัตโนมัติ';
end $$;
update public.tasks set status = 'todo' where id = 'b2b2b2b2-0000-0000-0000-000000000001';
do $$ begin
  if (select completed_at from public.tasks where id = 'b2b2b2b2-0000-0000-0000-000000000001') is not null
  then raise exception 'FAIL: ย้อนกลับเป็น todo แล้ว completed_at ไม่ถูกล้าง'; end if;
  raise notice 'PASS: ย้อนกลับเป็น todo -> completed_at ถูกล้าง';
end $$;

-- ---------- ลบหมวดหมู่ของ A: task ต้องไม่หาย ----------
reset role;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}', true);
set local role authenticated;

delete from public.categories where id = 'a1a1a1a1-0000-0000-0000-000000000001';
do $$ begin
  if (select count(*) from public.tasks where id = 'a2a2a2a2-0000-0000-0000-000000000001'
        and category_id is null) <> 1
  then raise exception 'FAIL: ลบหมวดหมู่แล้ว task หายหรือยังชี้หมวดหมู่เดิม'; end if;
  raise notice 'PASS: ลบหมวดหมู่แล้ว task ยังอยู่และ category_id เป็น NULL';
end $$;

-- anon ต้องเข้าถึงตารางไม่ได้
reset role;
set local role anon;
do $$ begin
  begin
    perform 1 from public.tasks limit 1;
    raise exception 'FAIL: anon อ่าน tasks ได้';
  exception when insufficient_privilege then
    raise notice 'PASS: anon เข้าถึง tasks ไม่ได้';
  end;
end $$;

reset role;
rollback;
