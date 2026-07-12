# LITERA+

Sistem inventaris digital untuk perpustakaan desa dan sekolah. Terdiri dari
landing page, halaman login, dan dashboard admin untuk mengelola data
perpustakaan (Manajemen Perpustakaan) beserta riwayat aktivitasnya.

## Struktur Proyek

```
frontend/   React + Vite + TypeScript + Tailwind CSS v4
backend/    Express + Supabase (PostgreSQL) + JWT
```

## 1. Menyiapkan Database (Supabase)

1. Buat akun gratis di https://supabase.com dan buat project baru.
2. Buka **SQL Editor** di dashboard Supabase, lalu jalankan isi file
   [`backend/supabase/schema.sql`](backend/supabase/schema.sql). Ini akan
   membuat tabel `users`, `libraries`, `activity_log`, sekaligus mengisi data
   contoh (12 perpustakaan) dan 1 akun admin default.
3. Buka **Project Settings -> API**, salin:
   - `Project URL` -> `SUPABASE_URL`
   - `service_role` key (bukan `anon` key) -> `SUPABASE_SERVICE_ROLE_KEY`

## 2. Menjalankan Backend

```bash
cd backend
cp .env.example .env
# isi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan JWT_SECRET di .env
npm install
npm run dev
```

Backend berjalan di `http://localhost:5000`.

## 3. Menjalankan Frontend

```bash
cd frontend
cp .env.example .env
# .env sudah default ke http://localhost:5000/api, ubah jika perlu
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

## Login Default

Setelah menjalankan `schema.sql`, gunakan akun berikut untuk masuk:

- Email: `admin@litera.id`
- Password: `admin123`

## Halaman

- `/` — Landing page LITERA+
- `/login` — Halaman login
- `/dashboard` — Manajemen Perpustakaan (perlu login)
- `/riwayat` — Riwayat aktivitas (perlu login)
