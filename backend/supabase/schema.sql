-- LITERA+ | Skema database Supabase (PostgreSQL)
-- Jalankan di Supabase Dashboard -> SQL Editor

create extension if not exists "pgcrypto";

-- Tabel pengguna (admin & petugas perpustakaan)
create table if not exists users (
  user_id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'visitor' check (role in ('admin', 'petugas', 'visitor')),
  created_at timestamptz not null default now()
);

-- Migrasi untuk database yang sudah ada sebelum role 'visitor' ditambahkan
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in ('admin', 'petugas', 'visitor'));
alter table users alter column role set default 'visitor';

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

-- batch_id mengelompokkan eksemplar yang ditambahkan bersamaan dalam satu kali "Tambah Buku",
-- supaya List Buku bisa menampilkannya sebagai satu baris ringkas (judul + jumlah + rentang
-- nomor inventaris), sementara tiap eksemplar tetap 1 baris sendiri agar bisa diedit/dihapus
-- satu-satu lewat modal detail (navigasi Berikutnya/Sebelumnya).
alter table books add column if not exists batch_id uuid;
create index if not exists books_batch_id_idx on books (batch_id);

-- Migrasi satu-kali: sebelumnya 1 baris buku bisa mewakili banyak eksemplar sekaligus
-- (kolom jumlah > 1 dengan nomor_inventaris berupa rentang, mis. "INV-01 - INV-03"). Sekarang
-- 1 baris = 1 eksemplar fisik, supaya tiap eksemplar bisa ditampilkan, diedit, dan dihapus
-- sendiri-sendiri. Blok ini memecah baris lama menjadi baris-baris individual dengan nomor
-- inventaris berurutan, dan memberi mereka batch_id yang sama supaya tetap tampil sebagai satu
-- baris ringkas di List Buku. Aman dijalankan berulang kali: setelah migrasi tidak ada lagi
-- baris dengan jumlah > 1, sehingga loop di bawah tidak menemukan baris untuk diproses.
do $$
declare
  r record;
  i integer;
  m text[];
  prefix text;
  digits text;
  suffix text;
  width integer;
  start_num integer;
  num_text text;
  new_nomor text;
  group_batch_id uuid;
begin
  for r in select * from books where jumlah > 1 loop
    m := regexp_match(r.nomor_inventaris, '^(.*?)([0-9]+)([^0-9]*)$');
    group_batch_id := gen_random_uuid();

    for i in 1..r.jumlah loop
      if m is null then
        new_nomor := r.nomor_inventaris;
      else
        prefix := m[1];
        digits := m[2];
        suffix := m[3];
        width := length(digits);
        start_num := digits::integer;
        -- lpad() truncates strings longer than `width` (unlike JS padStart), so once the
        -- incremented number outgrows the original digit width (e.g. INV-98 .. INV-102),
        -- only pad when it still fits to avoid mangling the number.
        num_text := (start_num + i - 1)::text;
        if length(num_text) < width then
          num_text := lpad(num_text, width, '0');
        end if;
        new_nomor := prefix || num_text || suffix;
      end if;

      if i = 1 then
        update books set jumlah = 1, nomor_inventaris = new_nomor, batch_id = group_batch_id where id = r.id;
      else
        insert into books (
          library_id, judul, penulis, penerbit, tahun_terbit, isbn, kode_klasifikasi,
          kondisi, subjek, bahasa, jumlah, nomor_inventaris, jumlah_halaman, ukuran_buku,
          ilustrasi, cover_url, batch_id
        ) values (
          r.library_id, r.judul, r.penulis, r.penerbit, r.tahun_terbit, r.isbn, r.kode_klasifikasi,
          r.kondisi, r.subjek, r.bahasa, 1, new_nomor, r.jumlah_halaman, r.ukuran_buku,
          r.ilustrasi, r.cover_url, group_batch_id
        );
      end if;
    end loop;
  end loop;
end $$;

-- Backfill: baris lama yang belum pernah dipecah (jumlah selalu 1) belum punya batch_id.
-- Jadikan tiap baris seperti itu sebagai batch tunggal berisi dirinya sendiri.
update books set batch_id = id where batch_id is null;

-- Nomor inventaris tidak boleh sama untuk dua buku dalam perpustakaan yang sama. Nilai kosong
-- dikecualikan (partial index) karena banyak buku belum diberi nomor inventaris. Backend juga
-- memvalidasi ini lebih dulu (lihat books.service.js) supaya pesan errornya ramah pengguna;
-- index ini adalah jaring pengaman di level database.
-- Jika baris ini gagal karena "could not create unique index ... duplicate key", cek dulu
-- duplikatnya dengan query berikut, lalu perbaiki manual sebelum menjalankan ulang:
--   select library_id, nomor_inventaris, count(*)
--   from books
--   where nomor_inventaris <> ''
--   group by library_id, nomor_inventaris
--   having count(*) > 1;
create unique index if not exists books_library_nomor_inventaris_idx
  on books (library_id, nomor_inventaris)
  where nomor_inventaris <> '';

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
