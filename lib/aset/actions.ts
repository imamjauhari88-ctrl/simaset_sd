"use server";

import { createClient } from "@/lib/supabase/server";
import { hapusFotoCloudinary } from "@/lib/cloudinary-server";

/**
 * Hapus foto lama aset di Cloudinary saat foto diganti (atau dihapus
 * tanpa diganti). Dipanggil dari FormAset SETELAH `useSimpanAset` sukses
 * update baris `aset`-nya — sengaja bukan sebelum/bersamaan, supaya kalau
 * update aset gagal, foto lama yang masih dipakai baris itu tidak ikut
 * kehapus (baris aset dan foto Cloudinary-nya tetap konsisten).
 *
 * Nggak perlu cek kepemilikan sekolah/RLS di sini: publicId Cloudinary
 * bukan data per-tenant yang dibaca/ditulis dari DB, cuma nama file
 * gambar yang mau dibuang — satu-satunya syarat adalah pemanggilnya user
 * yang sudah login (bukan endpoint publik tanpa auth sama sekali), yang
 * dicek lewat sesi Supabase di bawah.
 */
export async function hapusFotoLamaAset(publicId: string | null | undefined) {
  if (!publicId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Harus login untuk menghapus foto.");
  }

  await hapusFotoCloudinary(publicId);
}
