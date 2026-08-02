"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfilSaya } from "@/lib/tenant/context";
import { buatTokenUndangan } from "@/lib/tenant/undangan";
import { env } from "@/lib/env";
import type { RolePengguna } from "@/types/database";

const TUJUH_HARI_MS = 7 * 24 * 60 * 60 * 1000;

export async function generateLinkUndangan(
  role: RolePengguna
): Promise<string> {
  const profil = await getProfilSaya();

  if (!profil) throw new Error("Kamu belum terhubung ke sekolah mana pun.");
  if (profil.role !== "admin") {
    throw new Error("Hanya admin yang bisa mengundang pengguna baru.");
  }
  if (role === "admin") {
    throw new Error("Role admin nggak bisa diundang — cuma ada satu per sekolah.");
  }

  // Catat baris undangan dulu (RLS: cuma admin sekolah sendiri yang boleh
  // insert) — baris inilah yang jadi sumber kebenaran "sudah dipakai apa
  // belum", supaya link cuma bisa dipakai untuk SATU kali pendaftaran.
  const supabase = await createClient();
  const { data: undangan, error } = await supabase
    .from("undangan")
    .insert({
      role,
      dibuat_oleh: profil.id,
      kedaluwarsa_at: new Date(Date.now() + TUJUH_HARI_MS).toISOString(),
    })
    .select("id")
    .single();

  if (error || !undangan) {
    throw new Error(error?.message ?? "Gagal membuat link undangan.");
  }

  const token = await buatTokenUndangan({
    undanganId: undangan.id,
    sekolahId: profil.sekolah_id,
    role,
    diundangOleh: profil.id,
  });

  return `${env.NEXT_PUBLIC_APP_URL}/undangan/${token}`;
}
