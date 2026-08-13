import { z } from "zod";

export const asetSchema = z.object({
  kode_aset: z
    .string()
    .min(1, "Kode aset wajib diisi")
    .max(30, "Kode aset maksimal 30 karakter"),
  nama: z.string().min(1, "Nama aset wajib diisi").max(150),
  kategori_id: z.string().uuid("Pilih kategori"),
  ruangan_id: z.string().uuid("Pilih ruangan"),
  merk_tipe: z.string().max(100).optional().or(z.literal("")),
  kode_barang_dinas: z.string().max(60).optional().or(z.literal("")),
  nomor_register: z.string().max(60).optional().or(z.literal("")),
  no_sertifikat_dll: z.string().max(150).optional().or(z.literal("")),
  ukuran_konstruksi: z.string().max(100).optional().or(z.literal("")),
  tahun_perolehan: z.coerce
    .number({ invalid_type_error: "Tahun harus berupa angka" })
    .int()
    .min(1990, "Tahun tidak valid")
    .max(new Date().getFullYear(), "Tahun tidak boleh di masa depan"),
  sumber_dana: z.enum(["bos", "apbd", "hibah", "swadaya", "lainnya"], {
    errorMap: () => ({ message: "Pilih sumber dana" }),
  }),
  harga_perolehan: z.coerce
    .number({ invalid_type_error: "Harga harus berupa angka" })
    .min(0, "Harga tidak boleh negatif"),
  kondisi: z.enum(["baik", "rusak_ringan", "rusak_berat"], {
    errorMap: () => ({ message: "Pilih kondisi" }),
  }),
  foto_url: z.string().url().optional().or(z.literal("")).nullable(),
  foto_public_id: z.string().optional().or(z.literal("")).nullable(),
  catatan: z.string().max(1000).optional().or(z.literal("")),
});

export type AsetFormValues = z.infer<typeof asetSchema>;

export const asetDefaultValues: AsetFormValues = {
  kode_aset: "",
  nama: "",
  kategori_id: "",
  ruangan_id: "",
  merk_tipe: "",
  kode_barang_dinas: "",
  nomor_register: "",
  no_sertifikat_dll: "",
  ukuran_konstruksi: "",
  tahun_perolehan: new Date().getFullYear(),
  sumber_dana: "bos",
  harga_perolehan: 0,
  kondisi: "baik",
  foto_url: "",
  foto_public_id: "",
  catatan: "",
};
