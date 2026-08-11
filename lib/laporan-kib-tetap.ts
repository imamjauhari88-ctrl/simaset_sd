import type { AsetTetap, JenisKib } from "@/types/database";
import { formatAngka } from "@/lib/format";

/**
 * Konfigurasi kolom laporan KIB A/C/D/E/F — satu tempat dipakai bareng
 * sama halaman cetak (HTML/print) & export Excel, biar kolomnya selalu
 * sinkron di kedua format.
 *
 * CATATAN JUJUR: kolom KIB D & E direkonstruksi dari hasil ekstraksi teks
 * PDF contoh dinas yang urutannya agak berantakan (tabel scan/OCR) — kalau
 * kak Imam lihat ada kolom yang urutan/labelnya kurang pas dibanding
 * blangko asli, kasih tau aja, gampang disesuaikan.
 */
export const JUDUL_KIB: Record<JenisKib, string> = {
  A: "Tanah",
  C: "Gedung dan Bangunan",
  D: "Jalan, Irigasi dan Jaringan",
  E: "Aset Tetap Lainnya",
  F: "Konstruksi Dalam Pengerjaan",
};

export interface KolomKib {
  label: string;
  ambil: (a: AsetTetap, i: number) => string | number;
  lebar?: number; // dipakai excel
}

function kondisiLabel(k?: string) {
  if (k === "baik") return "B";
  if (k === "kurang_baik") return "KB";
  if (k === "rusak_berat") return "RB";
  return "";
}

export const KOLOM_KIB: Record<JenisKib, KolomKib[]> = {
  A: [
    { label: "No", ambil: (_a, i) => i + 1, lebar: 4 },
    { label: "Kode Barang", ambil: (a) => a.kode_barang || "", lebar: 14 },
    { label: "Register", ambil: () => "", lebar: 10 },
    { label: "Jenis Barang/ Nama Barang", ambil: (a) => a.nama, lebar: 24 },
    { label: "Luas (M2)", ambil: (a) => a.detail.luas_m2 || "", lebar: 10 },
    { label: "Tahun Pengadaan", ambil: (a) => a.tahun || "", lebar: 10 },
    { label: "Letak/ Alamat", ambil: (a) => a.detail.letak_alamat || "", lebar: 20 },
    { label: "Status Tanah - Hak", ambil: (a) => a.detail.status_hak || "", lebar: 12 },
    { label: "Tanggal Sertifikat", ambil: () => "", lebar: 12 },
    { label: "Nomor Sertifikat", ambil: (a) => a.detail.no_sertifikat || "", lebar: 14 },
    { label: "Penggunaan", ambil: (a) => a.detail.penggunaan || "", lebar: 16 },
    { label: "Asal Usul", ambil: (a) => a.detail.asal_usul || "", lebar: 14 },
    { label: "Harga (ribuan Rp)", ambil: (a) => (a.harga ? formatAngka(a.harga) : ""), lebar: 14 },
    { label: "Keterangan", ambil: (a) => a.keterangan || "", lebar: 18 },
  ],
  C: [
    { label: "No", ambil: (_a, i) => i + 1, lebar: 4 },
    { label: "Jenis Barang/ Nama Barang", ambil: (a) => a.nama, lebar: 22 },
    { label: "Nomor Kode Barang", ambil: (a) => a.kode_barang || "", lebar: 14 },
    { label: "Register", ambil: () => "", lebar: 8 },
    { label: "Kondisi Bangunan", ambil: (a) => kondisiLabel(a.detail.kondisi), lebar: 10 },
    { label: "Bertingkat/ Tidak", ambil: (a) => a.detail.bertingkat || "", lebar: 10 },
    { label: "Beton/ Tidak", ambil: (a) => a.detail.beton || "", lebar: 10 },
    { label: "Luas Lantai (M2)", ambil: (a) => a.detail.luas_lantai_m2 || "", lebar: 10 },
    { label: "Letak/ Lokasi Alamat", ambil: (a) => a.detail.letak_lokasi || "", lebar: 18 },
    { label: "Dokumen - Tanggal", ambil: () => "", lebar: 10 },
    { label: "Dokumen - Nomor", ambil: () => "", lebar: 10 },
    { label: "Status Tanah", ambil: (a) => a.detail.status_tanah || "", lebar: 12 },
    { label: "Nomor Kode Tanah", ambil: (a) => a.detail.no_kode_tanah || "", lebar: 14 },
    { label: "Luas (M2)", ambil: (a) => a.detail.luas_m2 || "", lebar: 10 },
    { label: "Asal Usul", ambil: (a) => a.detail.asal_usul || "", lebar: 14 },
    { label: "Harga", ambil: (a) => (a.harga ? formatAngka(a.harga) : ""), lebar: 14 },
    { label: "Ket.", ambil: (a) => a.keterangan || "", lebar: 16 },
  ],
  D: [
    { label: "No", ambil: (_a, i) => i + 1, lebar: 4 },
    { label: "Kode Barang", ambil: (a) => a.kode_barang || "", lebar: 14 },
    { label: "Register", ambil: () => "", lebar: 8 },
    { label: "Jenis Barang/ Nama Barang", ambil: (a) => a.nama, lebar: 22 },
    { label: "Konstruksi", ambil: (a) => a.detail.konstruksi || "", lebar: 12 },
    { label: "Panjang (Km)", ambil: (a) => a.detail.panjang_km || "", lebar: 10 },
    { label: "Lebar (M)", ambil: (a) => a.detail.lebar_m || "", lebar: 10 },
    { label: "Luas (M2)", ambil: (a) => a.detail.luas_m2 || "", lebar: 10 },
    { label: "Letak/ Lokasi", ambil: (a) => a.detail.letak_lokasi || "", lebar: 18 },
    { label: "Dokumen - Tanggal", ambil: () => "", lebar: 10 },
    { label: "Dokumen - Nomor", ambil: () => "", lebar: 10 },
    { label: "Status Tanah", ambil: (a) => a.detail.status_tanah || "", lebar: 12 },
    { label: "Nomor Kode Tanah", ambil: (a) => a.detail.no_kode_tanah || "", lebar: 14 },
    { label: "Asal Usul", ambil: (a) => a.detail.asal_usul || "", lebar: 14 },
    { label: "Harga", ambil: (a) => (a.harga ? formatAngka(a.harga) : ""), lebar: 14 },
    { label: "Kondisi (B,KB,RB)", ambil: (a) => kondisiLabel(a.detail.kondisi), lebar: 10 },
    { label: "Ket.", ambil: (a) => a.keterangan || "", lebar: 16 },
  ],
  E: [
    { label: "No", ambil: (_a, i) => i + 1, lebar: 4 },
    { label: "Kode Barang", ambil: (a) => a.kode_barang || "", lebar: 14 },
    { label: "Register", ambil: () => "", lebar: 8 },
    { label: "Jenis Barang/ Nama Barang", ambil: (a) => a.nama, lebar: 22 },
    { label: "Judul/ Pencipta", ambil: (a) => a.detail.judul_pencipta || "", lebar: 18 },
    { label: "Spesifikasi", ambil: (a) => a.detail.spesifikasi || "", lebar: 18 },
    { label: "Bahan", ambil: (a) => a.detail.bahan || "", lebar: 10 },
    { label: "Tahun Cetak/ Pembelian", ambil: (a) => a.tahun || "", lebar: 10 },
    { label: "Asal Usul Cara Perolehan", ambil: (a) => a.detail.asal_usul || "", lebar: 16 },
    { label: "Jumlah", ambil: (a) => a.detail.jumlah || "", lebar: 10 },
    { label: "Harga", ambil: (a) => (a.harga ? formatAngka(a.harga) : ""), lebar: 14 },
    { label: "Ket.", ambil: (a) => a.keterangan || "", lebar: 16 },
  ],
  F: [
    { label: "No", ambil: (_a, i) => i + 1, lebar: 4 },
    { label: "Jenis Barang/ Nama Barang", ambil: (a) => a.nama, lebar: 22 },
    { label: "Bangunan (P,SP,D)", ambil: (a) => a.detail.bangunan_psp_d || "", lebar: 10 },
    { label: "Bertingkat/ Tidak", ambil: (a) => a.detail.bertingkat || "", lebar: 10 },
    { label: "Beton/ Tidak", ambil: (a) => a.detail.beton || "", lebar: 10 },
    { label: "Luas (M2)", ambil: (a) => a.detail.luas_m2 || "", lebar: 10 },
    { label: "Letak/ Lokasi", ambil: (a) => a.detail.letak_lokasi || "", lebar: 18 },
    { label: "Dokumen - Tanggal", ambil: () => "", lebar: 10 },
    { label: "Dokumen - Nomor", ambil: () => "", lebar: 10 },
    { label: "Tgl, Bln, Thn Tanah", ambil: () => "", lebar: 12 },
    { label: "Status Tanah", ambil: (a) => a.detail.status_tanah || "", lebar: 12 },
    { label: "Nomor Kode Tanah", ambil: (a) => a.detail.no_kode_tanah || "", lebar: 14 },
    { label: "Asal Usul Pembiayaan", ambil: (a) => a.detail.asal_usul_pembiayaan || "", lebar: 16 },
    { label: "Nilai Kontrak (Ribuan Rp)", ambil: (a) => a.detail.nilai_kontrak || "", lebar: 14 },
    { label: "Ket.", ambil: (a) => a.keterangan || "", lebar: 16 },
  ],
};

export function isJenisKib(v: string): v is JenisKib {
  return ["A", "C", "D", "E", "F"].includes(v);
}
