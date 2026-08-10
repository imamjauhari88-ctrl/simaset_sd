# SIMASET SD — Sistem Inventaris Aset Sekolah

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase (DB & Auth)
+ Cloudinary (foto) + Zod + React Hook Form + TanStack Query. Multi-tenant:
satu instance app bisa dipakai banyak sekolah, data terisolasi lewat RLS.

## Cara jalan

```bash
npm install
cp .env.local.example .env.local   # isi semua variabel, lihat penjelasan di bawah
npm run dev
```

Jalankan `supabase/schema.sql` di SQL Editor project Supabase kamu untuk
membuat semua tabel + Row Level Security. File ini aman dijalankan ulang
kapan pun — di database baru maupun yang sudah pernah menjalankannya
sebelumnya — jadi kalau ada pembaruan skema di masa depan, cukup jalankan
ulang file ini, nggak perlu khawatir ada yang tabrakan atau ketinggalan.

## Environment variables

| Variabel | Dari mana | Dipakai untuk |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Client & server Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sda | Client & server Supabase (tunduk RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | sda | **Server-only.** Bypass RLS untuk onboarding sekolah baru & terima undangan (lihat bagian Multi-tenant) |
| `SESSION_SECRET` | generate sendiri, min. 32 karakter (`openssl rand -base64 32`) | Menandatangani token link undangan pengguna |
| `NEXT_PUBLIC_APP_URL` | URL deploy kamu | Base URL link undangan + metadata PWA |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary Dashboard | Unsigned upload foto aset langsung dari browser — lihat "Setup Cloudinary" di bawah |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary Dashboard → halaman utama Dashboard (bukan Upload preset) | **Server-only.** Signed request untuk hapus foto lama saat foto aset diganti/dihapus — destroy Cloudinary wajib signed, beda dari upload di atas yang unsigned |
| `SUPER_ADMIN_EMAILS` | isi sendiri, email developer/pemilik platform (pisah koma kalau lebih dari satu) | **Server-only.** Akses `/super-admin` — lintas-tenant, di luar sistem role `profil` biasa. Lihat "Panel Super Admin" di bawah cara bikin akunnya |

## Setup Cloudinary (unsigned upload)

Upload foto aset jalan langsung dari browser ke Cloudinary, tanpa lewat
server dulu — makanya nggak butuh API secret sama sekali. Yang menjaga
keamanannya adalah **upload preset** yang kamu konfigurasi di Cloudinary
Dashboard, bukan kode aplikasi:

1. Cloudinary Dashboard → **Settings → Upload** → scroll ke *Upload presets*
   → **Add upload preset**
2. **Signing Mode**: pilih **Unsigned**
3. Kasih nama preset-nya (mis. `simaset-aset-unsigned`), ini yang dipakai
   sebagai `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
4. Batasi biar nggak disalahgunakan orang yang nemu nama preset-nya:
   - **Folder**: kunci ke folder tertentu (mis. `simaset/`)
   - **Allowed formats**: `jpg, png, webp` — cukup foto
   - **Max file size**: mis. 5 MB
   - (Opsional) **Eager transformations**: auto-resize/compress

⚠️ Trade-off dibanding versi signed sebelumnya: siapa pun yang tahu
`cloud_name` + `upload_preset` (kelihatan di Network tab browser) bisa
upload file ke akun Cloudinary kamu selama masih sesuai batasan preset di
atas. Untuk aplikasi internal sekolah risikonya rendah, tapi batasan
**Folder / Allowed formats / Max file size** wajib diisi, jangan
dikosongin.

Folder Cloudinary saat ini sama rata untuk semua sekolah
(`simaset/aset`), bukan per-`sekolah_id` seperti versi signed sebelumnya
— ini cuma soal rapi-rapi folder, **bukan** celah keamanan data, karena
baris `aset` di database tetap terisolasi per sekolah lewat RLS terlepas
dari di folder Cloudinary mana fotonya disimpan.

## Struktur folder

```
app/
  layout.tsx, globals.css     # font Fraunces+Inter+JetBrains Mono, design tokens Tailwind v4
  providers.tsx                # QueryClientProvider (TanStack Query)
  register-service-worker.tsx  # daftarkan public/sw.js (PWA)
  manifest.ts                  # Web App Manifest native Next.js
  page.tsx                     # redirect ke /dashboard
  login/                        # + loading.tsx, panel dua-sisi (form + PanelBrand)
  lupa-sandi/                   # minta link reset password (supabase resetPasswordForEmail)
  reset-sandi/                  # set password baru — dicapai lewat /auth/callback
  onboarding/                   # bikin sekolah baru → jadi admin pertama
  undangan/[token]/             # terima undangan → signup + join sekolah
  akun-nonaktif/                # ditampilkan kalau sekolah user login berstatus nonaktif
  auth/callback/                # exchange kode PKCE dari email Supabase (reset password dst) jadi sesi
  (dashboard)/                 # route group, semua halaman pakai sidebar & topbar
    dashboard/page.tsx          # stat cards, chart kondisi/tren/nilai&jumlah per kategori, activity log
    aset/                       # Data Aset — CRUD, tambah-massal/, [id]/ (detail+riwayat)
    kategori/ ruangan/ mutasi/ pemeliharaan/
    opname/                     # mulai sesi + scan, riwayat/ (sesi yang sudah selesai)
    laporan/                    # KIB/KIR/Mutasi — cetak & export Excel
    pengaturan/                 # Info Sekolah, Undang Pengguna, Manajemen Pengguna (daftar+ubah role+cabut akses)
  super-admin/                  # panel developer, lintas-tenant — lihat "Panel Super Admin" di bawah
  api/
    laporan/export/{kib,kir,mutasi}/  # route handler generate .xlsx (paket `xlsx`)
    super-admin/export/ringkasan/     # export data ringkasan platform

components/
  layout/       # Sidebar, Topbar, Footer, NotifikasiDropdown, TopbarSearch
  dashboard/    # StatCard, WelcomeBanner, KondisiChart, TrenChart, NilaiKategoriChart, JumlahKategoriChart, ActivityLog
  aset/         # TabelAset, FormAset & FormAsetMassal (RHF+Zod), FotoAsetInput, RiwayatAset
  onboarding/   # OnboardingForm (client, dipisah dari page.tsx server)
  undangan/     # UndanganForm
  super-admin/  # komponen khusus panel developer (tabel-sekolah, tabel-user-global, tabel-aset-global, grafik-*, dll)
  ui/           # EmptyState, ErrorState, NotFoundState, Modal, Skeleton (+varian per-bentuk halaman), PanelBrand

lib/
  env.ts                  # validasi semua env var pakai Zod, gagal cepat kalau ada yang kosong
  cloudinary-upload.ts     # hook client untuk upload foto (unsigned, langsung ke Cloudinary, progress asli via XHR)
  cloudinary-server.ts     # signed request hapus foto lama
  format.ts                # formatRupiah, labelKondisi, formatTanggalSingkat, dst
  laporan-excel.ts         # generator .xlsx (SheetJS) buat export Laporan
  validasi/                # skema Zod per form (aset.ts, aset-massal.ts, peminjaman.ts, dst)
  queries/                 # SEMUA "use client" — hooks TanStack Query (query+mutation) per domain
  super-admin.ts           # isSuperAdminEmail() — cek email lawan SUPER_ADMIN_EMAILS
  super-admin-guard.ts     # requireSuperAdmin() — dipanggil di tiap page/action /super-admin
  supabase/
    client.ts / server.ts   # client Supabase biasa, tunduk RLS
    service.ts               # SERVICE ROLE, bypass RLS — onboarding/undangan/super-admin (lintas-tenant)
    middleware.ts            # dipakai proxy.ts: cek auth, status sekolah, jalur khusus super admin
    queries.ts                # fetch data sisi server (SSR) untuk halaman tenant
    super-admin-queries.ts    # fetch data sisi server LINTAS-TENANT, khusus /super-admin
  tenant/
    context.ts               # getProfilSaya() — ambil sekolah_id + role user login
    undangan.ts               # sign/verify token undangan pakai SESSION_SECRET (jose)

proxy.ts     # Next.js 16 mengganti middleware.ts → proxy.ts (middleware.ts lama
             # tidak lagi dijalankan sama sekali, jadi jangan dipakai lagi)

types/database.ts   # tipe TypeScript: Sekolah, Profil, Aset, dst.
supabase/schema.sql  # DDL + RLS multi-tenant
public/sw.js          # service worker manual (lihat catatan PWA di bawah)
```

## Alur multi-tenant

Isolasi data antar sekolah ditegakkan di level **database (RLS)**, bukan di
kode aplikasi — jadi query biasa (`supabase.from('aset').select()`) otomatis
cuma mengembalikan baris sekolah user yang login, dan `insert` otomatis
keisi `sekolah_id` yang benar lewat kolom default `current_sekolah_id()`.
Kode di `lib/supabase/queries.ts` / `lib/queries/aset.ts` sengaja **tidak**
pernah menyebut `sekolah_id` secara eksplisit.

Dua jalur user bisa "masuk" ke sebuah sekolah:

1. **Onboarding** (`/onboarding`) — user baru signup tanpa undangan, isi
   nama sekolah → jadi admin pertama. Perlu `SUPABASE_SERVICE_ROLE_KEY`
   karena saat itu dia belum punya baris `profil` sama sekali (belum lolos
   RLS mana pun).
2. **Undangan** (`/undangan/[token]`) — admin generate link dari halaman
   Pengaturan (token ditandatangani `SESSION_SECRET`, berlaku 7 hari),
   guru/staf lain buka link → signup → langsung ke-assign ke sekolah &
   role yang sama dengan yang diundang. **Sekali pakai**: setiap link
   punya baris `undangan` di database, dan `dipakai_at`-nya diklaim
   secara atomik (`update ... where dipakai_at is null`) tepat sebelum
   akun dibuat — jadi kalau link ke-forward/bocor, cuma orang pertama
   yang sempat submit form yang bisa masuk; percobaan berikutnya dengan
   link yang sama otomatis ditolak. Kalau pembuatan akun gagal di
   tengah jalan, klaimnya dilepas lagi supaya link masih bisa dicoba
   ulang.

`proxy.ts` mengarahkan user yang sudah login tapi belum punya `profil` ke
`/onboarding` secara otomatis, dan ke `/akun-nonaktif` kalau sekolahnya
berstatus `nonaktif` (lihat "Panel Super Admin" di bawah).

**Lupa password** (`/lupa-sandi` → `/auth/callback` → `/reset-sandi`) pakai
`supabase.auth.resetPasswordForEmail()` bawaan Supabase — bukan jalur
"masuk ke sekolah", tapi disebut di sini karena satu keluarga sama
login/onboarding/undangan (layout dua-panel yang sama, `PanelBrand`).
Pesan yang ditampilkan ke user SELALU sama persis baik emailnya beneran
terdaftar atau enggak, biar gak ada celah user enumeration.

## Catatan PWA

Awalnya dicoba pakai Serwist, tapi **belum kompatibel dengan Turbopack**
(builder default Next.js 16) — build-nya gagal. Solusinya `public/sw.js`
ditulis manual (cache-first untuk asset statis, network-first untuk
halaman) tanpa bergantung ke plugin build apa pun. `app/manifest.ts` pakai
Web App Manifest native Next.js, dengan `public/icon-192.png` &
`public/icon-512.png` (di-generate dari `public/icon.svg` pakai
`rsvg-convert`, desain sama) untuk `purpose: "any"` maupun `"maskable"` —
`icon.svg` tetap dipertahankan sebagai entri tambahan `sizes: "any"` biar
browser yang dukung SVG icon bisa pakai versi vektornya.

## Panel Super Admin

`/super-admin` — dashboard developer platform, **di luar** sistem role
`profil` per-sekolah biasa. Siapa yang boleh masuk ditentukan dari env var
`SUPER_ADMIN_EMAILS` (`lib/super-admin.ts`), dicek ulang di tiap
page/action lewat `requireSuperAdmin()` (`lib/super-admin-guard.ts`)
selain dijaga juga di `proxy.ts` — bukan lewat RLS, karena fitur ini
justru butuh baca data LINTAS semua sekolah (pakai `createServiceClient()`
di `lib/supabase/super-admin-queries.ts`, bypass RLS dengan sengaja).

**Cara bikin akun super admin pertama kali** — gak ada jalur self-register
buat ini (onboarding selalu bikin sekolah baru):
1. Supabase Dashboard → **Authentication → Users → Add User** — isi email
   & password sendiri. **Jangan** daftar lewat `/onboarding`.
2. Masukkan email itu ke `SUPER_ADMIN_EMAILS` (pisah koma kalau lebih dari
   satu).
3. Login seperti biasa lewat `/login` — otomatis diarahkan ke
   `/super-admin`, bukan dashboard sekolah manapun.

Halaman yang ada di dalamnya:
- **Dashboard** (`/super-admin`) — ringkasan: total sekolah, total aset,
  total user, grafik sekolah paling aktif.
- **Analitik** — laporan penggunaan fitur & aset lintas sekolah, bisa
  difilter per sekolah.
- **Sekolah** — daftar semua sekolah + detail per sekolah (stat & chart
  kondisi asetnya), termasuk aksi nonaktifkan/aktifkan.
- **Aset** & **User** — tabel lintas-tenant, bisa cari & filter per
  sekolah.

Sekolah yang di-nonaktifkan (kolom `sekolah.status`) langsung ke-block
akses ke semua data-nya lewat `proxy.ts` (dialihkan ke `/akun-nonaktif`)
— bukan dihapus datanya, cuma dikunci aksesnya, bisa diaktifkan lagi
kapan pun dari `/super-admin/sekolah`.

## Catatan keamanan

⚠️ Next.js 16.0.0 punya kerentanan kritis (CVE-2025-66478, RCE di App
Router). `package.json` sudah dikunci ke `^16.0.7` (patched) — jangan
downgrade ke 16.0.0.

## Status per menu

**Data Aset**: lengkap — list+filter+search, tambah (satuan & massal,
generate kode berurutan otomatis), edit, upload foto Cloudinary
(unsigned, progress asli), validasi Zod+RHF, sinkron TanStack Query,
riwayat per aset (mutasi+pemeliharaan+peminjaman dalam satu timeline),
cetak label QR (satu/pilih beberapa/semua sekaligus).
**Kategori Barang** & **Ruangan / Lokasi**: lengkap — CRUD via modal
(tambah/edit/hapus), reusable di `components/kategori/` & `components/ruangan/`.
**Mutasi Aset** & **Pemeliharaan**: lengkap — manager + form (RHF+Zod)
sendiri-sendiri, pola sama dengan `components/aset/`.
**Opname Fisik**: lengkap — mulai sesi, scan QR pakai kamera HP (jsQR,
tanpa lib berat), progress real-time, ringkasan aset yang belum discan
pas sesi ditutup, plus riwayat sesi yang sudah selesai (bisa dilihat
lagi kapan pun, gak cuma sekali muncul pas sesi ditutup).
**Pengaturan**: Undang Pengguna (link sekali pakai, lihat "Alur
multi-tenant" di atas) dan Manajemen Pengguna (daftar semua pengguna
satu sekolah, admin bisa ubah role atau cabut akses).
**Laporan**: lengkap — KIB (per kategori), KIR (per ruangan), Laporan
Mutasi (per tahun), bisa dicetak langsung (browser print) atau di-export
ke Excel (`lib/laporan-excel.ts`, paket `xlsx`).

> **Catatan:** menu **Penghapusan Aset** sengaja tidak ada di aplikasi
> ini — persetujuan penghapusan/write-off aset itu ranah Dinas
> Pendidikan, di luar cakupan aplikasi inventaris internal sekolah ini.

## Fitur QR (label & scan)

- **Cetak label**: `/cetak/aset/[id]` (satu aset) dan `/cetak/aset/semua`
  (semua aset, grid siap print). QR digenerate di server (`lib/qr-label.ts`,
  paket `qrcode`) — isi QR-nya cuma `kode_aset` polos, jadi tetap kebaca
  meski offline.
- **Scan opname**: `components/opname/qr-scanner.tsx` pakai `jsqr` +
  `getUserMedia` langsung (tanpa library scanner pihak ketiga yang berat).
  Kode yang discan dicocokkan ke tabel `aset` — otomatis cuma nemu aset
  sekolah sendiri karena RLS.
- **Hapus foto lama otomatis**: begitu foto aset diganti (atau dihapus
  tanpa foto baru), `foto_public_id` versi LAMA dihapus dari Cloudinary
  lewat signed request (`lib/cloudinary-server.ts` +
  `lib/aset/actions.ts`), dipanggil dari `FormAset` SETELAH baris `aset`
  sukses ter-update — supaya kalau update-nya gagal, foto lama yang masih
  dipakai baris itu tidak ikut terhapus. Non-blocking: gagal hapus foto
  lama cuma jadi orphan file di Cloudinary (buang-buang storage), bukan
  data aset yang salah, jadi tidak mengganggu alur simpan aset.
- Sesi opname (`opname_sesi` + `opname_detail`) satu sekolah cuma boleh
  punya satu sesi `berlangsung` dalam satu waktu — ditegakkan di kode
  app (`OpnameManager`), bukan constraint database.
