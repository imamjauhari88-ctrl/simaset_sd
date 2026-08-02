import { z } from "zod";

export const pemeliharaanSchema = z.object({
  aset_id: z.string().min(1, "Pilih aset yang mau dicatat pemeliharaannya"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  jenis: z.enum(["rutin", "perbaikan"], {
    errorMap: () => ({ message: "Pilih jenis pemeliharaan" }),
  }),
  biaya: z.coerce
    .number({ invalid_type_error: "Biaya harus berupa angka" })
    .min(0, "Biaya tidak boleh negatif"),
  keterangan: z.string().max(500).optional().or(z.literal("")),
});

export type PemeliharaanFormValues = z.infer<typeof pemeliharaanSchema>;

export const pemeliharaanDefaultValues: PemeliharaanFormValues = {
  aset_id: "",
  tanggal: new Date().toISOString().slice(0, 10),
  jenis: "rutin",
  biaya: 0,
  keterangan: "",
};
