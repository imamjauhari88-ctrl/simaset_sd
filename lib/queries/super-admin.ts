import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface SekolahUntukSuperAdmin {
  id: string;
  nama: string;
  npsn: string | null;
  alamat: string | null;
  status: "aktif" | "nonaktif";
  created_at: string;
  alasan_nonaktif: string | null;
  jumlahAset: number;
  jumlahUser: number;
  admin: { nama: string; email: string | null } | null;
}

/**
 * Ambil sekolah + ringkasan (jumlah aset/user) + data admin pertamanya,
 * lintas SEMUA tenant — pakai service client (bypass RLS) karena RLS di
 * sistem ini didesain buat NGUNCI query ke satu sekolah aja
 * (current_sekolah_id()). Super admin butuh lihat semua sekolah sekaligus,
 * itu di luar model RLS-nya.
 *
 * Hitungan jumlah aset/user dibaca dari VIEW `sekolah_ringkasan` (agregasi
 * di database), bukan di-loop di JS — biar satu query aja, bukan N+1.
 *
 * `sekolahId` opsional — kalau diisi, hasil di-scope ke satu sekolah aja
 * (dipakai untuk export ringkasan yang di-filter per sekolah).
 */
export async function getDaftarSekolahUntukSuperAdmin(
  sekolahId?: string
): Promise<SekolahUntukSuperAdmin[]> {
  const service = createServiceClient();

  let query = service
    .from("sekolah_ringkasan")
    .select(
      "id, nama, npsn, alamat, status, created_at, alasan_nonaktif, jumlah_aset, jumlah_user"
    )
    .order("created_at", { ascending: false });
  if (sekolahId) query = query.eq("id", sekolahId);

  const { data: sekolahList, error } = await query;

  if (error || !sekolahList) {
    if (error) console.error("Gagal ambil daftar sekolah:", error.message);
    return [];
  }

  // Ambil admin pertama tiap sekolah + email-nya (email cuma ada di
  // auth.users, bukan di `profil` — makanya butuh 2 langkah + service
  // client buat baca auth.users, gak bisa lewat query biasa).
  const hasil = await Promise.all(
    sekolahList.map(async (s) => {
      const { data: adminProfil } = await service
        .from("profil")
        .select("id, nama")
        .eq("sekolah_id", s.id)
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      let email: string | null = null;
      if (adminProfil) {
        const { data: authUser } = await service.auth.admin.getUserById(
          adminProfil.id
        );
        email = authUser.user?.email ?? null;
      }

      return {
        id: s.id,
        nama: s.nama,
        npsn: s.npsn,
        alamat: s.alamat,
        status: s.status as "aktif" | "nonaktif",
        created_at: s.created_at,
        alasan_nonaktif: s.alasan_nonaktif,
        jumlahAset: s.jumlah_aset ?? 0,
        jumlahUser: s.jumlah_user ?? 0,
        admin: adminProfil ? { nama: adminProfil.nama, email } : null,
      };
    })
  );

  return hasil;
}

export interface RingkasanDashboardSuperAdmin {
  totalSekolah: number;
  sekolahAktifHariIni: number;
  totalAset: number;
  totalUser: number;
  sekolahPalingAktif: { nama: string; jumlahAsetBulanIni: number }[];
}

/**
 * Ringkasan buat dashboard super admin — 1 layar, semua angka penting
 * kelihatan tanpa bolak-balik buka halaman lain.
 */
export async function getRingkasanDashboardSuperAdmin(): Promise<RingkasanDashboardSuperAdmin> {
  const service = createServiceClient();

  const awalBulan = new Date();
  awalBulan.setDate(1);
  awalBulan.setHours(0, 0, 0, 0);

  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);

  const [sekolahRes, asetRes, userRes, asetBulanIniRes] = await Promise.all([
    service.from("sekolah").select("id, nama, status"),
    service.from("aset").select("id", { count: "exact", head: true }),
    service.from("profil").select("id", { count: "exact", head: true }),
    service
      .from("aset")
      .select("sekolah_id")
      .gte("created_at", awalBulan.toISOString()),
  ]);

  const sekolahList = sekolahRes.data ?? [];
  const totalSekolah = sekolahList.filter((s) => s.status === "aktif").length;

  // "Aktif hari ini" dipakai lewat sign-in user, bukan lewat aset — sekolah
  // yang cuma login tanpa nambah data tetap kehitung. Dibatasi 1000 user
  // pertama (cukup buat skala sekolah), bukan lintas-halaman penuh, biar
  // dashboard tetap ringan.
  const { data: userList } = await service.auth.admin.listUsers({
    perPage: 1000,
  });
  const idLoginHariIni = new Set(
    (userList?.users ?? [])
      .filter(
        (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= awalHariIni
      )
      .map((u) => u.id)
  );

  let sekolahAktifHariIni = 0;
  if (idLoginHariIni.size > 0) {
    const { data: profilLoginHariIni } = await service
      .from("profil")
      .select("sekolah_id")
      .in("id", Array.from(idLoginHariIni));
    sekolahAktifHariIni = new Set(
      (profilLoginHariIni ?? []).map((p) => p.sekolah_id)
    ).size;
  }

  // Sekolah paling aktif upload aset bulan ini — hitung jumlah baris aset
  // per sekolah_id di JS (data mentahnya udah kefilter dari bulan ini di
  // query), lalu urutkan & ambil 6 teratas.
  const jumlahPerSekolah = new Map<string, number>();
  for (const row of asetBulanIniRes.data ?? []) {
    jumlahPerSekolah.set(
      row.sekolah_id,
      (jumlahPerSekolah.get(row.sekolah_id) ?? 0) + 1
    );
  }
  const namaSekolah = new Map(sekolahList.map((s) => [s.id, s.nama]));
  const sekolahPalingAktif = Array.from(jumlahPerSekolah.entries())
    .map(([sekolahId, jumlah]) => ({
      nama: namaSekolah.get(sekolahId) ?? "Sekolah",
      jumlahAsetBulanIni: jumlah,
    }))
    .sort((a, b) => b.jumlahAsetBulanIni - a.jumlahAsetBulanIni)
    .slice(0, 6);

  return {
    totalSekolah,
    sekolahAktifHariIni,
    totalAset: asetRes.count ?? 0,
    totalUser: userRes.count ?? 0,
    sekolahPalingAktif,
  };
}

export interface RingkasanSekolahDetail {
  sekolah: {
    id: string;
    nama: string;
    npsn: string | null;
    alamat: string | null;
    status: "aktif" | "nonaktif";
    created_at: string;
    alasan_nonaktif: string | null;
  };
  totalAset: number;
  totalRuangan: number;
  kondisiBreakdown: { name: string; value: number; color: string }[];
  penggunaPerRole: { role: string; jumlah: number }[];
  asetTerbaru: { id: string; kode_aset: string; nama: string; created_at: string }[];
}

const LABEL_KONDISI: Record<string, string> = {
  baik: "Baik",
  rusak_ringan: "Rusak Ringan",
  rusak_berat: "Rusak Berat",
};
const WARNA_KONDISI: Record<string, string> = {
  baik: "#5f8d6b",
  rusak_ringan: "#c9a24b",
  rusak_berat: "#b5533c",
};
const LABEL_ROLE: Record<string, string> = {
  admin: "Admin",
  guru: "Guru/TU",
  kepsek: "Kepala Sekolah",
};

/**
 * Ringkasan satu sekolah buat mode "Lihat Detail" (read-only) super
 * admin — sengaja query terpisah dari getDashboardData() tenant biasa,
 * karena itu bergantung ke RLS/current_sekolah_id() (punya user yang
 * login), sedangkan di sini super admin mengintip sekolah ORANG LAIN
 * lewat service client + filter sekolah_id eksplisit.
 */
export async function getRingkasanSekolahDetail(
  sekolahId: string
): Promise<RingkasanSekolahDetail | null> {
  const service = createServiceClient();

  const { data: sekolah } = await service
    .from("sekolah")
    .select("id, nama, npsn, alamat, status, created_at, alasan_nonaktif")
    .eq("id", sekolahId)
    .maybeSingle();

  if (!sekolah) return null;

  const [asetRes, ruanganRes, profilRes, asetTerbaruRes] = await Promise.all([
    service.from("aset").select("kondisi").eq("sekolah_id", sekolahId),
    service
      .from("ruangan")
      .select("id", { count: "exact", head: true })
      .eq("sekolah_id", sekolahId),
    service.from("profil").select("role").eq("sekolah_id", sekolahId),
    service
      .from("aset")
      .select("id, kode_aset, nama, created_at")
      .eq("sekolah_id", sekolahId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const aset = asetRes.data ?? [];
  const kondisiCount: Record<string, number> = {
    baik: 0,
    rusak_ringan: 0,
    rusak_berat: 0,
  };
  for (const a of aset) {
    if (a.kondisi in kondisiCount) kondisiCount[a.kondisi] += 1;
  }
  const kondisiBreakdown = Object.keys(kondisiCount).map((k) => ({
    name: LABEL_KONDISI[k],
    value: kondisiCount[k],
    color: WARNA_KONDISI[k],
  }));

  const roleCount = new Map<string, number>();
  for (const p of profilRes.data ?? []) {
    roleCount.set(p.role, (roleCount.get(p.role) ?? 0) + 1);
  }
  const penggunaPerRole = Array.from(roleCount.entries()).map(
    ([role, jumlah]) => ({ role: LABEL_ROLE[role] ?? role, jumlah })
  );

  return {
    sekolah: {
      ...sekolah,
      status: sekolah.status as "aktif" | "nonaktif",
    },
    totalAset: aset.length,
    totalRuangan: ruanganRes.count ?? 0,
    kondisiBreakdown,
    penggunaPerRole,
    asetTerbaru: asetTerbaruRes.data ?? [],
  };
}
