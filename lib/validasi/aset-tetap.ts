import { z } from "zod";

export const jenisKibSchema = z.enum(["A", "C", "D", "E", "F"]);

export const asetTetapSchema = z.object({
  jenis_kib: jenisKibSchema,
  kode_barang: z.string().max(60).optional().or(z.literal("")),
  nama: z.string().min(1, "Nama barang wajib diisi").max(200),
  tahun: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("")),
  harga: z.coerce.number().min(0).optional().or(z.literal("")),
  keterangan: z.string().max(500).optional().or(z.literal("")),

  // Detail — semua opsional, dipakai/ditampilkan sesuai jenis_kib yang
  // dipilih (lihat AsetTetapDetail di types/database.ts untuk field
  // mana yang relevan buat jenis mana).
  luas_m2: z.string().max(40).optional().or(z.literal("")),
  letak_alamat: z.string().max(200).optional().or(z.literal("")),
  status_hak: z.string().max(100).optional().or(z.literal("")),
  tanggal_sertifikat: z.string().max(20).optional().or(z.literal("")),
  no_sertifikat: z.string().max(100).optional().or(z.literal("")),
  penggunaan: z.string().max(200).optional().or(z.literal("")),
  asal_usul: z.string().max(200).optional().or(z.literal("")),
  kondisi: z.enum(["baik", "kurang_baik", "rusak_berat"]).optional(),
  bertingkat: z.string().max(20).optional().or(z.literal("")),
  beton: z.string().max(20).optional().or(z.literal("")),
  luas_lantai_m2: z.string().max(40).optional().or(z.literal("")),
  letak_lokasi: z.string().max(200).optional().or(z.literal("")),
  status_tanah: z.string().max(100).optional().or(z.literal("")),
  no_kode_tanah: z.string().max(100).optional().or(z.literal("")),
  dokumen_tanggal: z.string().max(20).optional().or(z.literal("")),
  dokumen_nomor: z.string().max(100).optional().or(z.literal("")),
  konstruksi: z.string().max(100).optional().or(z.literal("")),
  panjang_km: z.string().max(40).optional().or(z.literal("")),
  lebar_m: z.string().max(40).optional().or(z.literal("")),
  jenis_khusus: z
    .enum(["kesenian_kebudayaan", "hewan_ternak_tumbuhan", "buku_perpustakaan", "lainnya"])
    .optional(),
  judul_pencipta: z.string().max(200).optional().or(z.literal("")),
  bahan: z.string().max(100).optional().or(z.literal("")),
  jumlah: z.string().max(40).optional().or(z.literal("")),
  bangunan_psp_d: z.enum(["P", "SP", "D"]).optional(),
  tgl_bln_thn_tanah: z.string().max(20).optional().or(z.literal("")),
  asal_usul_pembiayaan: z.string().max(200).optional().or(z.literal("")),
  nilai_kontrak: z.string().max(60).optional().or(z.literal("")),
});

export type AsetTetapFormValues = z.infer<typeof asetTetapSchema>;

export function asetTetapDefaultValues(jenis: AsetTetapFormValues["jenis_kib"]): AsetTetapFormValues {
  return {
    jenis_kib: jenis,
    kode_barang: "",
    nama: "",
    tahun: "",
    harga: "",
    keterangan: "",
    luas_m2: "",
    letak_alamat: "",
    status_hak: "",
    tanggal_sertifikat: "",
    no_sertifikat: "",
    penggunaan: "",
    asal_usul: "",
    kondisi: undefined,
    bertingkat: "",
    beton: "",
    luas_lantai_m2: "",
    letak_lokasi: "",
    status_tanah: "",
    no_kode_tanah: "",
    dokumen_tanggal: "",
    dokumen_nomor: "",
    konstruksi: "",
    panjang_km: "",
    lebar_m: "",
    jenis_khusus: undefined,
    judul_pencipta: "",
    bahan: "",
    jumlah: "",
    bangunan_psp_d: undefined,
    tgl_bln_thn_tanah: "",
    asal_usul_pembiayaan: "",
    nilai_kontrak: "",
  };
}

/** Nama & label per jenis KIB — dipakai buat judul tab/form/laporan. */
export const LABEL_JENIS_KIB: Record<string, { pendek: string; label: string }> = {
  A: { pendek: "KIB A", label: "Tanah" },
  C: { pendek: "KIB C", label: "Gedung dan Bangunan" },
  D: { pendek: "KIB D", label: "Jalan, Irigasi dan Jaringan" },
  E: { pendek: "KIB E", label: "Aset Tetap Lainnya" },
  F: { pendek: "KIB F", label: "Konstruksi Dalam Pengerjaan" },
};
