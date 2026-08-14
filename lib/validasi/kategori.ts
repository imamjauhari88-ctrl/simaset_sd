import { z } from "zod";

export const kategoriSchema = z.object({
  nama: z.string().min(1, "Nama kategori wajib diisi").max(100),
  kode_kib: z.enum(["A", "B", "C", "D", "E", "F", ""]).optional(),
});

export type KategoriFormValues = z.infer<typeof kategoriSchema>;

export const kategoriDefaultValues: KategoriFormValues = {
  nama: "",
  kode_kib: "",
};

/** Label lengkap tiap jenis KIB — dipakai di dropdown Kategori & juga
 * dipakai balik di halaman Laporan biar labelnya konsisten. */
export const LABEL_KODE_KIB: Record<string, string> = {
  A: "KIB A — Tanah",
  B: "KIB B — Peralatan dan Mesin",
  C: "KIB C — Gedung dan Bangunan",
  D: "KIB D — Jalan, Irigasi dan Jaringan",
  E: "KIB E — Aset Tetap Lainnya",
  F: "KIB F — Konstruksi Dalam Pengerjaan",
};
