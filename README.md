# Minimalist To-Do

เว็บแอปจัดการงานสไตล์ Minimalist ใช้ **React + TypeScript + Vite**, **Tailwind CSS**, **Supabase** (Auth + Postgres + RLS) และ Deploy บน **Netlify**

ข้อมูลทุกอย่าง (งาน หมวดหมู่ โปรไฟล์) เก็บใน Supabase และป้องกันที่ระดับฐานข้อมูลด้วย Row Level Security ไม่ได้พึ่งแค่การซ่อน UI

## ฟีเจอร์

- สมัครสมาชิก / เข้าสู่ระบบ / ออกจากระบบ / ยืนยันอีเมล / ลืมรหัสผ่าน / ตั้งรหัสผ่านใหม่
- งาน: สร้าง แก้ไข ลบ (มี Confirmation) ติ๊กเสร็จ/ย้อนกลับ เปลี่ยนสถานะ (`todo`, `in_progress`, `completed`) และความสำคัญ (`low`, `medium`, `high`)
- ค้นหา (ชื่อ + รายละเอียด) กรองตามสถานะ/ความสำคัญ/หมวดหมู่/เลยกำหนด เรียงตามวันครบกำหนด/วันที่สร้าง/ความสำคัญ และปุ่มล้างตัวกรอง
- หมวดหมู่: สร้าง แก้ไข ลบ เลือกสี (ลบหมวดหมู่แล้ว **งานไม่หาย** จะกลายเป็นงานไม่มีหมวดหมู่)
- Dashboard: ตัวเลขทั้งหมดคำนวณจากข้อมูลจริงใน Supabase, เปอร์เซ็นต์สำเร็จ, งานใกล้ถึงกำหนด (7 วัน), งานล่าสุด
- หน้า: ภาพรวม, งานทั้งหมด, วันนี้, กำลังจะมาถึง, เสร็จแล้ว, หมวดหมู่, ตั้งค่า, 404
- Light/Dark/ตามระบบ, Responsive (Sidebar บน Desktop, ลิ้นชักเมนู + ปุ่มเพิ่มงานลอยบนมือถือ), รองรับคีย์บอร์ดและ screen reader
- Pagination (20 งาน/หน้า), Loading Skeleton, Empty/Error State, Toast

## สมมติฐานที่เลือกไว้

- UI เป็นภาษาไทย
- วันครบกำหนดเลือกเป็น **วันที่** และเก็บเป็นสิ้นวันนั้นตามเวลาท้องถิ่น (งานจะ "เลยกำหนด" ต่อเมื่อวันนั้นผ่านไปแล้ว)
- หน้า "วันนี้" แสดงงานที่ครบกำหนดวันนี้ **และงานที่เลยกำหนดแล้ว** (ที่ยังไม่เสร็จ)
- เพิ่มคอลัมน์ `priority_rank` (generated) ใน `tasks` เพื่อเรียงความสำคัญ high > medium > low ให้ถูกต้อง (ถ้าเรียงตามตัวอักษรจะผิดลำดับ)
- ธีมเก็บใน `localStorage` ของเบราว์เซอร์ (เป็นค่าตั้งต้นของอุปกรณ์ ไม่ใช่ข้อมูลหลัก) ส่วนโปรไฟล์เก็บใน Supabase
- ใช้ Supabase **Publishable key** (ถ้าโปรเจกต์เก่าใช้ anon key ให้ใส่ค่า anon key ในตัวแปรเดียวกันได้)

## โครงสร้างโปรเจกต์

```
src/
  components/{layout,tasks,categories,dashboard,ui}/
  pages/        หน้าต่างๆ
  hooks/        useTasks, useCategories, useDashboard, useProfile, useTaskMutations
  services/     taskService, categoryService, profileService (คุยกับ Supabase)
  lib/          supabase.ts, errors.ts, dates.ts, labels.ts
  types/        database.ts
  schemas/      taskSchema, categorySchema, authSchema (Zod)
  contexts/     AuthContext, ThemeContext, TaskActionsContext
  __tests__/    Unit tests (Vitest)
supabase/
  migrations/20260101000000_init_todo.sql   ตาราง, trigger, index, RLS
  tests/rls_test.sql                        ทดสอบ RLS ด้วยผู้ใช้ 2 บัญชี
netlify.toml, public/_redirects, .env.example
docs/TEST_CASES.md                          รายการทดสอบและผลจริง
```

## 1) ตั้งค่า Supabase

1. สร้างโปรเจกต์ที่ <https://supabase.com/dashboard> (ต้องเป็น PostgreSQL 15 ขึ้นไป — โปรเจกต์ใหม่เป็นอยู่แล้ว)
2. เปิด **SQL Editor** → New query → วางเนื้อหาไฟล์ `supabase/migrations/20260101000000_init_todo.sql` ทั้งไฟล์ → Run
3. (แนะนำ) เปิดไฟล์ `supabase/tests/rls_test.sql` วางลง SQL Editor แล้ว Run: ต้องเห็นข้อความ `PASS` ทุกบรรทัดในแท็บ Messages/Notices และไม่มี `FAIL` (ทั้งสคริปต์ rollback ตอนท้าย จึงไม่ทิ้งข้อมูลทดสอบ)
4. ไปที่ **Project Settings → API** (หรือ API Keys) คัดลอก **Project URL** และ **Publishable key** (`sb_publishable_...`) ห้ามใช้ `service_role`/secret key ในแอปนี้
5. ไปที่ **Authentication → URL Configuration**
   - **Site URL**: โดเมนจริงบน Netlify เช่น `https://ชื่อไซต์.netlify.app`
   - **Redirect URLs** ให้เพิ่มเฉพาะที่จำเป็น:
     - `https://ชื่อไซต์.netlify.app/login`
     - `https://ชื่อไซต์.netlify.app/reset-password`
     - `http://localhost:5173/login` และ `http://localhost:5173/reset-password` (สำหรับพัฒนาในเครื่อง)
     - ถ้าต้องใช้ Deploy Preview ค่อยเพิ่ม pattern ของ preview URL เฉพาะที่ต้องใช้ ไม่ใช้ `**` กว้างๆ
6. **Authentication → Providers → Email**: เปิด Confirm email ไว้ (ค่าเริ่มต้น) ถ้าต้องการให้สมัครแล้วใช้งานได้ทันทีตอนทดลอง ให้ปิดชั่วคราวได้
7. หมายเหตุ: บริการอีเมลเริ่มต้นของ Supabase จำกัดจำนวนอีเมลต่อชั่วโมงต่ำมาก เหมาะกับทดลองเท่านั้น ใช้งานจริงควรตั้ง SMTP ของตัวเอง

## 2) รันในเครื่อง

ต้องมี Node.js 18.18 ขึ้นไป (แนะนำ 20)

```bash
npm install
cp .env.example .env.local     # แล้วเติมค่า URL และ Publishable key
npm run dev                    # เปิด http://localhost:5173
```

คำสั่งอื่นๆ

```bash
npm run typecheck   # ตรวจ TypeScript (strict)
npm test            # Unit tests
npm run build       # Production build -> dist/
npm run preview     # ดู build ที่ http://localhost:4173
```

ถ้ายังไม่ได้ตั้งค่า `.env.local` หน้าเว็บจะแสดงข้อความ "ยังไม่ได้ตั้งค่า Supabase" แทนที่จะพัง

## 3) Deploy บน Netlify

1. Push โค้ดขึ้น GitHub (`.env.local` ถูกกันไว้ใน `.gitignore` แล้ว ห้าม commit)
2. Netlify → **Add new site → Import an existing project** → เลือก repository
3. ค่า Build: Build command `npm run build`, Publish directory `dist` (ตรงกับ `netlify.toml` อยู่แล้ว)
4. **Site configuration → Environment variables** เพิ่ม
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. กด Deploy (ถ้าแก้ตัวแปรภายหลังต้อง **Trigger deploy** ใหม่ เพราะค่า `VITE_*` ถูกฝังตอน build)
6. กลับไปตั้ง Site URL / Redirect URLs ใน Supabase ให้ตรงกับโดเมนจริง (ข้อ 5 ด้านบน)
7. ทดสอบบน Production: สมัคร/ล็อกอิน, เพิ่ม-แก้-ลบงาน, Refresh หน้า `/tasks` และเข้า URL ตรงๆ เช่น `/categories` (ต้องไม่ 404), ดู Console/Network ว่าไม่มี error

SPA redirect ตั้งไว้ทั้งใน `public/_redirects` (คัดลอกไป `dist/` ตอน build) และใน `netlify.toml`

## 4) การทดสอบ

ดูรายการและผลทดสอบจริงใน [`docs/TEST_CASES.md`](docs/TEST_CASES.md) (แยกชัดเจนว่าอะไรทดสอบแล้ว อะไรต้องทดสอบกับ Supabase/Netlify ของคุณเอง)

## 5) แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| เห็นหน้า "ยังไม่ได้ตั้งค่า Supabase" | ไม่มี `.env.local` หรือชื่อตัวแปรผิด ต้องเป็น `VITE_SUPABASE_URL` และ `VITE_SUPABASE_PUBLISHABLE_KEY` แล้วรีสตาร์ต `npm run dev` (บน Netlify ให้ Deploy ใหม่) |
| Refresh หน้าแล้ว 404 บน Netlify | ตรวจว่า `dist/_redirects` มีบรรทัด `/* /index.html 200` และ Publish directory เป็น `dist` |
| รันไฟล์ SQL แล้วขึ้น syntax error ที่ `ON DELETE SET NULL (category_id)` | โปรเจกต์ใช้ PostgreSQL ต่ำกว่า 15 ต้องอัปเกรดฐานข้อมูล |
| บันทึกงานแล้วขึ้น "คุณไม่มีสิทธิ์ดำเนินการนี้" | ยังไม่ได้รัน migration/RLS ครบ หรือเซสชันหมดอายุ ลองออกจากระบบแล้วเข้าใหม่ และรัน `rls_test.sql` ตรวจ |
| สมัครแล้วไม่ได้รับอีเมลยืนยัน/รีเซ็ต | ดูโฟลเดอร์สแปม, ตรวจโควตาอีเมลเริ่มต้นของ Supabase (จำกัดต่ำ) แล้วตั้ง SMTP ของตัวเอง, หรือปิด Confirm email ชั่วคราวตอนทดลอง |
| กดลิงก์ในอีเมลแล้วไปผิดโดเมน/ถูกปฏิเสธ | Site URL และ Redirect URLs ใน Supabase ไม่ตรงกับโดเมนจริง (ดูข้อ 1.5) |
| ขึ้น "ลิงก์ไม่ถูกต้องหรือหมดอายุ" ที่หน้าตั้งรหัสผ่านใหม่ | ลิงก์ใช้ได้ครั้งเดียวและมีอายุจำกัด ขอลิงก์ใหม่จากหน้า "ลืมรหัสผ่าน" |
| "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" | อินเทอร์เน็ตมีปัญหา, URL ผิด, หรือโปรเจกต์ Supabase ที่เป็น Free ถูก pause ให้เข้า Dashboard แล้ว Restore |
| Build บน Netlify ไม่ผ่านเพราะ TypeScript | รัน `npm run build` ในเครื่องเพื่อดู error ตรงๆ |
| แก้ตัวแปรบน Netlify แล้วไม่เปลี่ยน | ค่า `VITE_*` ฝังตอน build ต้อง Trigger deploy ใหม่ |

## ความปลอดภัย

- ไม่มี Secret ใน Source Code; Client ใช้เฉพาะ Publishable key
- RLS เปิดทุกตาราง: ผู้ใช้เห็น/แก้ได้เฉพาะแถวของตน, `anon` เข้าถึงตารางไม่ได้
- ป้องกันการโอนความเป็นเจ้าของ (`user_id` เปลี่ยนไม่ได้ ทั้งด้วย trigger และ RLS `WITH CHECK`)
- Task ผูกได้เฉพาะหมวดหมู่ของตัวเอง (composite foreign key `(category_id, user_id)` + เงื่อนไขใน policy)
- Trigger สร้าง profile ใช้ `SECURITY DEFINER` พร้อม `search_path` ว่าง และเพิกถอนสิทธิ์เรียกจาก client
- ข้อความ error แสดงผู้ใช้ผ่านการแปลง ไม่เปิดเผยรายละเอียดภายใน; หน้าลืมรหัสผ่าน/สมัครสมาชิกไม่เปิดเผยว่าอีเมลมีอยู่ในระบบหรือไม่
- ตั้ง Security headers พื้นฐานใน `netlify.toml` (ยังไม่ได้ตั้ง Content-Security-Policy เพราะต้องปรับตามโดเมน Supabase/ฟอนต์ที่ใช้จริง)

## ข้อจำกัดที่ควรรู้

- ยังไม่มี E2E test (Playwright/Cypress) ในโปรเจกต์ — เส้นทางหลักของผู้ใช้ต้องทดสอบด้วยมือตาม `docs/TEST_CASES.md`
- Bundle JavaScript ประมาณ 590 kB (gzip ~165 kB) ยังไม่ได้แยก code-split
- การตรวจชนกันของการแก้ไขข้ามเซสชันทำด้วย `updated_at` (optimistic concurrency): ถ้างานถูกแก้/ลบจากที่อื่น ระบบแจ้งแล้วโหลดข้อมูลล่าสุดให้ ไม่ได้ merge ให้อัตโนมัติ
