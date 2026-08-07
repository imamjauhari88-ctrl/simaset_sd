-- Seed Kategori Barang + Ruangan/Lokasi standar untuk SIMASET SD
-- Aman dijalankan berkali-kali — baris yang namanya sudah ada (untuk
-- sekolah yang sama) tidak akan didobel.
--
-- CARA PAKAI:
-- Ganti 'NAMA SEKOLAH ANDA' di bawah dengan nama sekolah PERSIS seperti
-- yang tersimpan di tabel `sekolah` (kolom `nama`). Jalankan lewat
-- Supabase Dashboard -> SQL Editor.
--
-- CATATAN: sekolah_id diambil eksplisit lewat subquery (bukan pakai
-- default kolom current_sekolah_id()), karena auth.uid() kosong kalau
-- dijalankan langsung di SQL Editor (bukan dari sesi login aplikasi).

with target_sekolah as (
  select id from sekolah where nama = 'NAMA SEKOLAH ANDA' limit 1
)

-- ============================================================
-- KATEGORI BARANG
-- ATK (spidol, kertas, tinta, dst) SENGAJA tidak dimasukkan — itu
-- barang habis pakai (consumable), bukan aset tetap yang disusutkan.
-- ============================================================
, kategori_baru (nama, kode_kib) as (
  values
    ('Meubelair', 'KIB B'),
    ('Elektronik', 'KIB B'),
    ('Alat Peraga Pendidikan (APE)', 'KIB B'),
    ('Alat Olahraga', 'KIB B'),
    ('Alat Kesenian & Musik', 'KIB B'),
    ('Buku & Bahan Pustaka', 'KIB B'),
    ('Alat Laboratorium/IPA', 'KIB B'),
    ('Alat Kebersihan', 'KIB B'),
    ('Alat Kesehatan/UKS', 'KIB B'),
    ('Kendaraan', 'KIB B')
)
insert into kategori_aset (sekolah_id, nama, kode_kib)
select target_sekolah.id, kategori_baru.nama, kategori_baru.kode_kib
from kategori_baru, target_sekolah
where not exists (
  select 1 from kategori_aset k
  where k.sekolah_id = target_sekolah.id and k.nama = kategori_baru.nama
);

-- ============================================================
-- RUANGAN / LOKASI
-- Kelas 1-6 dipisah per rombel (rombongan belajar) A saja sebagai
-- default — kalau sekolah kamu punya lebih dari 1 rombel per tingkat
-- (mis. Kelas 1A, 1B), tinggal duplikasi baris & ganti hurufnya.
-- ============================================================
with target_sekolah as (
  select id from sekolah where nama = 'NAMA SEKOLAH ANDA' limit 1
),
ruangan_baru (nama) as (
  values
    ('Ruang Kepala Sekolah'),
    ('Ruang Guru'),
    ('Ruang Tata Usaha'),
    ('Kelas 1'),
    ('Kelas 2'),
    ('Kelas 3'),
    ('Kelas 4'),
    ('Kelas 5'),
    ('Kelas 6'),
    ('Perpustakaan'),
    ('UKS'),
    ('Laboratorium Komputer'),
    ('Mushola'),
    ('Gudang'),
    ('Kantin'),
    ('Toilet Guru'),
    ('Toilet Siswa'),
    ('Lapangan/Aula')
)
insert into ruangan (sekolah_id, nama)
select target_sekolah.id, ruangan_baru.nama
from ruangan_baru, target_sekolah
where not exists (
  select 1 from ruangan r
  where r.sekolah_id = target_sekolah.id and r.nama = ruangan_baru.nama
);
