import { z } from "zod";

export const distribusiRuanganSchema = z.object({
  ruangan_id: z.string().uuid("Pilih ruangan"),
  jumlah: z.coerce
    .number({ invalid_type_error: "Jumlah harus berupa angka" })
    .int()
    .min(1, "Minimal 1 unit"),
});

export const asetMassalSchema = z.object({
  nama: z.string().min(1, "Nama aset wajib diisi").max(150),
  kategori_id: z.string().uuid("Pilih kategori"),
  // Barang yang sama bisa langsung dibagi ke beberapa ruangan sekaligus
  // dalam satu kali input (mis. 60 kursi: 15 ke Kelas 1, 8 ke Kelas 2,
  // dst — jumlahnya boleh beda-beda tiap ruangan, gak harus rata).
  // Total unit dijumlah dari semua baris distribusi ini.
  distribusi: z
    .array(distribusiRuanganSchema)
    .min(1, "Isi minimal 1 ruangan"),
  merk_tipe: z.string().max(100).optional().or(z.literal("")),
  bahan: z.string().max(100).optional().or(z.literal("")),
  kode_barang_dinas: z.string().max(60).optional().or(z.literal("")),
  // Nomor Register otomatis diurut nyambung LINTAS SEMUA ruangan di
  // distribusi (bukan diulang dari 1 tiap ruangan) — mis. 15 ke Kelas 1
  // + 8 ke Kelas 2 -> Kelas 1 dapat 0001-0015, Kelas 2 lanjut 0016-0023.
  // Ini biar pas dicetak di Buku Inventaris/KIB, batch ini kegabung
  // balik jadi 1 baris rapi "Register 0001-0023, Jumlah 23" — walau
  // fisiknya kesebar ke ruangan berbeda-beda.
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
}).refine(
  (v) => v.distribusi.reduce((total, d) => total + (Number(d.jumlah) || 0), 0) >= 2,
  {
    message: "Total unit (semua ruangan dijumlah) minimal 2 — kalau cuma 1, pakai Tambah Aset biasa",
    path: ["distribusi"],
  }
).refine(
  (v) => v.distribusi.reduce((total, d) => total + (Number(d.jumlah) || 0), 0) <= 300,
  {
    message: "Total unit (semua ruangan dijumlah) maksimal 300 sekaligus",
    path: ["distribusi"],
  }
);

export type AsetMassalFormValues = z.infer<typeof asetMassalSchema>;

export const asetMassalDefaultValues: AsetMassalFormValues = {
  nama: "",
  kategori_id: "",
  distribusi: [{ ruangan_id: "", jumlah: 2 }],
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
