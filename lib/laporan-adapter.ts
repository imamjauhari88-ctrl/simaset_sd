import type { AsetTetap, JenisKib, KondisiAset } from "@/types/database";
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
    sumber_dana: "lainnya",
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
