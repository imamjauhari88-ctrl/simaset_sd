import { z } from "zod";

export const asetMassalSchema = z.object({
  nama: z.string().min(1, "Nama aset wajib diisi").max(150),
  // Prefix + nomor urut digabung jadi kode_aset tiap unit, mis. prefix
  // "MBL-KURSI" + mulai 1 + jumlah 5 -> MBL-KURSI-001 s/d MBL-KURSI-005.
  kode_prefix: z
    .string()
    .min(1, "Awalan kode wajib diisi")
    .max(20, "Awalan kode maksimal 20 karakter")
    .regex(/^[A-Za-z0-9-]+$/, "Cuma boleh huruf, angka, dan tanda hubung (-)"),
  nomor_mulai: z.coerce
    .number({ invalid_type_error: "Nomor mulai harus berupa angka" })
    .int()
    .min(1, "Nomor mulai minimal 1"),
  jumlah: z.coerce
    .number({ invalid_type_error: "Jumlah harus berupa angka" })
    .int()
    .min(2, "Minimal 2 unit — kalau cuma 1, pakai Tambah Aset biasa")
    .max(300, "Maksimal 300 unit sekaligus dalam satu kali input"),
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
  catatan: z.string().max(1000).optional().or(z.literal("")),
});

export type AsetMassalFormValues = z.infer<typeof asetMassalSchema>;

export const asetMassalDefaultValues: AsetMassalFormValues = {
  nama: "",
  kode_prefix: "",
  nomor_mulai: 1,
  jumlah: 2,
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
  catatan: "",
};

/**
 * Generate daftar kode_aset berurutan dari prefix + nomor mulai + jumlah.
 * Lebar padding angka otomatis nyesuain nomor akhir (minimal 3 digit) —
 * jadi kalau nomornya sampai 4 digit (mis. mulai dari 950, jumlah 100,
 * nomor akhir 1049), paddingnya ikut jadi 4 digit semua biar tetap rapi
 * berurutan secara alfabetis (001 < 010 < 100, bukan 1 < 10 < 100 < 2).
 */
export function buatKodeAsetMassal(
  prefix: string,
  nomorMulai: number,
  jumlah: number
): string[] {
  const nomorAkhir = nomorMulai + jumlah - 1;
  const lebarDigit = Math.max(3, String(nomorAkhir).length);
  return Array.from(
    { length: jumlah },
    (_, i) => `${prefix}-${String(nomorMulai + i).padStart(lebarDigit, "0")}`
  );
}
