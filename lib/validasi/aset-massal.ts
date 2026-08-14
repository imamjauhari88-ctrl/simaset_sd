import { z } from "zod";

export const asetMassalSchema = z.object({
  nama: z.string().min(1, "Nama aset wajib diisi").max(150),
  jumlah: z.coerce
    .number({ invalid_type_error: "Jumlah harus berupa angka" })
    .int()
    .min(2, "Minimal 2 unit — kalau cuma 1, pakai Tambah Aset biasa")
    .max(300, "Maksimal 300 unit sekaligus dalam satu kali input"),
  kategori_id: z.string().uuid("Pilih kategori"),
  ruangan_id: z.string().uuid("Pilih ruangan"),
  merk_tipe: z.string().max(100).optional().or(z.literal("")),
  bahan: z.string().max(100).optional().or(z.literal("")),
  kode_barang_dinas: z.string().max(60).optional().or(z.literal("")),
  // Nomor Register otomatis diurut per unit (mis. mulai 1 + jumlah 90 ->
  // 0001 s/d 0090), bukan diisi manual sebagai teks bebas — soalnya
  // tiap barang harusnya punya nomor register sendiri-sendiri dalam
  // batch, bukan semua kebagian teks rentang yang sama persis.
  register_mulai: z.coerce
    .number({ invalid_type_error: "Nomor register mulai harus berupa angka" })
    .int()
    .min(1, "Nomor register mulai minimal 1")
    .optional()
    .or(z.literal("")),
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
  catatan: z.string().max(1000).optional().or(z.literal("")),
});

export type AsetMassalFormValues = z.infer<typeof asetMassalSchema>;

export const asetMassalDefaultValues: AsetMassalFormValues = {
  nama: "",
  jumlah: 2,
  kategori_id: "",
  ruangan_id: "",
  merk_tipe: "",
  bahan: "",
  kode_barang_dinas: "",
  register_mulai: "",
  no_sertifikat_dll: "",
  ukuran_konstruksi: "",
  tahun_perolehan: new Date().getFullYear(),
  sumber_dana: "bos",
  harga_perolehan: 0,
  kondisi: "baik",
  catatan: "",
};

/**
 * Nomor Register per unit, diurut otomatis dari nomor mulai — mis.
 * mulai=1, jumlah=90 -> "0001".."0090". Register di blangko dinas emang
 * cuma angka polos (gak pakai prefix kayak kode_aset dulu), dan lebar
 * digit minimal 4 — samain sama konvensi di semua contoh blangko dinas
 * ("0001-0003", "0001-0097", dst selalu 4 digit).
 */
export function buatRegisterMassal(nomorMulai: number, jumlah: number): string[] {
  const nomorAkhir = nomorMulai + jumlah - 1;
  const lebarDigit = Math.max(4, String(nomorAkhir).length);
  return Array.from({ length: jumlah }, (_, i) =>
    String(nomorMulai + i).padStart(lebarDigit, "0")
  );
}
