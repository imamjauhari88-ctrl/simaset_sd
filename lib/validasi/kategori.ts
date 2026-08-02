import { z } from "zod";

export const kategoriSchema = z.object({
  nama: z.string().min(1, "Nama kategori wajib diisi").max(100),
  kode_kib: z.string().max(20).optional().or(z.literal("")),
});

export type KategoriFormValues = z.infer<typeof kategoriSchema>;

export const kategoriDefaultValues: KategoriFormValues = {
  nama: "",
  kode_kib: "",
};
