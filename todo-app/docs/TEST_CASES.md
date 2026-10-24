# รายการทดสอบและผลจริง

สถานะ: ✅ ทดสอบแล้ว · 🟡 ทดสอบบางส่วน · ⬜ ยังไม่ได้ทดสอบ (ต้องทำเองกับ Supabase/Netlify จริง)

ผลด้านล่างมาจากการรันจริงในสภาพแวดล้อมที่ใช้สร้างโปรเจกต์ (Node + PostgreSQL 16 ในเครื่อง) **ไม่ได้ทดสอบกับโปรเจกต์ Supabase หรือ Netlify จริง และไม่ได้เปิดเบราว์เซอร์**

## ผลที่รันแล้ว

| คำสั่ง / การตรวจ | ผล |
| --- | --- |
| `npm run typecheck` (TypeScript strict + noUncheckedIndexedAccess) | ✅ ผ่าน ไม่มี error |
| `npm test` (Vitest) | ✅ 4 ไฟล์, 35 tests ผ่านทั้งหมด |
| `npm run build` | ✅ สำเร็จ; `dist/_redirects` ถูกคัดลอกและมีบรรทัด `/* /index.html 200` |
| สแกนหา service role key / JWT ใน `src`, `dist`, `supabase`, `.env.example` | ✅ ไม่พบ (พบเพียงข้อความ `sb_secret_` ที่เป็นโค้ดตรวจ prefix ภายในไลบรารี supabase-js) |
| `supabase/migrations/20260101000000_init_todo.sql` บน PostgreSQL 16 | ✅ รันผ่านทั้งไฟล์ (จำลอง schema `auth`, role `anon`/`authenticated` และ `auth.uid()` ให้เหมือน Supabase) |
| `supabase/tests/rls_test.sql` (ผู้ใช้ A และ B) | ✅ 14 รายการ PASS ดูรายละเอียดด้านล่าง |

ข้อจำกัดของการทดสอบ RLS ข้างต้น: เป็นการทดสอบที่ชั้น PostgreSQL ด้วย role และ JWT claims ที่จำลอง ไม่ได้ผ่าน PostgREST/Supabase Auth จริง ควรรัน `rls_test.sql` ซ้ำใน SQL Editor ของโปรเจกต์คุณหลัง migration

### RLS ที่ยืนยันแล้ว (14 รายการ)

1. สมัครสมาชิก → trigger สร้าง profile อัตโนมัติ
2. A อ่าน task ของตัวเองได้
3. B อ่าน tasks / categories / profile ของ A ไม่ได้
4. B แก้ task ของ A ไม่ได้
5. B ลบ task ของ A ไม่ได้
6. B แก้ category ของ A ไม่ได้
7. B สร้าง task โดยใช้ `user_id` ของ A ไม่ได้
8. B ใช้ `category_id` ของ A กับ task ของตัวเองไม่ได้ (insert)
9. B เปลี่ยน `user_id` เพื่อโอน task ไม่ได้
10. B แก้ task ของตัวเองให้ชี้ category ของ A ไม่ได้ (update)
11. ตั้งสถานะ completed → `completed_at` ถูกกำหนดอัตโนมัติ
12. ย้อนกลับเป็น todo → `completed_at` ถูกล้าง
13. ลบหมวดหมู่ → task ยังอยู่และ `category_id` เป็น NULL
14. `anon` เข้าถึง `tasks` ไม่ได้

## Acceptance Criteria 15 ข้อ

| # | หัวข้อ | สถานะ | หมายเหตุ |
| --- | --- | --- | --- |
| 1 | สมัครสมาชิกและ Login | ⬜ | ต้องทดสอบกับ Supabase Auth จริง; validation ของฟอร์มมี unit test |
| 2 | Reset Password | ⬜ | ต้องทดสอบกับอีเมลจริง; schema ตรวจรหัสผ่านมี unit test |
| 3 | สร้าง Task แล้วบันทึกลง Supabase | ⬜ | โค้ดเขียนเสร็จ ยังไม่ได้รันกับโปรเจกต์จริง; การแปลงข้อมูลฟอร์มมี unit test |
| 4 | Refresh แล้วข้อมูลยังอยู่ | ⬜ | ข้อมูลอยู่ใน Supabase ไม่ได้อยู่ใน localStorage |
| 5 | แก้ไขและลบ Task | ⬜ | มี optimistic concurrency และ Confirmation Dialog; ยังไม่ได้ทดสอบกับของจริง |
| 6 | เปลี่ยนสถานะและความสำคัญ | 🟡 | `completed_at` สอดคล้องกับสถานะ (ทดสอบที่ DB แล้ว) ส่วน UI ยังไม่ได้ทดสอบ |
| 7 | Search / Filter / Sort | 🟡 | การสร้าง query ทุก filter มี unit test (8 tests); ผลลัพธ์จริงจาก PostgREST ยังไม่ได้ทดสอบ |
| 8 | สร้างและจัดการ Category | 🟡 | ลบแล้วงานไม่หาย / unique name ทดสอบที่ DB แล้ว ส่วน UI ยังไม่ได้ทดสอบ |
| 9 | Dashboard ตรงกับข้อมูลจริง | ⬜ | ใช้ count query จาก Supabase; สูตรเปอร์เซ็นต์มี unit test |
| 10 | ผู้ใช้เข้าถึง Task ของบัญชีอื่นไม่ได้ | ✅ | ที่ชั้น DB (ดูรายการ RLS ด้านบน) |
| 11 | RLS ป้องกันข้ามบัญชี | ✅ | ที่ชั้น DB; ควรรันซ้ำบนโปรเจกต์จริง |
| 12 | ใช้งานบนมือถือและ Desktop | ⬜ | ออกแบบ responsive แล้ว แต่ยังไม่ได้เปิดดูในเบราว์เซอร์จริง |
| 13 | Netlify Refresh route ภายใน | 🟡 | ยืนยันแล้วว่า `dist/_redirects` ถูกต้อง; ยังไม่ได้ Deploy จริง |
| 14 | Production Build ไม่มี TypeScript Errors | ✅ | |
| 15 | ไม่มี API Secret ใน Frontend | ✅ | สแกนแล้ว (ดูด้านบน) |

## ขั้นตอนทดสอบด้วยมือหลัง Deploy (แนะนำ)

1. สมัครบัญชี A และบัญชี B (ใช้ 2 เบราว์เซอร์/โปรไฟล์) กดลิงก์ยืนยันอีเมล แล้วล็อกอิน
2. บัญชี A: สร้างหมวดหมู่ 2 อัน และงาน 5 งานที่มีสถานะ/ความสำคัญ/วันครบกำหนดต่างกัน (รวมงานเลยกำหนด 1 งาน)
3. ตรวจ Dashboard ว่าตัวเลขตรงกับงานที่สร้าง แล้ว Refresh ว่าข้อมูลยังอยู่
4. ทดลองค้นหา กรอง เรียง และกด "ล้างตัวกรอง"
5. ติ๊กงานเสร็จ แล้วย้อนกลับ; ลบงานพร้อม Confirmation
6. ลบหมวดหมู่ที่มีงาน: งานต้องยังอยู่และไม่มีหมวดหมู่
7. บัญชี B: ต้องไม่เห็นงาน/หมวดหมู่ของ A เลย
8. ลองใช้ "ลืมรหัสผ่าน" จนตั้งรหัสผ่านใหม่สำเร็จ
9. เปิดบนมือถือ: เมนู ลิ้นชัก และปุ่มเพิ่มงาน
10. Refresh ที่ `/tasks`, `/categories` และเข้า URL ตรงๆ ต้องไม่ 404; เปิด DevTools ดู Console/Network ว่าไม่มี error
