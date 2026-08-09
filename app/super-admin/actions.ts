"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/super-admin-guard";
import { createServiceClient } from "@/lib/supabase/service";

/** Nonaktifkan sekolah — dipakai kalau ada indikasi spam/abuse. Semua user
 * di sekolah ini bakal dilempar ke /akun-nonaktif begitu buka aplikasi
 * lagi (lihat lib/supabase/middleware.ts). */
export async function suspendSekolah(sekolahId: string, alasan: string) {
  await requireSuperAdmin();

  if (!alasan.trim()) {
    throw new Error("Alasan suspend wajib diisi.");
  }

  const service = createServiceClient();
  const { error } = await service
    .from("sekolah")
    .update({ status: "nonaktif", alasan_nonaktif: alasan.trim() })
    .eq("id", sekolahId);

  if (error) throw new Error(error.message);

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/sekolah");
}

/** Kembalikan akses sekolah yang sebelumnya di-suspend. */
export async function aktifkanKembaliSekolah(sekolahId: string) {
  await requireSuperAdmin();

  const service = createServiceClient();
  const { error } = await service
    .from("sekolah")
    .update({ status: "aktif", alasan_nonaktif: null })
    .eq("id", sekolahId);

  if (error) throw new Error(error.message);

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/sekolah");
}

/** Broadcast pengumuman ke satu sekolah tertentu, atau ke SEMUA sekolah
 * kalau sekolahId-nya null. Tampil di sisi tenant lewat PengumumanBanner
 * (components/layout/pengumuman-banner.tsx). */
export async function kirimPengumuman(
  sekolahId: string | null,
  judul: string,
  isi: string
) {
  await requireSuperAdmin();

  if (!judul.trim() || !isi.trim()) {
    throw new Error("Judul dan isi pengumuman wajib diisi.");
  }

  const service = createServiceClient();
  const { error } = await service.from("pengumuman_platform").insert({
    sekolah_id: sekolahId,
    judul: judul.trim(),
    isi: isi.trim(),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/super-admin/sekolah");
}

// ============================================================
// MODUL 3 — MANAJEMEN ASET GLOBAL (read-only + filter lintas tenant)
// ============================================================
// Server actions (bukan lib/queries biasa) karena tabel client-side
// filter/search/pagination-nya butuh manggil service client (bypass RLS
// tenant) langsung dari komponen client — satu-satunya cara aman buat
// itu di Next.js adalah lewat server action, bukan query Supabase biasa
// di browser (yang keblokir RLS) atau lib "server-only" (gak bisa
// dipanggil dari client component).

export interface AsetGlobalRow {
  id: string;
  kode_aset: string;
  nama: string;
  merk_tipe: string | null;
  kondisi: "baik" | "rusak_ringan" | "rusak_berat";
  tahun_perolehan: number | null;
  harga_perolehan: number;
  created_at: string;
  updated_at: string;
  sekolah: { id: string; nama: string } | null;
  kategori: { nama: string } | null;
  ruangan: { nama: string } | null;
}

export interface CariAsetGlobalParams {
  q?: string;
  sekolahId?: string;
  kategoriNama?: string;
  kondisi?: string;
  page: number;
  pageSize: number;
}

/** Pencarian + filter aset lintas SEMUA tenant, read-only. Dipakai di
 * /super-admin/aset — super admin CUMA BISA LIHAT, gak ada tombol
 * edit/hapus di UI-nya sama sekali (bukan cuma disembunyikan, memang
 * gak dibikin actionnya). */
export async function cariAsetGlobal(
  params: CariAsetGlobalParams
): Promise<{ data: AsetGlobalRow[]; count: number }> {
  await requireSuperAdmin();
  const service = createServiceClient();

  const perluInnerKategori = !!params.kategoriNama;

  let query = service
    .from("aset")
    .select(
      `id, kode_aset, nama, merk_tipe, kondisi, tahun_perolehan, harga_perolehan, created_at, updated_at,
       sekolah:sekolah_id ( id, nama ),
       kategori:kategori_id${perluInnerKategori ? "!inner" : ""} ( nama ),
       ruangan:ruangan_id ( nama )`,
      { count: "exact" }
    );

  const q = (params.q ?? "").trim().replace(/[%,]/g, "");
  if (q) {
    query = query.or(`nama.ilike.%${q}%,kode_aset.ilike.%${q}%,merk_tipe.ilike.%${q}%`);
  }
  if (params.sekolahId) query = query.eq("sekolah_id", params.sekolahId);
  if (params.kategoriNama) query = query.eq("kategori.nama", params.kategoriNama);
  if (params.kondisi && params.kondisi !== "semua") {
    query = query.eq("kondisi", params.kondisi);
  }

  const dari = (Math.max(1, params.page) - 1) * params.pageSize;
  const sampai = dari + params.pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(dari, sampai);

  if (error) throw new Error(error.message);

  return { data: (data ?? []) as unknown as AsetGlobalRow[], count: count ?? 0 };
}

/** Opsi buat dropdown filter "By Tenant" & "By Kategori" — kategori
 * diambil sebagai NAMA unik (bukan id), karena kategori itu data
 * per-tenant sendiri-sendiri (tiap sekolah bikin kategorinya masing-
 * masing), jadi id-nya beda-beda walau nama & maksudnya sama. */
export async function getOpsiFilterAsetGlobal(): Promise<{
  tenant: { id: string; nama: string }[];
  kategoriNama: string[];
}> {
  await requireSuperAdmin();
  const service = createServiceClient();

  const [sekolahRes, kategoriRes] = await Promise.all([
    service.from("sekolah").select("id, nama").order("nama"),
    service.from("kategori_aset").select("nama"),
  ]);

  const kategoriUnik = Array.from(
    new Set((kategoriRes.data ?? []).map((k) => k.nama))
  ).sort((a, b) => a.localeCompare(b, "id"));

  return {
    tenant: sekolahRes.data ?? [],
    kategoriNama: kategoriUnik,
  };
}

export interface LaporanAsetGlobal {
  kategoriPalingRusak: { nama: string; jumlah: number }[];
  totalMenganggur: number;
  contohMenganggur: {
    kode_aset: string;
    nama: string;
    sekolah: string;
    updated_at: string;
  }[];
}

/** "Aset paling banyak rusak" & "Aset menganggur > 1 tahun" — dua
 * laporan ringkas lintas tenant. "Menganggur" didekati dari
 * `updated_at` yang lebih dari 1 tahun (gak ada perubahan/aktivitas
 * apapun ke baris asetnya) karena sistem ini belum punya tracking
 * "terakhir dipakai" yang eksplisit. */
export async function getLaporanAsetGlobal(): Promise<LaporanAsetGlobal> {
  await requireSuperAdmin();
  const service = createServiceClient();

  const setahunLalu = new Date();
  setahunLalu.setFullYear(setahunLalu.getFullYear() - 1);

  const [rusakRes, menganggurCountRes, menganggurContohRes] = await Promise.all([
    service
      .from("aset")
      .select("kategori:kategori_id ( nama )")
      .in("kondisi", ["rusak_ringan", "rusak_berat"]),
    service
      .from("aset")
      .select("id", { count: "exact", head: true })
      .lt("updated_at", setahunLalu.toISOString()),
    service
      .from("aset")
      .select("kode_aset, nama, updated_at, sekolah:sekolah_id ( nama )")
      .lt("updated_at", setahunLalu.toISOString())
      .order("updated_at", { ascending: true })
      .limit(8),
  ]);

  const jumlahPerKategori = new Map<string, number>();
  for (const row of (rusakRes.data ?? []) as unknown as { kategori: { nama: string } | null }[]) {
    const nama = row.kategori?.nama ?? "Tanpa Kategori";
    jumlahPerKategori.set(nama, (jumlahPerKategori.get(nama) ?? 0) + 1);
  }
  const kategoriPalingRusak = Array.from(jumlahPerKategori.entries())
    .map(([nama, jumlah]) => ({ nama, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 6);

  const contohMenganggur = (
    (menganggurContohRes.data ?? []) as unknown as {
      kode_aset: string;
      nama: string;
      updated_at: string;
      sekolah: { nama: string } | null;
    }[]
  ).map((r) => ({
    kode_aset: r.kode_aset,
    nama: r.nama,
    sekolah: r.sekolah?.nama ?? "—",
    updated_at: r.updated_at,
  }));

  return {
    kategoriPalingRusak,
    totalMenganggur: menganggurCountRes.count ?? 0,
    contohMenganggur,
  };
}

// ============================================================
// MODUL 4 — MANAJEMEN USER GLOBAL
// ============================================================

export interface UserGlobalRow {
  id: string;
  nama: string;
  role: "admin" | "guru" | "kepsek";
  email: string | null;
  sekolah: { id: string; nama: string } | null;
  created_at: string;
  lastSignInAt: string | null;
  banned: boolean;
}

export interface CariUserGlobalParams {
  q?: string;
  sekolahId?: string;
  role?: string;
  page: number;
  pageSize: number;
}

/** Daftar semua user lintas tenant dengan label "Asal Sekolah" + status
 * login/ban. Pencarian cuma di `nama` (kolom asli di tabel `profil`) —
 * email TIDAK bisa di-search di level database karena email itu milik
 * auth.users, bukan `profil`, dan Admin API Supabase gak nyediain
 * pencarian teks bebas di situ (cuma pagination). Email tetap
 * ditampilkan di kolom tabel, cuma gak bisa jadi kata kunci pencarian. */
export async function cariUserGlobal(
  params: CariUserGlobalParams
): Promise<{ data: UserGlobalRow[]; count: number }> {
  await requireSuperAdmin();
  const service = createServiceClient();

  let query = service
    .from("profil")
    .select("id, nama, role, created_at, sekolah:sekolah_id ( id, nama )", {
      count: "exact",
    });

  const q = (params.q ?? "").trim().replace(/[%,]/g, "");
  if (q) query = query.ilike("nama", `%${q}%`);
  if (params.sekolahId) query = query.eq("sekolah_id", params.sekolahId);
  if (params.role) query = query.eq("role", params.role);

  const dari = (Math.max(1, params.page) - 1) * params.pageSize;
  const sampai = dari + params.pageSize - 1;

  const { data: profilList, error, count } = await query
    .order("created_at", { ascending: false })
    .range(dari, sampai);

  if (error) throw new Error(error.message);

  // Data auth (email, login terakhir, status ban) cuma diambil buat
  // baris yang lagi ditampilkan di halaman ini — bukan semua user
  // sekaligus, biar tetap ringan walau usernya ribuan.
  const hasil = await Promise.all(
    (profilList ?? []).map(async (p) => {
      const { data: authUser } = await service.auth.admin.getUserById(p.id);
      return {
        id: p.id,
        nama: p.nama,
        role: p.role as "admin" | "guru" | "kepsek",
        sekolah: p.sekolah as unknown as { id: string; nama: string } | null,
        created_at: p.created_at,
        email: authUser.user?.email ?? null,
        lastSignInAt: authUser.user?.last_sign_in_at ?? null,
        banned:
          !!authUser.user?.banned_until &&
          new Date(authUser.user.banned_until) > new Date(),
      };
    })
  );

  return { data: hasil, count: count ?? 0 };
}

/** Ban user secara global — dia gak bisa login lagi ke sekolah manapun
 * (bukan cuma di-suspend dari 1 tenant, karena satu akun Supabase Auth
 * di sistem ini emang cuma nempel ke SATU sekolah). Durasi dibuat sangat
 * panjang (~100 tahun) buat mensimulasikan "permanen", karena Supabase
 * Admin API gak punya opsi ban selama-lamanya secara eksplisit. */
export async function banUserGlobal(userId: string) {
  await requireSuperAdmin();
  const service = createServiceClient();

  const { error } = await service.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/super-admin/user");
}

/** Cabut ban — user bisa login lagi. */
export async function unbanUserGlobal(userId: string) {
  await requireSuperAdmin();
  const service = createServiceClient();

  const { error } = await service.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/super-admin/user");
}

// ============================================================
// MODUL 5 — ANALITIK & LAPORAN
// ============================================================
// CATATAN JUJUR soal "Laporan Keuangan (MRR/Churn/Trial)": sistem ini
// BELUM PUNYA billing/subscription/paket sama sekali — gak ada tabel
// langganan, gak ada tanggal trial, gak ada catatan pembayaran. Jadi
// nomor MRR/Churn/Trial TIDAK dibikin di sini (kalau dipaksain, itu cuma
// angka karangan yang menyesatkan). Begitu ada sistem billing beneran,
// laporan ini baru bisa dibangun dari data sungguhan.

export interface PenggunaanFiturItem {
  fitur: string;
  jumlah30HariTerakhir: number;
}

/** Proxy "fitur paling sering dipakai" — dihitung dari JUMLAH BARIS BARU
 * yang dibuat di 30 hari terakhir per modul, lintas SEMUA tenant (atau
 * satu sekolah tertentu kalau `sekolahId` diisi). Bukan click-tracking
 * beneran (sistem ini gak punya event log/analytics), tapi paling deket
 * yang bisa dihitung dari data yang ada: modul yang sering dipakai ya
 * modul yang sering ada aktivitas baru. */
export async function getLaporanPenggunaanFitur(
  sekolahId?: string
): Promise<PenggunaanFiturItem[]> {
  await requireSuperAdmin();
  const service = createServiceClient();

  const bulanLalu = new Date();
  bulanLalu.setDate(bulanLalu.getDate() - 30);
  const sejak = bulanLalu.toISOString();

  function query(tabel: string) {
    let q = service.from(tabel).select("id", { count: "exact", head: true }).gte("created_at", sejak);
    if (sekolahId) q = q.eq("sekolah_id", sekolahId);
    return q;
  }

  const [aset, mutasi, peminjaman, pemeliharaan, opname] = await Promise.all([
    query("aset"),
    query("mutasi_aset"),
    query("peminjaman"),
    query("pemeliharaan_aset"),
    query("opname_sesi"),
  ]);

  return [
    { fitur: "Data Aset", jumlah30HariTerakhir: aset.count ?? 0 },
    { fitur: "Mutasi Aset", jumlah30HariTerakhir: mutasi.count ?? 0 },
    { fitur: "Peminjaman", jumlah30HariTerakhir: peminjaman.count ?? 0 },
    { fitur: "Pemeliharaan", jumlah30HariTerakhir: pemeliharaan.count ?? 0 },
    { fitur: "Opname Fisik", jumlah30HariTerakhir: opname.count ?? 0 },
  ].sort((a, b) => b.jumlah30HariTerakhir - a.jumlah30HariTerakhir);
}

export interface LaporanAsetRingkas {
  totalNilaiAset: number;
  kategoriTerpopuler: { nama: string; jumlah: number }[];
}

/** Total nilai aset (sum harga_perolehan) + kategori aset paling populer
 * (diurutkan dari JUMLAH UNIT, bukan nilai rupiah — "terpopuler" lebih
 * natural dibaca sebagai "paling banyak dipakai/dimiliki sekolah-
 * sekolah") — lintas SEMUA tenant, atau satu sekolah tertentu kalau
 * `sekolahId` diisi. */
export async function getLaporanAsetRingkas(
  sekolahId?: string
): Promise<LaporanAsetRingkas> {
  await requireSuperAdmin();
  const service = createServiceClient();

  let queryAset = service
    .from("aset")
    .select("harga_perolehan, kategori:kategori_id ( nama )");
  if (sekolahId) queryAset = queryAset.eq("sekolah_id", sekolahId);

  const { data } = await queryAset;

  const rows = (data ?? []) as unknown as {
    harga_perolehan: number | null;
    kategori: { nama: string } | null;
  }[];

  const totalNilaiAset = rows.reduce((sum, r) => sum + (r.harga_perolehan ?? 0), 0);

  const jumlahPerKategori = new Map<string, number>();
  for (const r of rows) {
    const nama = r.kategori?.nama ?? "Tanpa Kategori";
    jumlahPerKategori.set(nama, (jumlahPerKategori.get(nama) ?? 0) + 1);
  }
  const kategoriTerpopuler = Array.from(jumlahPerKategori.entries())
    .map(([nama, jumlah]) => ({ nama, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 6);

  return { totalNilaiAset, kategoriTerpopuler };
}
