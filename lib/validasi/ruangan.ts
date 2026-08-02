import { z } from "zod";

export const ruanganSchema = z.object({
  nama: z.string().min(1, "Nama ruangan wajib diisi").max(100),
  keterangan: z.string().max(255).optional().or(z.literal("")),
});

export type RuanganFormValues = z.infer<typeof ruanganSchema>;

export const ruanganDefaultValues: RuanganFormValues = {
  nama: "",
  keterangan: "",
};
