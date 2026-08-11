import type { AsetTetap, JenisKib } from "@/types/database";
import { formatAngka } from "@/lib/format";

/**
 * Konfigurasi kolom laporan KIB A/C/D/E/F — dipakai bareng sama halaman
 * cetak (HTML/print) & export Excel, biar kolomnya selalu sinkron.
 *
 * Headernya bertingkat 2 baris (ada kolom yang jadi 1 grup dengan
 * beberapa anak kolom di bawahnya, mis. "KONSTRUKSI BANGUNAN" pecah jadi
 * "Bertingkat/Tidak" + "Beton/Tidak") — sama persis kayak blangko dinas
 * asli, bukan header rata 1 baris.
 *
 * CATATAN JUJUR: kolom KIB E paling sulit direkonstruksi (contoh dinas
 * yang dikirim hasil scan/OCR-nya paling berantakan buat jenis ini) —
 * kalau ada yang kurang pas dibanding blangko asli, kasih tau aja.
 * KIB A, C, D, F sudah dicocokkan ulang teliti sesuai urutan nomor
 * kolom di tiap contoh PDF dan seharusnya sudah pas.
 */
export const JUDUL_KIB: Record<JenisKib, string> = {
  A: "Tanah",
  C: "Gedung dan Bangunan",
  D: "Jalan, Irigasi dan Jaringan",
  E: "Aset Tetap Lainnya",
  F: "Konstruksi Dalam Pengerjaan",
};

export interface KolomLeaf {
  label: string;
  ambil: (a: AsetTetap, i: number) => string | number;
  lebar?: number; // dipakai excel
}

export interface KolomGroup {
  label: string;
  anak: KolomLeaf[];
}

export type KolomDef = KolomLeaf | KolomGroup;

export function isGroup(k: KolomDef): k is KolomGroup {
  return "anak" in k;
}

/** Ratakan definisi kolom (termasuk yang di dalam grup) jadi list leaf
 * berurutan — dipakai buat render body tabel & export Excel, karena
 * keduanya cuma butuh urutan kolom datar, bukan strukturnya. */
export function ratakanKolom(kolom: KolomDef[]): KolomLeaf[] {
  return kolom.flatMap((k) => (isGroup(k) ? k.anak : [k]));
}

/** Label kolom buat header Excel — gabung "Grup - Anak" kalau kolomnya
 * bagian dari grup (mis. "Status Tanah - Hak"), karena Excel gak punya
 * cara natural buat nampilin header 2 baris bertingkat kayak di cetak
 * HTML; digabung jadi satu label tetap jelas konteksnya dan malah lebih
 * gampang di-filter/sort ketimbang header merge cell di Excel. */
export function labelKolomExcel(kolom: KolomDef[]): string[] {
  return kolom.flatMap((k) =>
    isGroup(k) ? k.anak.map((a) => `${k.label} - ${a.label}`) : [k.label]
  );
}

function kondisiLabel(k?: string) {
  if (k === "baik") return "B";
  if (k === "kurang_baik") return "KB";
  if (k === "rusak_berat") return "RB";
  return "";
}

function bangunanTipeLabel(a: AsetTetap, tipe: "P" | "SP" | "D") {
  return a.detail.bangunan_psp_d?.toUpperCase() === tipe ? tipe : "";
}

export const KOLOM_KIB: Record<JenisKib, KolomDef[]> = {
  // KIB A — Tanah (14 kolom leaf: NO,KODE,REGISTER,NAMA,LUAS,TAHUN,LETAK,
  // {HAK,TGL,NOMOR},PENGGUNAAN,ASAL USUL,HARGA,KET)
  A: [
    { label: "No", ambil: (_a, i) => i + 1, lebar: 4 },
    { label: "Kode Barang", ambil: (a) => a.kode_barang || "", lebar: 14 },
    { label: "Register", ambil: () => "", lebar: 10 },
    { label: "Jenis Barang/ Nama Barang", ambil: (a) => a.nama, lebar: 24 },
    { label: "Luas (M2)", ambil: (a) => a.detail.luas_m2 || "", lebar: 10 },
    { label: "Tahun Pengadaan", ambil: (a) => a.tahun || "", lebar: 10 },
    { label: "Letak/ Alamat", ambil: (a) => a.detail.letak_alamat || "", lebar: 20 },
    {
      label: "Status Tanah",
      anak: [
        { label: "Hak", ambil: (a) => a.detail.status_hak || "", lebar: 12 },
        { label: "Tanggal", ambil: () => "", lebar: 10 },
        { label: "Nomor", ambil: (a) => a.detail.no_sertifikat || "", lebar: 14 },
      ],
    },
    { label: "Penggunaan", ambil: (a) => a.detail.penggunaan || "", lebar: 16 },
    { label: "Asal Usul", ambil: (a) => a.detail.asal_usul || "", lebar: 14 },
    { label: "Harga (ribuan Rp)", ambil: (a) => (a.harga ? formatAngka(a.harga) : ""), lebar: 14 },
    { label: "Keterangan", ambil: (a) => a.keterangan || "", lebar: 18 },
  ],

  // KIB C — Gedung dan Bangunan (17 kolom leaf: NO,NAMA,{KODE,REGISTER},
  // KONDISI,{BERTINGKAT,BETON},LUAS LANTAI,LETAK,{TGL,NOMOR},STATUS TANAH,
  // NO KODE TANAH,LUAS(tanah),ASAL USUL,HARGA,KET)
  C: [
    { label: "No", ambil: (_a, i) => i + 1, lebar: 4 },
    { label: "Jenis Barang/ Nama Barang", ambil: (a) => a.nama, lebar: 22 },
    {
      label: "Nomor",
      anak: [
        { label: "Kode Barang", ambil: (a) => a.kode_barang || "", lebar: 14 },
        { label: "Register", ambil: () => "", lebar: 8 },
      ],
    },
    { label: "Kondisi Bangunan", ambil: (a) => kondisiLabel(a.detail.kondisi), lebar: 10 },
    {
      label: "Konstruksi Bangunan",
      anak: [
        { label: "Bertingkat/ Tidak", ambil: (a) => a.detail.bertingkat || "", lebar: 10 },
        { label: "Beton/ Tidak", ambil: (a) => a.detail.beton || "", lebar: 10 },
      ],
    },
    { label: "Luas Lantai (M2)", ambil: (a) => a.detail.luas_lantai_m2 || "", lebar: 10 },
    { label: "Letak/ Lokasi Alamat", ambil: (a) => a.detail.letak_lokasi || "", lebar: 18 },
    {
      label: "Dokumen Gedung",
      anak: [
        { label: "Tanggal", ambil: () => "", lebar: 10 },
        { label: "Nomor", ambil: () => "", lebar: 10 },
      ],
    },
    { label: "Status Tanah", ambil: (a) => a.detail.status_tanah || "", lebar: 12 },
    { label: "Nomor Kode Tanah", ambil: (a) => a.detail.no_kode_tanah || "", lebar: 14 },
    { label: "Luas (M2)", ambil: (a) => a.detail.luas_m2 || "", lebar: 10 },
    { label: "Asal Usul", ambil: (a) => a.detail.asal_usul || "", lebar: 14 },
    { label: "Harga", ambil: (a) => (a.harga ? formatAngka(a.harga) : ""), lebar: 14 },
    { label: "Ket.", ambil: (a) => a.keterangan || "", lebar: 16 },
  ],

  // KIB D — Jalan, Irigasi dan Jaringan (17 kolom leaf: NO,NAMA,
  // {KODE,REGISTER},KONSTRUKSI,PANJANG,LEBAR,LUAS,LETAK,{TGL,NOMOR},
  // STATUS TANAH,NO KODE TANAH,ASAL USUL,HARGA,KONDISI,KET)
  D: [
    { label: "No", ambil: (_a, i) => i + 1, lebar: 4 },
    { label: "Jenis Barang/ Nama Barang", ambil: (a) => a.nama, lebar: 22 },
    {
      label: "Nomor",
      anak: [
        { label: "Kode Barang", ambil: (a) => a.kode_barang || "", lebar: 14 },
        { label: "Register", ambil: () => "", lebar: 8 },
      ],
    },
    { label: "Konstruksi", ambil: (a) => a.detail.konstruksi || "", lebar: 12 },
    { label: "Panjang (Km)", ambil: (a) => a.detail.panjang_km || "", lebar: 10 },
    { label: "Lebar (M)", ambil: (a) => a.detail.lebar_m || "", lebar: 10 },
    { label: "Luas (M2)", ambil: (a) => a.detail.luas_m2 || "", lebar: 10 },
    { label: "Letak/ Lokasi", ambil: (a) => a.detail.letak_lokasi || "", lebar: 18 },
    {
      label: "Dokumen",
      anak: [
        { label: "Tanggal", ambil: () => "", lebar: 10 },
        { label: "Nomor", ambil: () => "", lebar: 10 },
      ],
    },
    { label: "Status Tanah", ambil: (a) => a.detail.status_tanah || "", lebar: 12 },
    { label: "Nomor Kode Tanah", ambil: (a) => a.detail.no_kode_tanah || "", lebar: 14 },
    { label: "Asal Usul", ambil: (a) => a.detail.asal_usul || "", lebar: 14 },
    { label: "Harga", ambil: (a) => (a.harga ? formatAngka(a.harga) : ""), lebar: 14 },
    { label: "Kondisi (B,KB,RB)", ambil: (a) => kondisiLabel(a.detail.kondisi), lebar: 10 },
    { label: "Ket.", ambil: (a) => a.keterangan || "", lebar: 16 },
  ],

  // KIB E — Aset Tetap Lainnya (best-effort — lihat catatan di atas file)
  E: [
    { label: "No", ambil: (_a, i) => i + 1, lebar: 4 },
    {
      label: "Nomor",
      anak: [
        { label: "Kode Barang", ambil: (a) => a.kode_barang || "", lebar: 14 },
        { label: "Register", ambil: () => "", lebar: 8 },
      ],
    },
    { label: "Jenis Barang/ Nama Barang", ambil: (a) => a.nama, lebar: 22 },
    { label: "Judul/ Pencipta", ambil: (a) => a.detail.judul_pencipta || "", lebar: 18 },
    {
      label: "Spesifikasi",
      anak: [
        {
          label: "Buku/ Perpustakaan",
          ambil: (a) => (a.detail.jenis_khusus === "buku_perpustakaan" ? "✓" : ""),
          lebar: 8,
        },
        {
          label: "Kesenian/ Kebudayaan",
          ambil: (a) => (a.detail.jenis_khusus === "kesenian_kebudayaan" ? "✓" : ""),
          lebar: 8,
        },
        {
          label: "Hewan/Ternak & Tumbuhan",
          ambil: (a) => (a.detail.jenis_khusus === "hewan_ternak_tumbuhan" ? "✓" : ""),
          lebar: 10,
        },
      ],
    },
    { label: "Bahan", ambil: (a) => a.detail.bahan || "", lebar: 10 },
    { label: "Tahun Cetak/ Pembelian", ambil: (a) => a.tahun || "", lebar: 10 },
    { label: "Asal Usul Cara Perolehan", ambil: (a) => a.detail.asal_usul || "", lebar: 16 },
    { label: "Jumlah", ambil: (a) => a.detail.jumlah || "", lebar: 10 },
    { label: "Harga", ambil: (a) => (a.harga ? formatAngka(a.harga) : ""), lebar: 14 },
    { label: "Ket.", ambil: (a) => a.keterangan || "", lebar: 16 },
  ],

  // KIB F — Konstruksi Dalam Pengerjaan (17 kolom leaf: NO,NAMA,
  // {BERTINGKAT,BETON},{P,SP,D},LUAS,LETAK,{TGL,NOMOR},TGL-BLN-THN TANAH,
  // STATUS TANAH,NO KODE TANAH,ASAL USUL PEMBIAYAAN,NILAI KONTRAK,KET)
  F: [
    { label: "No", ambil: (_a, i) => i + 1, lebar: 4 },
    { label: "Jenis Barang/ Nama Barang", ambil: (a) => a.nama, lebar: 22 },
    {
      label: "Konstruksi Bangunan",
      anak: [
        { label: "Bertingkat/ Tidak", ambil: (a) => a.detail.bertingkat || "", lebar: 10 },
        { label: "Beton/ Tidak", ambil: (a) => a.detail.beton || "", lebar: 10 },
      ],
    },
    {
      label: "Bangunan",
      anak: [
        { label: "P", ambil: (a) => bangunanTipeLabel(a, "P"), lebar: 5 },
        { label: "SP", ambil: (a) => bangunanTipeLabel(a, "SP"), lebar: 5 },
        { label: "D", ambil: (a) => bangunanTipeLabel(a, "D"), lebar: 5 },
      ],
    },
    { label: "Luas (M2)", ambil: (a) => a.detail.luas_m2 || "", lebar: 10 },
    { label: "Letak/ Lokasi", ambil: (a) => a.detail.letak_lokasi || "", lebar: 18 },
    {
      label: "Dokumen",
      anak: [
        { label: "Tanggal", ambil: () => "", lebar: 10 },
        { label: "Nomor", ambil: () => "", lebar: 10 },
      ],
    },
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
