import { createClient } from "@/lib/supabase/server";
import { formatWaktuRelatif, formatRupiah } from "@/lib/format";
import type {
  Aset,
  KategoriAset,
  KondisiAset,
  MutasiAset,
  PemeliharaanAset,
  Peminjaman,
  Profil,
  Ruangan,
} from "@/types/database";

export type AsetWithRelasi = Aset & {
  kategori_aset: Pick<KategoriAset, "id" | "nama" | "kode_kib"> | null;
  ruangan: Pick<Ruangan, "id" | "nama"> | null;
};

export type MutasiWithRelasi = MutasiAset & {
  aset: Pick<Aset, "id" | "kode_aset" | "nama"> | null;
  ruangan_asal: Pick<Ruangan, "id" | "nama"> | null;
  ruangan_tujuan: Pick<Ruangan, "id" | "nama"> | null;
};

export type PemeliharaanWithRelasi = PemeliharaanAset & {
  aset: Pick<Aset, "id" | "kode_aset" | "nama"> | null;
};

// Dibaca dari VIEW peminjaman_dengan_status (bukan tabel peminjaman
// langsung) supaya dapat kolom `terlambat` yang dihitung on-the-fly
// (status DIPINJAM + tanggal_kembali_rencana sudah lewat), tanpa perlu
// job/cron buat nyocokin kolom status secara berkala.
export type PeminjamanWithRelasi = Peminjaman & {
  terlambat: boolean;
  aset: Pick<Aset, "id" | "kode_aset" | "nama"> | null;
  peminjam: Pick<Profil, "id" | "nama"> | null;
  approver: Pick<Profil, "id" | "nama"> | null;
};

export async function getDaftarAset(): Promise<AsetWithRelasi[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("aset")
    .select(
      `*, kategori_aset:kategori_id ( id, nama ), ruangan:ruangan_id ( id, nama )`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil data aset:", error.message);
    return [];
  }

  return data as unknown as AsetWithRelasi[];
}

/** Ambil aset spesifik berdasarkan daftar id — dipakai halaman cetak label
 * QR "terpilih" (bulk select di tabel Data Aset), beda dari getDaftarAset
 * yang ambil semua. */
export async function getAsetByIds(ids: string[]): Promise<AsetWithRelasi[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("aset")
    .select(
      `*, kategori_aset:kategori_id ( id, nama ), ruangan:ruangan_id ( id, nama )`
    )
    .in("id", ids)
    .order("kode_aset", { ascending: true });

  if (error) {
    console.error("Gagal mengambil aset terpilih:", error.message);
    return [];
  }

  return data as unknown as AsetWithRelasi[];
}

export interface DaftarAsetParams {
  page?: number;
  pageSize?: number;
  search?: string;
  kondisi?: KondisiAset | "semua";
}

export interface DaftarAsetResult {
  data: AsetWithRelasi[];
  count: number;
}

/**
 * Versi berpaginasi dari getDaftarAset — filter (pencarian & kondisi) dan
 * pemotongan halaman dilakukan di query Supabase (bukan di JS) supaya
 * total & jumlah baris yang dikirim ke client tetap kecil walau data
 * aset sudah ribuan baris.
 */
export async function getDaftarAsetPaginated(
  params: DaftarAsetParams = {}
): Promise<DaftarAsetResult> {
  const { page = 1, pageSize = 15, search = "", kondisi = "semua" } = params;
  const supabase = await createClient();

  let query = supabase
    .from("aset")
    .select(
      `*, kategori_aset:kategori_id ( id, nama ), ruangan:ruangan_id ( id, nama )`,
      { count: "exact" }
    );

  const kataKunci = search.trim();
  if (kataKunci) {
    // Escape karakter khusus filter PostgREST (% , ) supaya pencarian
    // dengan simbol tersebut tidak merusak sintaks query .or()
    const aman = kataKunci.replace(/[%,]/g, "");
    query = query.or(`nama.ilike.%${aman}%,kode_aset.ilike.%${aman}%`);
  }
  if (kondisi !== "semua") {
    query = query.eq("kondisi", kondisi);
  }

  const dari = (Math.max(1, page) - 1) * pageSize;
  const sampai = dari + pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(dari, sampai);

  if (error) {
    console.error("Gagal mengambil data aset:", error.message);
    return { data: [], count: 0 };
  }

  return { data: data as unknown as AsetWithRelasi[], count: count ?? 0 };
}

/** Jumlah total aset tanpa filter — dipakai untuk membedakan "belum ada
 * data sama sekali" (tampilkan EmptyState) vs "ada data tapi hasil
 * pencarian kosong" (tampilkan pesan di dalam tabel). */
export async function getTotalAset(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("aset")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Gagal menghitung total aset:", error.message);
    return 0;
  }
  return count ?? 0;
}

export interface DaftarMutasiParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tahun?: number | "semua";
}

export interface DaftarMutasiResult {
  data: MutasiWithRelasi[];
  count: number;
}

/**
 * Pencarian nama/kode aset difilter lewat tabel relasi `aset` (embedded
 * resource). Join dibuat `!inner` HANYA saat pencarian aktif, supaya
 * PostgREST benar-benar membatasi baris mutasi_aset yang dikembalikan
 * (join biasa cuma mengisi/mengosongkan data relasi, tidak memfilter baris
 * induk). Saat tidak ada pencarian, tetap pakai left join biasa supaya
 * baris dengan aset yang sudah terhapus (aset_id null) tetap tampil.
 */
export async function getDaftarMutasiPaginated(
  params: DaftarMutasiParams = {}
): Promise<DaftarMutasiResult> {
  const { page = 1, pageSize = 15, search = "", tahun = "semua" } = params;
  const supabase = await createClient();

  const kataKunci = search.trim();
  const selectKlausa = kataKunci
    ? `*, aset:aset_id!inner ( id, kode_aset, nama ), ruangan_asal:ruangan_asal_id ( id, nama ), ruangan_tujuan:ruangan_tujuan_id ( id, nama )`
    : `*, aset:aset_id ( id, kode_aset, nama ), ruangan_asal:ruangan_asal_id ( id, nama ), ruangan_tujuan:ruangan_tujuan_id ( id, nama )`;

  let query = supabase
    .from("mutasi_aset")
    .select(selectKlausa, { count: "exact" });

  if (kataKunci) {
    const aman = kataKunci.replace(/[%,]/g, "");
    query = query.or(`nama.ilike.%${aman}%,kode_aset.ilike.%${aman}%`, {
      foreignTable: "aset",
    });
  }
  if (tahun !== "semua") {
    query = query.gte("tanggal", `${tahun}-01-01`).lte("tanggal", `${tahun}-12-31`);
  }

  const dari = (Math.max(1, page) - 1) * pageSize;
  const sampai = dari + pageSize - 1;

  const { data, error, count } = await query
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .range(dari, sampai);

  if (error) {
    console.error("Gagal mengambil data mutasi:", error.message);
    return { data: [], count: 0 };
  }

  return { data: data as unknown as MutasiWithRelasi[], count: count ?? 0 };
}

export interface DaftarPemeliharaanParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tahun?: number | "semua";
  jenis?: "rutin" | "perbaikan" | "semua";
}

export interface DaftarPemeliharaanResult {
  data: PemeliharaanWithRelasi[];
  count: number;
}

/** Sama seperti getDaftarMutasiPaginated: join `aset` dibuat `!inner`
 * hanya saat pencarian nama/kode aset aktif, supaya baris dengan aset
 * yang sudah terhapus tetap tampil ketika tidak sedang mencari. */
export async function getDaftarPemeliharaanPaginated(
  params: DaftarPemeliharaanParams = {}
): Promise<DaftarPemeliharaanResult> {
  const {
    page = 1,
    pageSize = 15,
    search = "",
    tahun = "semua",
    jenis = "semua",
  } = params;
  const supabase = await createClient();

  const kataKunci = search.trim();
  const selectKlausa = kataKunci
    ? `*, aset:aset_id!inner ( id, kode_aset, nama )`
    : `*, aset:aset_id ( id, kode_aset, nama )`;

  let query = supabase
    .from("pemeliharaan_aset")
    .select(selectKlausa, { count: "exact" });

  if (kataKunci) {
    const aman = kataKunci.replace(/[%,]/g, "");
    query = query.or(`nama.ilike.%${aman}%,kode_aset.ilike.%${aman}%`, {
      foreignTable: "aset",
    });
  }
  if (tahun !== "semua") {
    query = query.gte("tanggal", `${tahun}-01-01`).lte("tanggal", `${tahun}-12-31`);
  }
  if (jenis !== "semua") {
    query = query.eq("jenis", jenis);
  }

  const dari = (Math.max(1, page) - 1) * pageSize;
  const sampai = dari + pageSize - 1;

  const { data, error, count } = await query
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .range(dari, sampai);

  if (error) {
    console.error("Gagal mengambil data pemeliharaan:", error.message);
    return { data: [], count: 0 };
  }

  return {
    data: data as unknown as PemeliharaanWithRelasi[],
    count: count ?? 0,
  };
}

export async function getKategoriList(): Promise<KategoriAset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kategori_aset")
    .select("*")
    .order("nama");

  if (error) {
    console.error("Gagal mengambil kategori:", error.message);
    return [];
  }
  return data;
}

export async function getRuanganList(): Promise<Ruangan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ruangan")
    .select("*")
    .order("nama");

  if (error) {
    console.error("Gagal mengambil ruangan:", error.message);
    return [];
  }
  return data;
}

// ============================================================
// Dashboard — agregasi data real, bukan mock
// ============================================================

export interface KondisiBreakdownItem {
  name: string;
  value: number;
  color: string;
}

export interface TrenBulananItem {
  bulan: string;
  jumlah: number;
}

export interface AktivitasItem {
  id: string;
  teks: string;
  waktu: string; // sudah diformat relatif, mis. "10 menit lalu"
  /** ISO timestamp asli (opsional) — dipakai NotifikasiDropdown buat
   * bandingin sama "terakhir dilihat" nentuin badge merah, bukan buat
   * ditampilin. ActivityLog di Dashboard gak butuh ini, cuma `waktu`. */
  waktuRaw?: string;
}

export interface NilaiPerKategoriItem {
  kategori: string;
  nilai: number;
  color: string;
}

export interface JumlahPerKategoriItem {
  kategori: string;
  jumlah: number;
  color: string;
}

export interface DashboardData {
  totalAset: number;
  nilaiTotalAset: number;
  rusakBerat: number;
  totalRuangan: number;
  kondisiBreakdown: KondisiBreakdownItem[];
  trenBulanan: TrenBulananItem[];
  nilaiPerKategori: NilaiPerKategoriItem[];
  jumlahPerKategori: JumlahPerKategoriItem[];
  aktivitas: AktivitasItem[];
}

/** Palet warna donut "Jumlah per Kategori" — cocok sama tone earthy
 * yang sudah dipakai di tempat lain (pine/brass/sage/brick), ditambah
 * beberapa varian biar kategori ke-5 dst tetap kebeda. */
const WARNA_KATEGORI = [
  "var(--color-pine)",
  "var(--color-brass)",
  "var(--color-sage)",
  "var(--color-brick)",
  "var(--color-pine-dark)",
  "#8a6fb3",
  "#4f7ea8",
  "#c97f3c",
];

const WARNA_KONDISI: Record<KondisiAset, string> = {
  baik: "var(--color-sage)",
  rusak_ringan: "var(--color-brass)",
  rusak_berat: "var(--color-brick)",
};

const LABEL_KONDISI: Record<KondisiAset, string> = {
  baik: "Baik",
  rusak_ringan: "Rusak Ringan",
  rusak_berat: "Rusak Berat",
};

const NAMA_BULAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

type AsetRingkas = Pick<Aset, "kondisi" | "harga_perolehan" | "created_at"> & {
  kategori_aset: { nama: string } | null;
};
type AsetBaru = Pick<Aset, "id" | "kode_aset" | "nama" | "created_at">;
type AsetDiubah = Pick<
  Aset,
  "id" | "kode_aset" | "nama" | "created_at" | "updated_at"
>;
type MutasiRingkas = {
  id: string;
  created_at: string;
  disetujui_oleh: string | null;
  aset: Pick<Aset, "nama"> | null;
  ruangan_asal: Pick<Ruangan, "nama"> | null;
  ruangan_tujuan: Pick<Ruangan, "nama"> | null;
};
type PemeliharaanRingkas = {
  id: string;
  jenis: string;
  created_at: string;
  aset: Pick<Aset, "nama"> | null;
};
type PeminjamanRingkasDashboard = {
  borrow_id: string;
  status: string;
  updated_at: string;
  atas_nama: string | null;
  aset: Pick<Aset, "nama"> | null;
  peminjam: Pick<Profil, "nama"> | null;
};

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const enamBulanLalu = new Date();
  enamBulanLalu.setMonth(enamBulanLalu.getMonth() - 5);
  enamBulanLalu.setDate(1);
  enamBulanLalu.setHours(0, 0, 0, 0);

  const [
    asetRingkasRes,
    totalRuanganRes,
    asetBaruRes,
    asetDiubahRes,
    mutasiRes,
    pemeliharaanRes,
    peminjamanRes,
  ] = await Promise.all([
    supabase
      .from("aset")
      .select("kondisi, harga_perolehan, created_at, kategori_aset:kategori_id ( nama )"),
    supabase.from("ruangan").select("id", { count: "exact", head: true }),
    supabase
      .from("aset")
      .select("id, kode_aset, nama, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("aset")
      .select("id, kode_aset, nama, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("mutasi_aset")
      .select(
        `id, created_at, disetujui_oleh, aset:aset_id ( nama ), ruangan_asal:ruangan_asal_id ( nama ), ruangan_tujuan:ruangan_tujuan_id ( nama )`
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("pemeliharaan_aset")
      .select(`id, jenis, created_at, aset:aset_id ( nama )`)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("peminjaman_dengan_status")
      .select(
        `borrow_id, status, updated_at, atas_nama, aset:aset_id ( nama ), peminjam:peminjam_id ( nama )`
      )
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const aset = (asetRingkasRes.data ?? []) as unknown as AsetRingkas[];
  const asetBaru = (asetBaruRes.data ?? []) as unknown as AsetBaru[];
  const asetDiubah = (asetDiubahRes.data ?? []) as unknown as AsetDiubah[];
  const mutasi = (mutasiRes.data ?? []) as unknown as MutasiRingkas[];
  const pemeliharaan = (pemeliharaanRes.data ?? []) as unknown as PemeliharaanRingkas[];
  const peminjaman = (peminjamanRes.data ?? []) as unknown as PeminjamanRingkasDashboard[];

  const totalAset = aset.length;
  const nilaiTotalAset = aset.reduce((sum, a) => sum + (a.harga_perolehan ?? 0), 0);
  const rusakBerat = aset.filter((a) => a.kondisi === "rusak_berat").length;

  const kondisiCount: Record<KondisiAset, number> = {
    baik: 0,
    rusak_ringan: 0,
    rusak_berat: 0,
  };
  for (const a of aset) {
    if (a.kondisi in kondisiCount) kondisiCount[a.kondisi] += 1;
  }
  const kondisiBreakdown = (Object.keys(kondisiCount) as KondisiAset[]).map(
    (k) => ({
      name: LABEL_KONDISI[k],
      value: kondisiCount[k],
      color: WARNA_KONDISI[k],
    })
  );

  const bulanBuckets: { key: string; bulan: string; jumlah: number }[] = [];
  const kursor = new Date(enamBulanLalu);
  for (let i = 0; i < 6; i++) {
    bulanBuckets.push({
      key: `${kursor.getFullYear()}-${kursor.getMonth()}`,
      bulan: NAMA_BULAN[kursor.getMonth()],
      jumlah: 0,
    });
    kursor.setMonth(kursor.getMonth() + 1);
  }
  for (const a of aset) {
    if (!a.created_at) continue;
    const d = new Date(a.created_at);
    if (d < enamBulanLalu) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = bulanBuckets.find((b) => b.key === key);
    if (bucket) bucket.jumlah += 1;
  }
  const trenBulanan = bulanBuckets.map(({ bulan, jumlah }) => ({ bulan, jumlah }));

  // Pemetaan warna PER NAMA kategori (bukan per posisi index di masing-
  // masing chart) — dipakai bareng oleh nilaiPerKategori & jumlahPerKategori
  // di bawah. Ini penting: nilaiPerKategori diurut dari nilai terbesar,
  // jumlahPerKategori diurut dari jumlah terbanyak, jadi urutannya BISA
  // beda antar dua chart (mis. "Elektronik" mahal tapi jumlahnya sedikit).
  // Kalau warnanya ditentukan dari index array masing-masing (assign
  // berurutan), "Elektronik" bisa jadi biru di satu chart tapi hijau di
  // chart sebelahnya — bikin bingung padahal dua chart ini sengaja
  // ditaruh sejajar biar gampang dikorelasikan. Warna "Lainnya" (bucket
  // gabungan kategori kecil) dikunci abu-abu netral di kedua chart,
  // BUKAN warna kategori asli, karena itu bukan kategori sungguhan.
  const namaKategoriUnik = Array.from(
    new Set(aset.map((a) => a.kategori_aset?.nama ?? "Tanpa Kategori"))
  ).sort((a, b) => a.localeCompare(b, "id"));
  const WARNA_LAINNYA = "var(--color-ink-soft)";
  function warnaKategori(nama: string): string {
    if (nama === "Lainnya") return WARNA_LAINNYA;
    const idx = namaKategoriUnik.indexOf(nama);
    return idx === -1
      ? WARNA_LAINNYA
      : WARNA_KATEGORI[idx % WARNA_KATEGORI.length];
  }

  // Nilai aset per kategori — dijumlah dari harga_perolehan, diurut
  // terbesar dulu. Kategori ke-9 dst digabung "Lainnya" biar chart gak
  // penuh sesak kalau sekolahnya punya puluhan kategori barang.
  const nilaiPerKategoriMap = new Map<string, number>();
  for (const a of aset) {
    const nama = a.kategori_aset?.nama ?? "Tanpa Kategori";
    nilaiPerKategoriMap.set(
      nama,
      (nilaiPerKategoriMap.get(nama) ?? 0) + (a.harga_perolehan ?? 0)
    );
  }
  const nilaiPerKategoriUrut = Array.from(
    nilaiPerKategoriMap,
    ([kategori, nilai]) => ({ kategori, nilai })
  )
    .filter((k) => k.nilai > 0)
    .sort((a, b) => b.nilai - a.nilai);

  const nilaiPerKategoriRingkas =
    nilaiPerKategoriUrut.length > 8
      ? [
          ...nilaiPerKategoriUrut.slice(0, 8),
          {
            kategori: "Lainnya",
            nilai: nilaiPerKategoriUrut
              .slice(8)
              .reduce((sum, k) => sum + k.nilai, 0),
          },
        ]
      : nilaiPerKategoriUrut;

  const nilaiPerKategori = nilaiPerKategoriRingkas.map((k) => ({
    ...k,
    color: warnaKategori(k.kategori),
  }));

  // Jumlah aset per kategori — hitung banyaknya barang, bukan nilainya.
  // Kategori ke-7 dst digabung "Lainnya" biar donutnya gak kepenuhan
  // irisan tipis-tipis.
  const jumlahPerKategoriMap = new Map<string, number>();
  for (const a of aset) {
    const nama = a.kategori_aset?.nama ?? "Tanpa Kategori";
    jumlahPerKategoriMap.set(nama, (jumlahPerKategoriMap.get(nama) ?? 0) + 1);
  }
  const jumlahPerKategoriUrut = Array.from(
    jumlahPerKategoriMap,
    ([kategori, jumlah]) => ({ kategori, jumlah })
  ).sort((a, b) => b.jumlah - a.jumlah);

  const BATAS_KATEGORI = WARNA_KATEGORI.length - 1;
  const jumlahPerKategoriRingkas =
    jumlahPerKategoriUrut.length > WARNA_KATEGORI.length
      ? [
          ...jumlahPerKategoriUrut.slice(0, BATAS_KATEGORI),
          {
            kategori: "Lainnya",
            jumlah: jumlahPerKategoriUrut
              .slice(BATAS_KATEGORI)
              .reduce((sum, k) => sum + k.jumlah, 0),
          },
        ]
      : jumlahPerKategoriUrut;

  const jumlahPerKategori = jumlahPerKategoriRingkas.map((k) => ({
    ...k,
    color: warnaKategori(k.kategori),
  }));

  const aktivitasMentah: { id: string; teks: string; waktuRaw: string }[] = [];

  for (const a of asetBaru) {
    aktivitasMentah.push({
      id: `aset-baru-${a.id}`,
      teks: `Aset baru ditambahkan — ${a.kode_aset} · ${a.nama}`,
      waktuRaw: a.created_at,
    });
  }

  for (const a of asetDiubah) {
    // hanya masuk kalau memang pernah diedit setelah dibuat
    if (a.updated_at && a.created_at && a.updated_at !== a.created_at) {
      aktivitasMentah.push({
        id: `aset-ubah-${a.id}`,
        teks: `Data aset diperbarui — ${a.kode_aset} · ${a.nama}`,
        waktuRaw: a.updated_at,
      });
    }
  }

  for (const m of mutasi) {
    aktivitasMentah.push({
      id: `mutasi-${m.id}`,
      teks: `Mutasi dicatat — ${m.aset?.nama ?? "Aset"}: ${
        m.ruangan_asal?.nama ?? "?"
      } → ${m.ruangan_tujuan?.nama ?? "?"}${
        m.disetujui_oleh ? ` (disetujui ${m.disetujui_oleh})` : ""
      }`,
      waktuRaw: m.created_at,
    });
  }

  for (const p of pemeliharaan) {
    const jenisLabel = p.jenis === "perbaikan" ? "Perbaikan" : "Rutin";
    aktivitasMentah.push({
      id: `pemeliharaan-${p.id}`,
      teks: `Pemeliharaan (${jenisLabel}) dicatat — ${p.aset?.nama ?? "Aset"}`,
      waktuRaw: p.created_at,
    });
  }

  const LABEL_AKTIVITAS_PINJAM: Record<string, string> = {
    MENUNGGU: "Pengajuan peminjaman",
    DIPINJAM: "Peminjaman disetujui",
    DITOLAK: "Peminjaman ditolak",
    DIKEMBALIKAN: "Aset dikembalikan",
  };
  for (const p of peminjaman) {
    const namaPeminjam = p.atas_nama || p.peminjam?.nama || "Seseorang";
    const label = LABEL_AKTIVITAS_PINJAM[p.status] ?? "Peminjaman diperbarui";
    aktivitasMentah.push({
      id: `peminjaman-${p.borrow_id}`,
      teks: `${label} — ${p.aset?.nama ?? "Aset"} (${namaPeminjam})`,
      waktuRaw: p.updated_at,
    });
  }

  aktivitasMentah.sort(
    (a, b) => new Date(b.waktuRaw).getTime() - new Date(a.waktuRaw).getTime()
  );

  return {
    totalAset,
    nilaiTotalAset,
    rusakBerat,
    totalRuangan: totalRuanganRes.count ?? 0,
    kondisiBreakdown,
    trenBulanan,
    nilaiPerKategori,
    jumlahPerKategori,
    aktivitas: aktivitasMentah.slice(0, 6).map((a) => ({
      id: a.id,
      teks: a.teks,
      waktu: formatWaktuRelatif(a.waktuRaw),
      waktuRaw: a.waktuRaw,
    })),
  };
}

export interface DaftarPeminjamanParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: Peminjaman["status"] | "semua";
  hanyaTerlambat?: boolean;
}

export interface DaftarPeminjamanResult {
  data: PeminjamanWithRelasi[];
  count: number;
}

/**
 * Baca dari VIEW peminjaman_dengan_status (bukan tabel peminjaman langsung)
 * supaya kolom `terlambat` selalu akurat (dihitung saat query, bukan
 * kolom tersimpan yang bisa basi). View sudah security_invoker=true jadi
 * tetap tunduk RLS tabel peminjaman aslinya — aman dipakai lintas role.
 */
// ---------------------------------------------------------------------
// Query khusus halaman Laporan (KIB / KIR / Mutasi) — semua tanpa
// paginasi karena hasilnya langsung dirender penuh di halaman cetak
// (app/cetak/laporan/...), bukan tabel dengan Pagination seperti manager
// lain. Diurutkan `kode_aset` (bukan created_at) supaya laporan tercetak
// urut rapi, konsisten tiap kali dicetak ulang.
// ---------------------------------------------------------------------

/**
 * KIB (Kartu Inventaris Barang) dikelompokkan per kategori. Kalau
 * `kategoriId` diisi, cuma ambil aset kategori itu; kalau tidak, ambil
 * semua aset (dipakai saat kategori dipilih "Semua Kategori").
 */
export async function getLaporanAsetPerKategori(
  kategoriId?: string
): Promise<AsetWithRelasi[]> {
  const supabase = await createClient();

  let query = supabase
    .from("aset")
    .select(
      `*, kategori_aset:kategori_id ( id, nama, kode_kib ), ruangan:ruangan_id ( id, nama )`
    );

  if (kategoriId) {
    query = query.eq("kategori_id", kategoriId);
  }

  const { data, error } = await query.order("kode_aset", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data laporan KIB:", error.message);
    return [];
  }

  return data as unknown as AsetWithRelasi[];
}

/**
 * KIR (Kartu Inventaris Ruangan) dikelompokkan per ruangan. Sama seperti
 * KIB, `ruanganId` kosong berarti semua ruangan.
 */
export async function getLaporanAsetPerRuangan(
  ruanganId?: string
): Promise<AsetWithRelasi[]> {
  const supabase = await createClient();

  let query = supabase
    .from("aset")
    .select(
      `*, kategori_aset:kategori_id ( id, nama ), ruangan:ruangan_id ( id, nama )`
    );

  if (ruanganId) {
    query = query.eq("ruangan_id", ruanganId);
  }

  const { data, error } = await query.order("kode_aset", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data laporan KIR:", error.message);
    return [];
  }

  return data as unknown as AsetWithRelasi[];
}

/** Laporan Mutasi — semua baris mutasi (opsional difilter per tahun),
 * tanpa paginasi, buat dicetak. */
export async function getLaporanMutasi(
  tahun?: number
): Promise<MutasiWithRelasi[]> {
  const supabase = await createClient();

  let query = supabase
    .from("mutasi_aset")
    .select(
      `*, aset:aset_id ( id, kode_aset, nama ), ruangan_asal:ruangan_asal_id ( id, nama ), ruangan_tujuan:ruangan_tujuan_id ( id, nama )`
    );

  if (tahun) {
    query = query.gte("tanggal", `${tahun}-01-01`).lte("tanggal", `${tahun}-12-31`);
  }

  const { data, error } = await query
    .order("tanggal", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data laporan mutasi:", error.message);
    return [];
  }

  return data as unknown as MutasiWithRelasi[];
}

export interface RiwayatAsetItem {
  id: string;
  jenis: "mutasi" | "pemeliharaan" | "peminjaman";
  teks: string;
  keterangan?: string | null;
  tanggal: string; // ISO date, dipakai sort & format tampilan
}

const LABEL_STATUS_PINJAM: Record<string, string> = {
  MENUNGGU: "menunggu persetujuan",
  DIPINJAM: "sedang dipinjam",
  DITOLAK: "ditolak",
  DIKEMBALIKAN: "sudah dikembalikan",
};

/**
 * Riwayat satu aset spesifik — gabungan mutasi, pemeliharaan, dan
 * peminjaman yang pernah tercatat buat aset ini, diurut terbaru dulu.
 * Dipakai di halaman Detail Aset (/aset/[id]) sebagai timeline, beda
 * dari getLaporanMutasi yang buat laporan lintas-aset.
 */
export async function getRiwayatAset(asetId: string): Promise<RiwayatAsetItem[]> {
  const supabase = await createClient();

  const [mutasiRes, pemeliharaanRes, peminjamanRes] = await Promise.all([
    supabase
      .from("mutasi_aset")
      .select(
        `id, tanggal, disetujui_oleh, keterangan, ruangan_asal:ruangan_asal_id ( nama ), ruangan_tujuan:ruangan_tujuan_id ( nama )`
      )
      .eq("aset_id", asetId)
      .order("tanggal", { ascending: false }),
    supabase
      .from("pemeliharaan_aset")
      .select("id, tanggal, jenis, biaya, keterangan, disetujui_oleh")
      .eq("aset_id", asetId)
      .order("tanggal", { ascending: false }),
    supabase
      .from("peminjaman_dengan_status")
      .select(
        `borrow_id, tanggal_pinjam, tanggal_kembali_rencana, tanggal_kembali_aktual, status, atas_nama, catatan_pengajuan, peminjam:peminjam_id ( nama )`
      )
      .eq("aset_id", asetId)
      .order("tanggal_pinjam", { ascending: false }),
  ]);

  const hasil: RiwayatAsetItem[] = [];

  type MutasiRingkas = {
    id: string;
    tanggal: string;
    disetujui_oleh: string | null;
    keterangan: string | null;
    ruangan_asal: { nama: string } | null;
    ruangan_tujuan: { nama: string } | null;
  };
  for (const m of (mutasiRes.data ?? []) as unknown as MutasiRingkas[]) {
    hasil.push({
      id: `mutasi-${m.id}`,
      jenis: "mutasi",
      teks: `Dipindah dari ${m.ruangan_asal?.nama ?? "?"} ke ${
        m.ruangan_tujuan?.nama ?? "?"
      }${m.disetujui_oleh ? ` — disetujui ${m.disetujui_oleh}` : ""}`,
      keterangan: m.keterangan,
      tanggal: m.tanggal,
    });
  }

  type PemeliharaanRingkas = {
    id: string;
    tanggal: string;
    jenis: string;
    biaya: number | null;
    keterangan: string | null;
    disetujui_oleh: string | null;
  };
  for (const p of (pemeliharaanRes.data ?? []) as unknown as PemeliharaanRingkas[]) {
    const jenisLabel = p.jenis === "perbaikan" ? "Perbaikan" : "Pemeliharaan rutin";
    hasil.push({
      id: `pemeliharaan-${p.id}`,
      jenis: "pemeliharaan",
      teks: `${jenisLabel}${p.biaya ? ` — ${formatRupiah(p.biaya)}` : ""}${
        p.disetujui_oleh ? ` (disetujui ${p.disetujui_oleh})` : ""
      }`,
      keterangan: p.keterangan,
      tanggal: p.tanggal,
    });
  }

  type PeminjamanRingkas = {
    borrow_id: string;
    tanggal_pinjam: string;
    tanggal_kembali_rencana: string;
    tanggal_kembali_aktual: string | null;
    status: string;
    atas_nama: string | null;
    catatan_pengajuan: string | null;
    peminjam: { nama: string } | null;
  };
  for (const p of (peminjamanRes.data ?? []) as unknown as PeminjamanRingkas[]) {
    const namaPeminjam = p.atas_nama || p.peminjam?.nama || "Seseorang";
    hasil.push({
      id: `peminjaman-${p.borrow_id}`,
      jenis: "peminjaman",
      teks: `Dipinjam ${namaPeminjam} — ${
        LABEL_STATUS_PINJAM[p.status] ?? p.status.toLowerCase()
      }`,
      keterangan: p.catatan_pengajuan,
      tanggal: p.tanggal_kembali_aktual ?? p.tanggal_pinjam,
    });
  }

  hasil.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  return hasil;
}

/** Semua pengguna (profil) di sekolah yang sama — RLS profil_select_satu_sekolah
 * udah ngizinin ini secara default, gak perlu service role. Dipakai di
 * halaman Pengaturan > Manajemen Pengguna. */
export async function getDaftarPengguna(): Promise<Profil[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profil")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Gagal mengambil daftar pengguna:", error.message);
    return [];
  }
  return data;
}

export async function getDaftarPeminjamanPaginated(
  params: DaftarPeminjamanParams = {}
): Promise<DaftarPeminjamanResult> {
  const {
    page = 1,
    pageSize = 15,
    search = "",
    status = "semua",
    hanyaTerlambat = false,
  } = params;
  const supabase = await createClient();

  const kataKunci = search.trim();
  const selectKlausa = kataKunci
    ? `*, aset:aset_id!inner ( id, kode_aset, nama ), peminjam:peminjam_id ( id, nama ), approver:approver_id ( id, nama )`
    : `*, aset:aset_id ( id, kode_aset, nama ), peminjam:peminjam_id ( id, nama ), approver:approver_id ( id, nama )`;

  let query = supabase
    .from("peminjaman_dengan_status")
    .select(selectKlausa, { count: "exact" });

  if (kataKunci) {
    const aman = kataKunci.replace(/[%,]/g, "");
    query = query.or(`nama.ilike.%${aman}%,kode_aset.ilike.%${aman}%`, {
      foreignTable: "aset",
    });
  }
  if (status !== "semua") {
    query = query.eq("status", status);
  }
  if (hanyaTerlambat) {
    query = query.eq("terlambat", true);
  }

  const dari = (Math.max(1, page) - 1) * pageSize;
  const sampai = dari + pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(dari, sampai);

  if (error) {
    console.error("Gagal mengambil data peminjaman:", error.message);
    return { data: [], count: 0 };
  }

  return { data: data as unknown as PeminjamanWithRelasi[], count: count ?? 0 };
}
