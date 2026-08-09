-- Skema Sistem Inventaris Aset Sekolah (SIMASET SD) — Multi-tenant + Role
-- Jalankan di Supabase SQL editor
--
-- File ini SATU-SATUNYA sumber skema — aman dijalankan ulang KAPAN PUN,
-- baik di database yang benar-benar baru maupun yang sudah pernah
-- menjalankan versi file ini sebelumnya:
--   - Semua `create table` pakai `if not exists`.
--   - Semua `create policy` / `create trigger` didahului `drop ... if
--     exists`, jadi nggak akan pernah tabrakan "already exists".
--   - Tabel yang sudah dicabut dari aplikasi (mis. `penghapusan_aset`)
--     ikut di-drop di sini juga, supaya database kamu selalu selaras
--     dengan skema versi kode yang sedang kamu pakai.
--   - Migrasi kolom/data (mis. rename role 'operator' -> 'guru') ditulis
--     sebagai `update`/`alter` yang aman diulang, bukan diasumsikan cuma
--     jalan sekali.
-- Kalau nambah tabel/kolom baru di masa depan, tempel di file ini juga
-- (bukan bikin file migrasi terpisah) — biar tetap satu file yang bisa
-- dipercaya mewakili skema saat ini secara utuh.

-- ============================================================
-- 1. TENANT (SEKOLAH) & PROFIL PENGGUNA
-- ============================================================

create table if not exists sekolah (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  npsn text,
  alamat text,
  logo_url text,
  created_at timestamptz default now()
);

-- Status sekolah (dulu ada alur approval super admin — SEKARANG DICABUT,
-- lihat blok "Approval pendaftaran sekolah DICABUT" di bawah buat migrasi
-- & constraint final-nya). Baris ini SENGAJA dibiarkan pakai constraint
-- lama ('menunggu_approval'/'aktif'/'ditolak') supaya kolomnya tetap ada
-- buat sekolah yang udah eksis sebelum kolom ini ditambahkan — constraint
-- final yang cuma ('aktif'/'nonaktif') di-apply belakangan di bawah,
-- setelah data lama dimigrasi. Kolom `disetujui_at`/`ditolak_alasan` yang
-- dulu dipakai bareng alur approval ini SUDAH DIHAPUS (lihat blok migrasi
-- di bawah) — `ditolak_alasan` sempat ditambahin lagi sebentar di sini
-- cuma buat jaga-jaga data lama ke-baca pas migrasi, sebelum di-drop
-- permanen.
alter table sekolah add column if not exists status text not null default 'aktif';
alter table sekolah drop constraint if exists sekolah_status_check;
alter table sekolah add constraint sekolah_status_check
  check (status in ('menunggu_approval','aktif','ditolak'));
alter table sekolah add column if not exists ditolak_alasan text;

-- Satu baris profil = satu user Supabase Auth, terikat ke SATU sekolah.
-- Inilah akar dari isolasi multi-tenant: semua RLS policy di bawah
-- menelusuri baris ini lewat auth.uid().
--
-- Role: 'admin' (akses penuh), 'guru' (tambah aset + edit aset milik
-- sendiri), 'kepsek' (lihat semua + approve mutasi/pemeliharaan).
-- Role ini dulu bernama 'operator' — lihat migrasi di bawah.
create table if not exists profil (
  id uuid primary key references auth.users(id) on delete cascade,
  sekolah_id uuid not null references sekolah(id) on delete cascade,
  nama text not null,
  role text check (role in ('admin','guru','kepsek')) not null default 'guru',
  created_at timestamptz default now()
);

create index if not exists idx_profil_sekolah on profil(sekolah_id);

-- Migrasi role lama 'operator' -> 'guru'. Aman diulang: no-op kalau
-- constraint & data sudah dalam bentuk baru (termasuk di install fresh,
-- karena create table di atas sudah langsung pakai 'guru').
update profil set role = 'guru' where role = 'operator';
alter table profil drop constraint if exists profil_role_check;
alter table profil add constraint profil_role_check check (role in ('admin','guru','kepsek'));
alter table profil alter column role set default 'guru';

-- Helper: sekolah_id / role milik user yang sedang login.
-- STABLE + security definer supaya bisa dipakai bebas di RLS policy
-- tanpa recursive-RLS pada tabel profil itu sendiri.
-- HARUS didefinisikan SEBELUM tabel apa pun yang memakainya sebagai
-- default kolom (undangan, kategori_aset, dst di bawah) — kalau
-- urutannya kebalik, run di database baru (dari nol) bakal gagal
-- dengan error "function current_sekolah_id() does not exist".
create or replace function current_sekolah_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select sekolah_id from profil where id = auth.uid()
$$;

create or replace function current_role_app()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profil where id = auth.uid()
$$;

-- Undangan pengguna: satu baris = satu link undangan yang di-generate admin
-- dari halaman Pengaturan. Token JWT (lib/tenant/undangan.ts) cuma bawa
-- `id` baris ini + sekolahId + role buat verifikasi tanda tangan/kedaluwarsa
-- tanpa query — tapi baris INI yang jadi sumber kebenaran soal "sudah
-- dipakai apa belum", supaya satu link cuma bisa dipakai untuk SATU kali
-- pendaftaran. Begitu ada yang berhasil daftar lewat link itu, `dipakai_at`
-- keisi (diklaim atomik di app/undangan/[token]/actions.ts) dan orang lain
-- yang buka link yang sama setelahnya otomatis ditolak — jadi kalau link
-- ke-forward atau bocor ke luar, cuma orang pertama yang sempat pakai
-- yang bisa masuk.
create table if not exists undangan (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null default current_sekolah_id() references sekolah(id) on delete cascade,
  role text check (role in ('admin','guru','kepsek')) not null,
  dibuat_oleh uuid references profil(id) on delete set null,
  kedaluwarsa_at timestamptz not null,
  dipakai_at timestamptz,
  dipakai_oleh uuid references profil(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_undangan_sekolah on undangan(sekolah_id);

-- Migrasi role lama di baris undangan yang sudah kepalang dibuat sebelum
-- rename (kalau ada yang belum dipakai / masih pending).
update undangan set role = 'guru' where role = 'operator';
alter table undangan drop constraint if exists undangan_role_check;
alter table undangan add constraint undangan_role_check check (role in ('admin','guru','kepsek'));

alter table undangan enable row level security;

-- Admin satu sekolah bisa lihat riwayat undangan (dipakai/belum) sekolahnya
-- sendiri, dan cuma admin yang boleh generate undangan baru.
drop policy if exists undangan_select_satu_sekolah on undangan;
create policy undangan_select_satu_sekolah on undangan
  for select using (sekolah_id = current_sekolah_id());

drop policy if exists undangan_insert_admin on undangan;
create policy undangan_insert_admin on undangan
  for insert with check (
    sekolah_id = current_sekolah_id() and current_role_app() = 'admin'
  );

-- Tidak ada policy update/delete untuk role biasa: mengklaim link (isi
-- dipakai_at) dilakukan lewat service role di server action, karena user
-- yang baru menerima undangan belum punya baris `profil` sama sekali
-- (belum lolos RLS mana pun).

-- ============================================================
-- 1b. BERSIH-BERSIH TABEL YANG SUDAH DICABUT
-- Fitur Penghapusan Aset dicabut dari aplikasi (di luar cakupan, ranah
-- Dinas Pendidikan). Baris ini memastikan tabel lamanya ikut hilang tiap
-- kali schema.sql dijalankan ulang, termasuk di database yang sudah
-- sempat punya tabel ini dari versi lama. Aman: fiturnya belum pernah
-- dipakai (masih empty state), jadi tidak ada data yang perlu diselamatkan.
-- ============================================================
drop table if exists penghapusan_aset;

-- ============================================================
-- 2. MASTER DATA (per-tenant)
-- ============================================================

create table if not exists kategori_aset (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null default current_sekolah_id() references sekolah(id) on delete cascade,
  nama text not null,
  kode_kib text, -- contoh: KIB-A, KIB-B, dst
  created_at timestamptz default now()
);

create table if not exists ruangan (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null default current_sekolah_id() references sekolah(id) on delete cascade,
  nama text not null,
  keterangan text,
  created_at timestamptz default now()
);

create table if not exists aset (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null default current_sekolah_id() references sekolah(id) on delete cascade,
  kode_aset text not null,
  nama text not null,
  kategori_id uuid references kategori_aset(id),
  ruangan_id uuid references ruangan(id),
  merk_tipe text,
  tahun_perolehan int,
  sumber_dana text check (sumber_dana in ('bos','apbd','hibah','swadaya','lainnya')),
  harga_perolehan numeric default 0,
  kondisi text check (kondisi in ('baik','rusak_ringan','rusak_berat')) default 'baik',
  foto_url text,        -- secure_url dari Cloudinary
  foto_public_id text,  -- public_id Cloudinary, dipakai untuk hapus/replace foto
  catatan text,
  dibuat_oleh uuid references profil(id) on delete set null default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (sekolah_id, kode_aset) -- kode aset unik per sekolah, bukan global
);

-- Tabel `aset` sudah ada dari versi sebelum kolom `dibuat_oleh` ditambah
-- (dipakai buat menentukan aset mana yang boleh diedit guru — lihat RLS
-- di bawah). `add column if not exists` aman dijalankan di kedua kondisi.
alter table aset add column if not exists dibuat_oleh uuid references profil(id) on delete set null default auth.uid();

create table if not exists mutasi_aset (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null default current_sekolah_id() references sekolah(id) on delete cascade,
  aset_id uuid references aset(id) on delete cascade,
  ruangan_asal_id uuid references ruangan(id),
  ruangan_tujuan_id uuid references ruangan(id),
  tanggal date not null default current_date,
  disetujui_oleh text,
  keterangan text,
  created_at timestamptz default now()
);

create table if not exists pemeliharaan_aset (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null default current_sekolah_id() references sekolah(id) on delete cascade,
  aset_id uuid references aset(id) on delete cascade,
  tanggal date not null default current_date,
  jenis text check (jenis in ('rutin','perbaikan')) not null,
  biaya numeric default 0,
  keterangan text,
  disetujui_oleh text,
  created_at timestamptz default now()
);

-- Tabel ini mungkin sudah ada dari sebelum kolom approval ditambah —
-- `add column if not exists` aman di kedua kondisi (baru/lama).
alter table pemeliharaan_aset add column if not exists disetujui_oleh text;

create table if not exists log_aktivitas (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null default current_sekolah_id() references sekolah(id) on delete cascade,
  aktor text,
  aksi text,
  target text,
  created_at timestamptz default now()
);

-- Sesi opname fisik: satu sekolah biasanya cuma punya SATU sesi
-- 'berlangsung' aktif dalam satu waktu (ditegakkan di kode app, bukan DB).
create table if not exists opname_sesi (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null default current_sekolah_id() references sekolah(id) on delete cascade,
  judul text not null,
  status text check (status in ('berlangsung','selesai')) not null default 'berlangsung',
  dibuat_oleh text,
  created_at timestamptz default now(),
  selesai_at timestamptz
);

-- Satu baris per aset yang berhasil di-scan dalam sebuah sesi opname.
-- Aset yang TIDAK punya baris di sini pas sesi ditutup dianggap "belum
-- ditemukan" — dihitung lewat NOT IN, bukan pre-populate semua aset.
create table if not exists opname_detail (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null default current_sekolah_id() references sekolah(id) on delete cascade,
  sesi_id uuid not null references opname_sesi(id) on delete cascade,
  aset_id uuid not null references aset(id) on delete cascade,
  kondisi_saat_opname text check (kondisi_saat_opname in ('baik','rusak_ringan','rusak_berat')),
  catatan text,
  di_scan_oleh text,
  created_at timestamptz default now(),
  unique (sesi_id, aset_id) -- satu aset cuma perlu 1x tercatat per sesi
);

create index if not exists idx_aset_sekolah on aset(sekolah_id);
create index if not exists idx_aset_dibuat_oleh on aset(dibuat_oleh);
create index if not exists idx_kategori_sekolah on kategori_aset(sekolah_id);
create index if not exists idx_ruangan_sekolah on ruangan(sekolah_id);
create index if not exists idx_opname_detail_sesi on opname_detail(sesi_id);

-- ============================================================
-- 3. ROW LEVEL SECURITY — isolasi antar sekolah + izin per role
--
-- Semua policy tetap disyaratkan sekolah_id = current_sekolah_id()
-- (isolasi tenant, tidak bisa dilonggarkan oleh role apa pun). Di atas
-- itu, tiap tabel punya aturan tulis (insert/update/delete) sendiri
-- sesuai peran:
--
--                    | admin | guru                  | kepsek
--   kategori_aset    | CRUD  | lihat saja             | lihat saja
--   ruangan          | CRUD  | lihat saja             | lihat saja
--   aset             | CRUD  | tambah + edit MILIK    | lihat saja
--                     |       | SENDIRI, tidak hapus  |
--   mutasi_aset       | CRUD  | lihat saja             | lihat + update (approve)
--   pemeliharaan_aset | CRUD  | lihat saja             | lihat + update (approve)
--   opname_sesi/detail| CRUD  | lihat saja             | lihat saja
--
-- Idempotent: pakai `drop policy if exists` sebelum tiap `create policy`
-- supaya file ini aman di-re-run kapan pun tanpa error "already exists".
-- ============================================================

-- --- kategori_aset & ruangan: master data, admin-only tulis ---
do $$
declare
  t text;
begin
  for t in select unnest(array['kategori_aset','ruangan'])
  loop
    execute format('alter table %I enable row level security', t);

    execute format('drop policy if exists tenant_isolation_select on %I', t);
    execute format('drop policy if exists tenant_isolation_insert on %I', t);
    execute format('drop policy if exists tenant_isolation_update on %I', t);
    execute format('drop policy if exists tenant_isolation_delete on %I', t);
    execute format('drop policy if exists master_select on %I', t);
    execute format('drop policy if exists master_admin_insert on %I', t);
    execute format('drop policy if exists master_admin_update on %I', t);
    execute format('drop policy if exists master_admin_delete on %I', t);

    execute format(
      'create policy master_select on %I for select using (sekolah_id = current_sekolah_id())',
      t
    );
    execute format(
      'create policy master_admin_insert on %I for insert with check (sekolah_id = current_sekolah_id() and current_role_app() = ''admin'')',
      t
    );
    execute format(
      'create policy master_admin_update on %I for update using (sekolah_id = current_sekolah_id() and current_role_app() = ''admin'')',
      t
    );
    execute format(
      'create policy master_admin_delete on %I for delete using (sekolah_id = current_sekolah_id() and current_role_app() = ''admin'')',
      t
    );
  end loop;
end $$;

-- --- aset: admin CRUD penuh; guru tambah + edit aset yang dia buat
--     sendiri (tidak bisa hapus); kepsek lihat saja ---
alter table aset enable row level security;

drop policy if exists tenant_isolation_select on aset;
drop policy if exists tenant_isolation_insert on aset;
drop policy if exists tenant_isolation_update on aset;
drop policy if exists tenant_isolation_delete on aset;
drop policy if exists aset_select on aset;
drop policy if exists aset_insert on aset;
drop policy if exists aset_update on aset;
drop policy if exists aset_admin_delete on aset;

create policy aset_select on aset
  for select using (sekolah_id = current_sekolah_id());

create policy aset_insert on aset
  for insert with check (
    sekolah_id = current_sekolah_id()
    and current_role_app() in ('admin','guru')
  );

create policy aset_update on aset
  for update using (
    sekolah_id = current_sekolah_id()
    and (
      current_role_app() = 'admin'
      or (current_role_app() = 'guru' and dibuat_oleh = auth.uid())
    )
  );

create policy aset_admin_delete on aset
  for delete using (
    sekolah_id = current_sekolah_id() and current_role_app() = 'admin'
  );

-- --- mutasi_aset & pemeliharaan_aset: admin bikin & hapus; kepsek boleh
--     update (approve — isi disetujui_oleh/catatan); guru lihat saja ---
do $$
declare
  t text;
begin
  for t in select unnest(array['mutasi_aset','pemeliharaan_aset'])
  loop
    execute format('alter table %I enable row level security', t);

    execute format('drop policy if exists tenant_isolation_select on %I', t);
    execute format('drop policy if exists tenant_isolation_insert on %I', t);
    execute format('drop policy if exists tenant_isolation_update on %I', t);
    execute format('drop policy if exists tenant_isolation_delete on %I', t);
    execute format('drop policy if exists proses_select on %I', t);
    execute format('drop policy if exists proses_admin_insert on %I', t);
    execute format('drop policy if exists proses_approve_update on %I', t);
    execute format('drop policy if exists proses_admin_delete on %I', t);

    execute format(
      'create policy proses_select on %I for select using (sekolah_id = current_sekolah_id())',
      t
    );
    execute format(
      'create policy proses_admin_insert on %I for insert with check (sekolah_id = current_sekolah_id() and current_role_app() = ''admin'')',
      t
    );
    execute format(
      'create policy proses_approve_update on %I for update using (sekolah_id = current_sekolah_id() and current_role_app() in (''admin'',''kepsek''))',
      t
    );
    execute format(
      'create policy proses_admin_delete on %I for delete using (sekolah_id = current_sekolah_id() and current_role_app() = ''admin'')',
      t
    );
  end loop;
end $$;

-- --- opname_sesi & opname_detail: admin-only tulis; guru & kepsek lihat
--     saja (opname fisik dipegang admin) ---
do $$
declare
  t text;
begin
  for t in select unnest(array['opname_sesi','opname_detail'])
  loop
    execute format('alter table %I enable row level security', t);

    execute format('drop policy if exists tenant_isolation_select on %I', t);
    execute format('drop policy if exists tenant_isolation_insert on %I', t);
    execute format('drop policy if exists tenant_isolation_update on %I', t);
    execute format('drop policy if exists tenant_isolation_delete on %I', t);
    execute format('drop policy if exists opname_select on %I', t);
    execute format('drop policy if exists opname_admin_insert on %I', t);
    execute format('drop policy if exists opname_admin_update on %I', t);
    execute format('drop policy if exists opname_admin_delete on %I', t);

    execute format(
      'create policy opname_select on %I for select using (sekolah_id = current_sekolah_id())',
      t
    );
    execute format(
      'create policy opname_admin_insert on %I for insert with check (sekolah_id = current_sekolah_id() and current_role_app() = ''admin'')',
      t
    );
    execute format(
      'create policy opname_admin_update on %I for update using (sekolah_id = current_sekolah_id() and current_role_app() = ''admin'')',
      t
    );
    execute format(
      'create policy opname_admin_delete on %I for delete using (sekolah_id = current_sekolah_id() and current_role_app() = ''admin'')',
      t
    );
  end loop;
end $$;

-- --- log_aktivitas: belum dipakai app (fitur masa depan) — select buat
--     semua, insert admin-only, sengaja tanpa policy update/delete
--     (audit log idealnya tidak bisa diubah/dihapus lewat client). ---
alter table log_aktivitas enable row level security;

drop policy if exists tenant_isolation_select on log_aktivitas;
drop policy if exists tenant_isolation_insert on log_aktivitas;
drop policy if exists tenant_isolation_update on log_aktivitas;
drop policy if exists tenant_isolation_delete on log_aktivitas;
drop policy if exists log_select on log_aktivitas;
drop policy if exists log_admin_insert on log_aktivitas;

create policy log_select on log_aktivitas
  for select using (sekolah_id = current_sekolah_id());

create policy log_admin_insert on log_aktivitas
  for insert with check (
    sekolah_id = current_sekolah_id() and current_role_app() = 'admin'
  );

-- profil: user hanya boleh baca profilnya sendiri + rekan satu sekolah
-- (berguna untuk daftar "Pengguna" di halaman Pengaturan).
alter table profil enable row level security;

drop policy if exists profil_select_satu_sekolah on profil;
create policy profil_select_satu_sekolah on profil
  for select using (sekolah_id = current_sekolah_id());

drop policy if exists profil_update_diri_sendiri on profil;
create policy profil_update_diri_sendiri on profil
  for update using (id = auth.uid());

-- sekolah: user hanya boleh baca data sekolahnya sendiri.
alter table sekolah enable row level security;

drop policy if exists sekolah_select_milik_sendiri on sekolah;
create policy sekolah_select_milik_sendiri on sekolah
  for select using (id = current_sekolah_id());

drop policy if exists sekolah_update_admin on sekolah;
create policy sekolah_update_admin on sekolah
  for update using (id = current_sekolah_id() and current_role_app() = 'admin');

-- Catatan: pembuatan baris `sekolah` baru (saat onboarding sekolah baru)
-- dan baris `profil` pertama (saat menerima undangan) dilakukan lewat
-- Supabase service role key di server (lib/supabase/service.ts),
-- yang otomatis bypass RLS — karena saat itu user belum punya
-- current_sekolah_id() sama sekali.

-- ============================================================
-- 4. TRIGGER updated_at
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_aset_updated_at on aset;
create trigger trg_aset_updated_at
  before update on aset
  for each row execute function set_updated_at();

-- ============================================================
-- 5. PEMINJAMAN ASET (role-based approval)
--
-- assetId (aset_id) sebagai referensi utama, bukan nama aset.
-- Aturan approval:
--   - peminjam admin/kepsek -> auto-approve/reject saat request
--   - peminjam guru         -> status MENUNGGU, nunggu admin/kepsek
-- Semua perubahan stok (approve/return) wajib lewat fungsi
-- SECURITY DEFINER di bawah (bukan UPDATE langsung dari client),
-- dan wajib mengunci baris terkait (FOR UPDATE) supaya aman dari
-- race condition kalau ada 2 approve/return nembak bersamaan.
-- ============================================================

alter table aset add column if not exists stok int not null default 1 check (stok >= 0);

create table if not exists peminjaman (
  borrow_id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null default current_sekolah_id() references sekolah(id) on delete cascade,
  aset_id uuid not null references aset(id),
  -- peminjam_id & peminjam_role di-default dari sesi login, BUKAN dari
  -- payload client — supaya tidak ada celah orang lain "meminjamkan atas
  -- nama" user lain atau ngaku role yang bukan miliknya.
  peminjam_id uuid not null default auth.uid() references profil(id),
  peminjam_role text not null default current_role_app()
    check (peminjam_role in ('admin','guru','kepsek')),
  qty int not null check (qty > 0),
  tanggal_pinjam date not null default current_date,
  tanggal_kembali_rencana date not null,
  tanggal_kembali_aktual date,
  status text not null default 'MENUNGGU'
    check (status in ('MENUNGGU','DIPINJAM','DITOLAK','DIKEMBALIKAN')),
  approver_id uuid references profil(id),
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_peminjaman_status on peminjaman(sekolah_id, status);
create index if not exists idx_peminjaman_aset on peminjaman(aset_id);
create index if not exists idx_peminjaman_jatuh_tempo on peminjaman(status, tanggal_kembali_rencana);

-- atas_nama: nama peminjam yang SEBENARNYA, dipakai kalau berbeda dari
-- pemilik akun yang mengajukan (mis. admin mengajukan atas permintaan
-- guru yang belum/tidak punya akun sendiri). Kalau kosong, yang
-- ditampilkan di UI adalah nama pemilik akun (peminjam_id). Sengaja bukan
-- kolom wajib dan bukan pengganti peminjam_id — peminjam_id tetap jadi
-- pihak yang "bertanggung jawab" secara akun/akses, atas_nama cuma info
-- tambahan siapa fisik yang pegang barangnya.
alter table peminjaman add column if not exists atas_nama text;

-- catatan_pengajuan / alasan_tolak: pisahan dari kolom `catatan` lama yang
-- dual-purpose — diisi peminjam saat ngajuin ("mis. keperluan rapat wali
-- murid"), TAPI ditimpa fn_reject_peminjaman dengan alasan tolak begitu
-- admin/kepsek nolak. Efeknya catatan pengajuan guru hilang, ketiban
-- alasan tolak. catatan_pengajuan cuma ditulis sekali saat insert (tidak
-- pernah disentuh lagi oleh fungsi manapun); alasan_tolak cuma ditulis
-- fn_reject_peminjaman saat reject. Keduanya independen, tidak saling timpa.
alter table peminjaman add column if not exists catatan_pengajuan text;
alter table peminjaman add column if not exists alasan_tolak text;

-- Migrasi satu-kali dari kolom `catatan` lama, guarded supaya aman di-
-- rerun (blok ini no-op begitu kolom `catatan` sudah tidak ada):
--   - status DITOLAK -> nilai `catatan` sekarang sudah ketiban alasan
--     tolak (bekas fn_reject_peminjaman lama), pindah ke alasan_tolak.
--     Catatan pengajuan ASLI guru untuk baris ini sudah keburu hilang di
--     desain lama sebelum migrasi ini ada — tidak bisa direcover, jadi
--     catatan_pengajuan-nya tetap null.
--   - status selain DITOLAK -> `catatan` belum pernah ditimpa, masih murni
--     catatan pengajuan, pindah apa adanya ke catatan_pengajuan.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'peminjaman' and column_name = 'catatan'
  ) then
    update peminjaman set alasan_tolak = catatan
      where status = 'DITOLAK' and catatan is not null and alasan_tolak is null;
    update peminjaman set catatan_pengajuan = catatan
      where status <> 'DITOLAK' and catatan is not null and catatan_pengajuan is null;
    -- peminjaman_dengan_status masih pakai p.* dari run schema.sql
    -- sebelumnya, jadi masih "nempel" ke kolom catatan lama sampai view
    -- itu di-drop+create ulang di bawah nanti. Drop dulu di sini supaya
    -- alter table drop column tidak diblokir dependency-nya (2BP01);
    -- create view-nya menyusul di section "View: status terlambat" di
    -- bawah, jadi aman, view tidak pernah hilang permanen.
    drop view if exists peminjaman_dengan_status;
    alter table peminjaman drop column catatan;
  end if;
end $$;

create table if not exists transaksi_log (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid not null default current_sekolah_id() references sekolah(id) on delete cascade,
  "timestamp" timestamptz not null default now(),
  type text not null check (type in ('APPROVE','REJECT','RETURN')),
  borrow_id uuid not null references peminjaman(borrow_id),
  aset_id uuid not null references aset(id),
  qty int not null,
  before_stock int not null,
  after_stock int not null,
  actor_id uuid not null default auth.uid() references profil(id),
  note text
);

create index if not exists idx_transaksi_log_borrow on transaksi_log(borrow_id);

drop trigger if exists trg_peminjaman_updated_at on peminjaman;
create trigger trg_peminjaman_updated_at
  before update on peminjaman
  for each row execute function set_updated_at();

-- --- RLS peminjaman ---
-- SELECT: semua role satu sekolah boleh lihat (guru perlu liat status
-- pengajuannya sendiri, admin/kepsek perlu liat semua buat approve).
-- INSERT: user cuma boleh insert dgn identitasnya sendiri & status awal
-- MENUNGGU (auto-approve tetap lewat fungsi SECURITY DEFINER, bukan
-- insert langsung status DIPINJAM).
-- UPDATE/DELETE: TIDAK ADA policy untuk role biasa sama sekali — satu-
-- satunya jalan ubah status adalah fn_approve/reject/return_peminjaman
-- di bawah (SECURITY DEFINER, jalan sebagai owner tabel, bypass RLS).
alter table peminjaman enable row level security;

drop policy if exists peminjaman_select on peminjaman;
create policy peminjaman_select on peminjaman
  for select using (sekolah_id = current_sekolah_id());

drop policy if exists peminjaman_insert on peminjaman;
create policy peminjaman_insert on peminjaman
  for insert with check (
    sekolah_id = current_sekolah_id()
    and peminjam_id = auth.uid()
    and peminjam_role = current_role_app()
    and status = 'MENUNGGU'
    -- aset_id wajib milik sekolah yang sama (foreign key saja tidak
    -- menjamin ini — bisa saja mengarah ke aset sekolah lain)
    and aset_id in (select id from aset where sekolah_id = current_sekolah_id())
  );

revoke update, delete on peminjaman from authenticated;

-- --- RLS transaksi_log ---
-- Read-only dari client, sama kayak log_aktivitas: audit trail tidak
-- boleh bisa diubah/dihapus lewat client, dan insert cuma lewat fungsi.
alter table transaksi_log enable row level security;

drop policy if exists transaksi_log_select on transaksi_log;
create policy transaksi_log_select on transaksi_log
  for select using (sekolah_id = current_sekolah_id());

revoke insert, update, delete on transaksi_log from authenticated;

-- --- View: status "terlambat" dihitung, BUKAN kolom yang disimpan ---
-- Kenapa dihitung: kalau disimpan sebagai kolom biasa, butuh cron/job
-- buat nyocokin tiap hari begitu tanggal_kembali_rencana lewat, dan
-- gampang basi/nggak sinkron. Dihitung on-the-fly di view selalu akurat
-- tanpa job tambahan. security_invoker=true supaya view tetap tunduk ke
-- RLS tabel peminjaman (bukan bypass sebagai owner).
--
-- terlambat punya 2 kasus:
--   - status DIPINJAM   -> dibandingkan ke HARI INI (belum dikembalikan,
--                          masih berjalan, jadi patokannya "sekarang")
--   - status DIKEMBALIKAN -> dibandingkan ke tanggal_kembali_aktual (SUDAH
--                          dikembalikan, jadi patokannya tanggal kembali
--                          yang sebenarnya, bukan hari ini — supaya
--                          histori "dulu telat berapa hari" tetap akurat
--                          walau dilihat bertahun-tahun kemudian)
--   - status MENUNGGU/DITOLAK -> selalu false, belum relevan
--
-- Sengaja DROP + CREATE (bukan CREATE OR REPLACE) karena view ini pakai
-- p.* — begitu ada kolom baru ditambahkan ke tabel peminjaman (mis.
-- atas_nama belakangan), posisi kolom "terlambat" di akhir ikut geser,
-- dan CREATE OR REPLACE VIEW menolak perubahan posisi/nama kolom. DROP
-- lalu CREATE lagi selalu aman dari masalah ini, jadi schema.sql tetap
-- bisa di-run ulang kapan pun ada kolom baru di peminjaman.
drop view if exists peminjaman_dengan_status;
create view peminjaman_dengan_status
with (security_invoker = true) as
select
  p.*,
  case
    when p.status = 'DIPINJAM' then p.tanggal_kembali_rencana < current_date
    when p.status = 'DIKEMBALIKAN' then p.tanggal_kembali_aktual > p.tanggal_kembali_rencana
    else false
  end as terlambat
from peminjaman p;

grant select on peminjaman_dengan_status to authenticated;

-- --- Fungsi: approve (manual oleh admin/kepsek ATAU auto saat admin/
--     kepsek jadi peminjam sendiri) ---
--
-- p_actor_id SENGAJA DIHAPUS dari parameter (bekas kesalahan desain: kalau
-- diterima sebagai argumen, siapa pun yang punya akses `execute` bisa
-- mengklaim jadi user lain dengan ngirim ID orang lain). Identitas aktor
-- SELALU diambil dari auth.uid() milik sesi yang benar-benar memanggil
-- fungsi ini, tidak bisa dipalsukan dari luar.
--
-- Cek sekolah aktor == sekolah peminjaman WAJIB di sini karena fungsi ini
-- SECURITY DEFINER (bypass RLS sepenuhnya) — tanpa cek ini, admin/kepsek
-- sekolah A yang tahu borrow_id sekolah B bisa approve/reject/return
-- punya sekolah lain.
create or replace function fn_approve_peminjaman(
  p_borrow_id uuid
) returns peminjaman
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row peminjaman%rowtype;
  v_stok_sekarang int;
  v_before int;
  v_after int;
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_actor_sekolah_id uuid;
begin
  -- Lock baris peminjaman: cegah approve dobel diklik/dipanggil bersamaan
  select * into v_row from peminjaman where borrow_id = p_borrow_id for update;
  if not found then
    raise exception 'PEMINJAMAN_NOT_FOUND';
  end if;

  if v_row.status <> 'MENUNGGU' then
    raise exception 'INVALID_STATUS: hanya status MENUNGGU yang bisa di-approve (status sekarang: %)', v_row.status;
  end if;

  select role, sekolah_id into v_actor_role, v_actor_sekolah_id from profil where id = v_actor_id;
  if v_actor_role not in ('admin','kepsek') then
    raise exception 'FORBIDDEN: hanya admin/kepsek yang boleh approve';
  end if;
  if v_actor_sekolah_id is distinct from v_row.sekolah_id then
    raise exception 'FORBIDDEN: beda sekolah';
  end if;
  -- CATATAN: sengaja TIDAK ada larangan "approve pengajuan sendiri" di sini.
  -- Approve pengajuan sendiri justru valid untuk 1 skenario: auto-approve
  -- saat admin/kepsek meminjam atas nama mereka sendiri (lihat requestBorrow
  -- di actions.ts, yang manggil fungsi ini persis dengan actor = peminjam).
  -- Guru sama sekali tidak bisa lolos guard role di atas, jadi tidak ada
  -- celah guru approve pengajuannya sendiri.

  -- Lock baris aset: baca stok versi terbaru, tahan sampai transaksi ini selesai
  select stok into v_stok_sekarang from aset where id = v_row.aset_id for update;
  if v_stok_sekarang is null then
    raise exception 'ASET_NOT_FOUND';
  end if;
  v_before := v_stok_sekarang;

  if v_stok_sekarang < v_row.qty then
    update peminjaman set status = 'DITOLAK', approver_id = v_actor_id, updated_at = now()
      where borrow_id = p_borrow_id returning * into v_row;
    insert into transaksi_log(sekolah_id, type, borrow_id, aset_id, qty, before_stock, after_stock, actor_id, note)
      values (v_row.sekolah_id, 'REJECT', p_borrow_id, v_row.aset_id, v_row.qty, v_before, v_before, v_actor_id, 'Stok tidak cukup');
    return v_row;
  end if;

  v_after := v_stok_sekarang - v_row.qty;
  update aset set stok = v_after where id = v_row.aset_id;
  update peminjaman set status = 'DIPINJAM', approver_id = v_actor_id, updated_at = now()
    where borrow_id = p_borrow_id returning * into v_row;
  insert into transaksi_log(sekolah_id, type, borrow_id, aset_id, qty, before_stock, after_stock, actor_id, note)
    values (v_row.sekolah_id, 'APPROVE', p_borrow_id, v_row.aset_id, v_row.qty, v_before, v_after, v_actor_id, null);

  return v_row;
end;
$$;

-- --- Fungsi: reject (stok tidak berubah, data tidak dihapus) ---
create or replace function fn_reject_peminjaman(
  p_borrow_id uuid,
  p_note text default null
) returns peminjaman
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row peminjaman%rowtype;
  v_stok_sekarang int;
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_actor_sekolah_id uuid;
begin
  select * into v_row from peminjaman where borrow_id = p_borrow_id for update;
  if not found then
    raise exception 'PEMINJAMAN_NOT_FOUND';
  end if;
  if v_row.status <> 'MENUNGGU' then
    raise exception 'INVALID_STATUS: hanya status MENUNGGU yang bisa ditolak (status sekarang: %)', v_row.status;
  end if;

  select role, sekolah_id into v_actor_role, v_actor_sekolah_id from profil where id = v_actor_id;
  if v_actor_role not in ('admin','kepsek') then
    raise exception 'FORBIDDEN: hanya admin/kepsek yang boleh reject';
  end if;
  if v_actor_sekolah_id is distinct from v_row.sekolah_id then
    raise exception 'FORBIDDEN: beda sekolah';
  end if;

  select stok into v_stok_sekarang from aset where id = v_row.aset_id;

  update peminjaman set status = 'DITOLAK', approver_id = v_actor_id, alasan_tolak = p_note, updated_at = now()
    where borrow_id = p_borrow_id returning * into v_row;
  insert into transaksi_log(sekolah_id, type, borrow_id, aset_id, qty, before_stock, after_stock, actor_id, note)
    values (v_row.sekolah_id, 'REJECT', p_borrow_id, v_row.aset_id, v_row.qty, v_stok_sekarang, v_stok_sekarang, v_actor_id, p_note);

  return v_row;
end;
$$;

-- --- Fungsi: return (hanya dari status DIPINJAM, cegah return dobel) ---
create or replace function fn_return_peminjaman(
  p_borrow_id uuid
) returns peminjaman
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row peminjaman%rowtype;
  v_before int;
  v_after int;
  v_actor_id uuid := auth.uid();
  v_actor_sekolah_id uuid;
begin
  select * into v_row from peminjaman where borrow_id = p_borrow_id for update;
  if not found then
    raise exception 'PEMINJAMAN_NOT_FOUND';
  end if;
  if v_row.status <> 'DIPINJAM' then
    raise exception 'INVALID_STATUS: hanya status DIPINJAM yang bisa dikembalikan (status sekarang: %)', v_row.status;
  end if;

  select sekolah_id into v_actor_sekolah_id from profil where id = v_actor_id;
  if v_actor_sekolah_id is distinct from v_row.sekolah_id then
    raise exception 'FORBIDDEN: beda sekolah';
  end if;

  select stok into v_before from aset where id = v_row.aset_id for update;
  v_after := v_before + v_row.qty;

  update aset set stok = v_after where id = v_row.aset_id;
  update peminjaman set status = 'DIKEMBALIKAN', tanggal_kembali_aktual = current_date, updated_at = now()
    where borrow_id = p_borrow_id returning * into v_row;
  insert into transaksi_log(sekolah_id, type, borrow_id, aset_id, qty, before_stock, after_stock, actor_id, note)
    values (v_row.sekolah_id, 'RETURN', p_borrow_id, v_row.aset_id, v_row.qty, v_before, v_after, v_actor_id, null);

  return v_row;
end;
$$;

grant execute on function fn_approve_peminjaman(uuid) to authenticated;
grant execute on function fn_reject_peminjaman(uuid, text) to authenticated;
grant execute on function fn_return_peminjaman(uuid) to authenticated;

-- ============================================================
-- kode_lokasi sekolah — dipakai di kop cetak Kartu Inventaris
-- Barang (KIB) format dinas, mis. "12.13.28.08.07.03.49". Nullable
-- karena sekolah lama belum tentu langsung isi pas migrasi jalan.
-- ============================================================
alter table sekolah add column if not exists kode_lokasi text;

-- ============================================================
-- Approval pendaftaran sekolah DICABUT — sekolah yang daftar sekarang
-- langsung 'aktif' (lihat app/onboarding/actions.ts). Status sekolah
-- disederhanakan jadi cuma 2 nilai: 'aktif' / 'nonaktif' (dipakai super
-- admin buat suspend sekolah spam/abuse, lihat app/super-admin/actions.ts).
-- Migrasi data lama: yang masih 'menunggu_approval' otomatis diaktifkan
-- (bukan dihilangkan), yang dulu 'ditolak' dipetakan ke 'nonaktif' (setara
-- suspend) supaya tetap gak bisa masuk tapi juga gak hilang dari radar.
-- ============================================================
alter table sekolah add column if not exists alasan_nonaktif text;

update sekolah set status = 'aktif' where status = 'menunggu_approval';
update sekolah
  set status = 'nonaktif', alasan_nonaktif = coalesce(alasan_nonaktif, ditolak_alasan)
  where status = 'ditolak';

alter table sekolah drop constraint if exists sekolah_status_check;
alter table sekolah add constraint sekolah_status_check
  check (status in ('aktif','nonaktif'));

-- Kolom peninggalan alur approval lama — udah gak dipakai kode manapun,
-- dan alasan penolakan yang relevan udah dipindah ke `alasan_nonaktif`
-- di atas. Dihapus permanen di sini (bukan sekadar dibiarin nganggur).
alter table sekolah drop column if exists disetujui_at;
alter table sekolah drop column if exists ditolak_alasan;

-- View ringkasan lintas-tenant buat halaman Data Sekolah super admin —
-- satu query, bukan N+1 (hitung jumlah aset & user per sekolah langsung
-- di database). Cuma boleh diakses lewat service role (super admin),
-- makanya gak perlu RLS/policy tambahan di sini.
create or replace view sekolah_ringkasan as
select
  s.id,
  s.nama,
  s.npsn,
  s.alamat,
  s.status,
  s.alasan_nonaktif,
  s.created_at,
  s.kode_lokasi,
  (select count(*) from aset a where a.sekolah_id = s.id) as jumlah_aset,
  (select count(*) from profil p where p.sekolah_id = s.id) as jumlah_user
from sekolah s;

-- Pengumuman dari super admin (developer platform) ke sekolah — broadcast
-- ke SATU sekolah (sekolah_id terisi) atau ke SEMUA sekolah sekaligus
-- (sekolah_id NULL). Insert/update/delete cuma lewat service role (super
-- admin), makanya cuma ada policy SELECT di bawah.
create table if not exists pengumuman_platform (
  id uuid primary key default gen_random_uuid(),
  sekolah_id uuid references sekolah(id) on delete cascade,
  judul text not null,
  isi text not null,
  created_at timestamptz default now()
);

create index if not exists idx_pengumuman_sekolah on pengumuman_platform(sekolah_id);
create index if not exists idx_pengumuman_created on pengumuman_platform(created_at desc);

alter table pengumuman_platform enable row level security;

drop policy if exists pengumuman_select_tenant on pengumuman_platform;
create policy pengumuman_select_tenant on pengumuman_platform for select
  to authenticated
  using (sekolah_id = current_sekolah_id() or sekolah_id is null);
