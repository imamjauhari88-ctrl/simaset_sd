"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/super-admin-guard";
import { createServiceClient } from "@/lib/supabase/service";

export async function setujuiSekolah(sekolahId: string) {
  await requireSuperAdmin();

  const service = createServiceClient();
  const { error } = await service
    .from("sekolah")
    .update({ status: "aktif", disetujui_at: new Date().toISOString() })
    .eq("id", sekolahId);

  if (error) throw new Error(error.message);

  revalidatePath("/super-admin");
}

export async function tolakSekolah(sekolahId: string, alasan: string) {
  await requireSuperAdmin();

  if (!alasan.trim()) {
    throw new Error("Alasan penolakan wajib diisi.");
  }

  const service = createServiceClient();
  const { error } = await service
    .from("sekolah")
    .update({ status: "ditolak", ditolak_alasan: alasan.trim() })
    .eq("id", sekolahId);

  if (error) throw new Error(error.message);

  revalidatePath("/super-admin");
}

/** Balikin sekolah yang kepencet tolak/approve keliru ke antrean semula. */
export async function kembalikanKeAntrean(sekolahId: string) {
  await requireSuperAdmin();

  const service = createServiceClient();
  const { error } = await service
    .from("sekolah")
    .update({
      status: "menunggu_approval",
      disetujui_at: null,
      ditolak_alasan: null,
    })
    .eq("id", sekolahId);

  if (error) throw new Error(error.message);

  revalidatePath("/super-admin");
}
