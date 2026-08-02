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
