import type { AsetTetap, JenisKib, KondisiAset, SumberDana } from "@/types/database";
import type { AsetWithRelasi } from "@/lib/supabase/queries";

/**
 * Sekarang `kategori_aset.kode_kib` (A-F) adalah kunci routing beneran
 * buat laporan KIB — bukan cuma teks informatif. Konsekuensinya: satu
 * huruf KIB bisa punya data dari DUA sumber sekaligus:
 *   - `aset` (Data Aset harian) — buat kategori yang ditandai huruf itu
 *   - `aset_tetap` (Aset Tetap Khusus) — cuma ada buat huruf A/C/D/E/F
 * Dua adapter di bawah nyeragamin bentuknya biar bisa digabung & lewat
 * kolom laporan yang SAMA (gak perlu duplikat logic kolom per sumber).
 */

/** Aset (Data Aset) → bentuk AsetTetap — dipakai pas nge-render Aset
 * biasa lewat kolom laporan KIB A/C/D/E/F (lib/laporan-kib-tetap.ts),
 * yang aslinya dirancang buat baris Aset Tetap Khusus. Field yang gak
 * ada padanannya (mis. luas tanah) otomatis kosong — itu wajar, karena
 * barang harian emang gak punya data semacam itu. */
export function tetapDariAset(a: AsetWithRelasi, jenisKib: JenisKib): AsetTetap {
  return {
    id: a.id,
    sekolah_id: a.sekolah_id,
    jenis_kib: jenisKib,
    kode_barang: a.kode_barang_dinas || a.kode_aset,
    nomor_register: a.nomor_register,
    nama: a.nama,
    tahun: a.tahun_perolehan,
    harga: a.harga_perolehan,
    keterangan: a.catatan,
    detail: {
      bahan: a.bahan ?? undefined,
      kondisi: kondisiKeGayaTetap(a.kondisi),
    },
    dibuat_oleh: a.dibuat_oleh,
    created_at: a.created_at,
    updated_at: a.updated_at,
  };
}

/** Aset Tetap Khusus → bentuk AsetWithRelasi-lite — dipakai pas Buku
 * Inventaris (yang kolomnya berbasis Aset biasa) ikut nampilin baris
 * dari Aset Tetap Khusus. Field yang gak ada padanannya (sumber_dana,
 * stok, dst) diisi nilai default yang masuk akal, bukan dipaksa null,
 * biar gak nabrak tipe `Aset` yang non-optional. */
export function asetDariTetap(a: AsetTetap): AsetWithRelasi {
  return {
    id: a.id,
    sekolah_id: a.sekolah_id,
    kode_aset: a.kode_barang ?? a.id.slice(0, 8),
    nama: a.nama,
    kategori_id: "",
    ruangan_id: "",
    merk_tipe: null,
    tahun_perolehan: a.tahun ?? 0,
    sumber_dana: sumberDanaDariAsalUsul(a.detail.asal_usul || a.detail.asal_usul_pembiayaan),
    harga_perolehan: a.harga,
    kondisi: kondisiKeGayaAset(a.detail.kondisi),
    stok: 1,
    foto_url: null,
    foto_public_id: null,
    catatan: a.keterangan,
    kode_barang_dinas: a.kode_barang,
    nomor_register: a.nomor_register,
    no_sertifikat_dll: null,
    ukuran_konstruksi: a.detail.luas_m2 ?? null,
    bahan: a.detail.bahan ?? null,
    dibuat_oleh: a.dibuat_oleh,
    created_at: a.created_at,
    updated_at: a.updated_at,
    kategori_aset: null,
    ruangan: null,
  };
}

/** Sama kayak tetapDariAset, tapi buat SEKUMPULAN baris Aset sekaligus
 * — barang identik digabung 1 baris dulu (gabungkanBarisSerupa) sebelum
 * diadaptasi, biar batch (mis. 20 buku identik ditandai KIB E) juga
 * muncul ringkas 1 baris di laporan KIB, bukan 20 baris terpisah. */
export function tetapTergabungDariAset(
  daftar: AsetWithRelasi[],
  jenisKib: JenisKib
): AsetTetap[] {
  return gabungkanBarisSerupa(daftar).map(({ contoh, jumlah, hargaTotal, registerGabungan }) => {
    const hasil = tetapDariAset(contoh, jenisKib);
    hasil.nomor_register = registerGabungan || null;
    hasil.harga = hargaTotal;
    if (jumlah > 1) hasil.detail = { ...hasil.detail, jumlah: String(jumlah) };
    return hasil;
  });
}

function kondisiKeGayaTetap(k: KondisiAset): "baik" | "kurang_baik" | "rusak_berat" {
  if (k === "baik") return "baik";
  if (k === "rusak_berat") return "rusak_berat";
  return "kurang_baik";
}

function kondisiKeGayaAset(k?: "baik" | "kurang_baik" | "rusak_berat"): KondisiAset {
  if (k === "rusak_berat") return "rusak_berat";
  if (k === "baik") return "baik";
  return "rusak_ringan";
}

/** Aset Tetap Khusus nyimpen "Asal Usul" sebagai teks bebas (user
 * ketik manual, mis. "Beli", "Bantuan", "Swadana") — bukan pilihan
 * dari dropdown Sumber Dana kayak di Data Aset biasa. Biar pas masuk
 * Buku Inventaris teks yang diketik itu ketangkep (bukan selalu jatuh
 * ke "Lainnya"), dicocokin ke kata kunci yang paling deket ke opsi
 * Sumber Dana yang ada. Kalau gak ketemu kata kunci apapun, baru
 * bener-bener jatuh ke "Lainnya". */
function sumberDanaDariAsalUsul(teks?: string): SumberDana {
  const t = (teks || "").toLowerCase();
  if (t.includes("apbd")) return "apbd";
  if (t.includes("bos")) return "bos";
  if (t.includes("hibah") || t.includes("bantuan")) return "hibah";
  if (t.includes("swadaya") || t.includes("swadana")) return "swadaya";
  if (t.includes("beli") || t.includes("pembelian")) return "bos";
  return "lainnya";
}

/**
 * Gabungin baris-baris Aset yang identik (nama/kategori/ruangan/kode
 * barang/merk/tahun/harga/kondisi/dll sama semua, cuma beda kode_aset &
 * register-nya) jadi SATU baris laporan — persis konvensi blangko dinas:
 * batch 90 kursi dicatat 1 baris "Register: 0001-0090", bukan 90 baris
 * terpisah. Kolom "Register" tetap ngasih tau jumlahnya secara implisit
 * lewat rentang itu sendiri (sama kayak contoh dinas asli), sementara
 * `jumlah` & `hargaTotal` di sini dipakai laporan yang emang punya kolom
 * Jumlah/Harga eksplisit (mis. Buku Inventaris).
 *
 * Data individu per unit (kode_aset, kondisi per-unit, riwayat
 * pemeliharaan/peminjaman) TETAP granular di database — ini cuma
 * ngerapiin TAMPILAN laporannya aja, gak ngubah data aslinya.
 */
export interface BarisTergabung {
  contoh: AsetWithRelasi;
  jumlah: number;
  hargaTotal: number;
  registerGabungan: string;
}

export function gabungkanBarisSerupa(daftar: AsetWithRelasi[]): BarisTergabung[] {
  const grup = new Map<string, AsetWithRelasi[]>();

  for (const a of daftar) {
    // Sengaja TANPA ruangan_id — Buku Inventaris & KIB gak punya kolom
    // Ruangan sama sekali (itu domainnya laporan KIR/Kartu Inventaris
    // Ruangan yang emang per-ruangan). Kalau ruangan_id ikut jadi kunci
    // pembeda, 60 kursi yang sama tapi kesebar ke 6 kelas bakal muncul
    // 6 baris identik tanpa ada kolom yang nunjukkin bedanya di mana —
    // ngebingungin, bukan makin rapi. Barang yang sama persis TETAP
    // digabung 1 baris di laporan ini walau lokasi fisiknya kesebar.
    const kunci = [
      a.nama,
      a.kategori_id,
      a.kode_barang_dinas ?? "",
      a.merk_tipe ?? "",
      a.bahan ?? "",
      a.tahun_perolehan,
      a.harga_perolehan,
      a.kondisi,
      a.sumber_dana,
      a.no_sertifikat_dll ?? "",
      a.ukuran_konstruksi ?? "",
      a.catatan ?? "",
    ].join("\u0001");

    const existing = grup.get(kunci);
    if (existing) existing.push(a);
    else grup.set(kunci, [a]);
  }

  return Array.from(grup.values())
    .map((items) => ({
      contoh: items[0],
      jumlah: items.length,
      hargaTotal: items[0].harga_perolehan * items.length,
      registerGabungan: ringkasRegister(
        items.map((i) => i.nomor_register).filter((r): r is string => !!r)
      ),
      _urutan: items[0].created_at,
    }))
    .sort((a, b) => a._urutan.localeCompare(b._urutan))
    .map(({ _urutan: _abaikan, ...sisanya }) => sisanya);
}

/** "0001","0002","0004",..,"0011" -> "0001-0002, 0004-0011". Gabungin
 * tiap kelompok angka yang beruntun jadi satu rentang sendiri-sendiri,
 * dipisah koma antar kelompok — konvensi umum nulis rentang nomor yang
 * ada bolongnya (mis. 100 kursi, cuma 2 yang kondisinya beda, jadi
 * kepisah grup — daripada nulis 98 angka satu-satu, cukup "0001-0002,
 * 0004-0100"). Kalau bukan angka murni sama sekali (format aneh),
 * digabung koma apa adanya. */
function ringkasRegister(list: string[]): string {
  if (list.length === 0) return "";
  const terurut = [...list].sort();
  if (terurut.length === 1) return terurut[0];

  const semuaAngka = terurut.every((s) => /^\d+$/.test(s));
  if (!semuaAngka) return terurut.join(", ");

  const lebarDigit = terurut[0].length;
  const angka = terurut.map(Number).sort((a, b) => a - b);

  const kelompok: [number, number][] = [];
  let awal = angka[0];
  let prev = angka[0];
  for (let i = 1; i <= angka.length; i++) {
    const now = angka[i];
    if (now === prev + 1) {
      prev = now;
      continue;
    }
    kelompok.push([awal, prev]);
    awal = now;
    prev = now;
  }

  const tulis = (n: number) => String(n).padStart(lebarDigit, "0");
  return kelompok
    .map(([a, b]) => (a === b ? tulis(a) : `${tulis(a)}-${tulis(b)}`))
    .join(", ");
}
