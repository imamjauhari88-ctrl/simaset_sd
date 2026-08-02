import { z } from "zod";

export const mutasiSchema = z.object({
  aset_id: z.string().min(1, "Pilih aset yang mau dipindah"),
  ruangan_tujuan_id: z.string().min(1, "Pilih ruangan tujuan"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  disetujui_oleh: z.string().max(100).optional().or(z.literal("")),
  keterangan: z.string().max(500).optional().or(z.literal("")),
});

export type MutasiFormValues = z.infer<typeof mutasiSchema>;

export const mutasiDefaultValues: MutasiFormValues = {
  aset_id: "",
  ruangan_tujuan_id: "",
  tanggal: new Date().toISOString().slice(0, 10),
  disetujui_oleh: "",
  keterangan: "",
};
