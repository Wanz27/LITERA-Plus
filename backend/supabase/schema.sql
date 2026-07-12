-- LITERA+ | Skema database Supabase (PostgreSQL)
-- Jalankan di Supabase Dashboard -> SQL Editor

create extension if not exists "pgcrypto";

-- Tabel pengguna (admin & petugas perpustakaan)
create table if not exists users (
  user_id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'petugas' check (role in ('admin', 'petugas')),
  created_at timestamptz not null default now()
);

-- Tabel perpustakaan (lokasi / fasilitas perpustakaan)
create table if not exists libraries (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  lokasi text not null,
  status text not null default 'Tersedia' check (status in ('Tersedia', 'Penuh', 'Pemeliharaan')),
  tipe text not null default 'utama' check (tipe in ('utama', 'digital', 'referensi', 'arsip')),
  total_koleksi integer not null default 0,
  jam_operasional text not null default E'Senin - Jumat: 08.00 - 18.00\nSabtu: 09.00 - 15.00',
  kepala_unit text not null default 'Belum ditentukan',
  created_at timestamptz not null default now()
);

-- Migrasi untuk database yang sudah ada sebelum kolom ini ditambahkan
alter table libraries add column if not exists jam_operasional text not null default E'Senin - Jumat: 08.00 - 18.00\nSabtu: 09.00 - 15.00';
alter table libraries add column if not exists kepala_unit text not null default 'Belum ditentukan';

-- Tabel buku (koleksi buku per perpustakaan)
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references libraries(id) on delete cascade,
  judul text not null,
  penulis text not null,
  penerbit text not null default '',
  tahun_terbit integer,
  isbn text not null default '',
  kode_klasifikasi text not null default '',
  kondisi text not null default 'Bagus' check (kondisi in ('Bagus', 'Rusak')),
  subjek text not null default '',
  bahasa text not null default '',
  jumlah integer not null default 1,
  nomor_inventaris text not null default '',
  jumlah_halaman integer,
  ukuran_buku text not null default '',
  ilustrasi text not null default '',
  cover_url text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists books_library_id_idx on books (library_id);

-- Migrasi untuk database yang sudah ada sebelum kolom ini ditambahkan
alter table books add column if not exists kondisi text not null default 'Bagus' check (kondisi in ('Bagus', 'Rusak'));
alter table books add column if not exists subjek text not null default '';
alter table books add column if not exists bahasa text not null default '';
alter table books add column if not exists cover_url text not null default '';

-- Tabel riwayat aktivitas
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  aksi text not null,
  detail text not null,
  pelaku text not null,
  created_at timestamptz not null default now()
);

-- Seed: akun admin default (email: admin@litera.id / password: admin123)
insert into users (full_name, email, password_hash, role)
values (
  'Admin LITERA+',
  'admin@litera.id',
  '$2b$10$tWPwfKEobbPqcmv8ZVYHbubKH7hoVfBWAn8eVMpRz88DgoBSZ.jgO',
  'admin'
)
on conflict (email) do nothing;

-- Seed: daftar perpustakaan contoh
insert into libraries (nama, lokasi, status, tipe, total_koleksi) values
  ('Perpustakaan Pusat', 'Lantai 1, Gedung Utama', 'Tersedia', 'utama', 2400),
  ('Perpustakaan Digital', 'Lantai 3, Sayap Barat', 'Tersedia', 'digital', 850),
  ('Ruang Baca Referensi', 'Lantai 2, Gedung B', 'Penuh', 'referensi', 620),
  ('Laboratorium Arsip', 'Basement 1', 'Pemeliharaan', 'arsip', 310),
  ('Perpustakaan SD Sukamaju', 'Jl. Melati No. 4, Desa Sukamaju', 'Tersedia', 'utama', 540),
  ('Perpustakaan SMP Negeri 2', 'Lantai 1, Gedung Sekolah', 'Tersedia', 'utama', 980),
  ('Taman Baca Desa Mekar Jaya', 'Balai Desa Mekar Jaya', 'Tersedia', 'utama', 275),
  ('Perpustakaan Digital SMA 1', 'Ruang Multimedia, Lantai 2', 'Penuh', 'digital', 430),
  ('Ruang Referensi Guru', 'Lantai 1, Ruang Guru', 'Tersedia', 'referensi', 190),
  ('Arsip Sekolah Lama', 'Gudang Belakang', 'Pemeliharaan', 'arsip', 120),
  ('Perpustakaan Keliling Desa', 'Mobil Perpustakaan Keliling', 'Tersedia', 'utama', 360),
  ('Pojok Baca Balai Desa', 'Balai Desa Sukamakmur', 'Tersedia', 'utama', 150)
on conflict do nothing;
