import { z } from "zod";

export const peminjamanSchema = z.object({
  aset_id: z.string().min(1, "Pilih aset yang mau dipinjam"),
  qty: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  tanggal_kembali_rencana: z.string().min(1, "Rencana tanggal kembali wajib diisi"),
  atas_nama: z.string().max(100).optional().or(z.literal("")),
  catatan_pengajuan: z.string().max(500).optional().or(z.literal("")),
});

export type PeminjamanFormValues = z.infer<typeof peminjamanSchema>;

export const peminjamanDefaultValues: PeminjamanFormValues = {
  aset_id: "",
  qty: 1,
  tanggal_kembali_rencana: new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .slice(0, 10),
  atas_nama: "",
  catatan_pengajuan: "",
};
