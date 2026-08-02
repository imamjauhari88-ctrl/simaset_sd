import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profil, Sekolah } from "@/types/database";

/**
 * Ambil profil (sekolah_id, role) user yang sedang login.
 * Query ini tunduk ke RLS `profil_select_satu_sekolah`, jadi otomatis
 * hanya berhasil untuk baris milik user itu sendiri.
 * Return null kalau belum login atau belum onboarding (belum punya profil).
 */
export async function getProfilSaya(): Promise<Profil | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profil")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data;
}

/** Ambil nama sekolah user yang login (dipakai di label cetak, dll). */
export async function getSekolahSaya(): Promise<Sekolah | null> {
  const supabase = await createClient();
  const profil = await getProfilSaya();
  if (!profil) return null;

  const { data, error } = await supabase
    .from("sekolah")
    .select("*")
    .eq("id", profil.sekolah_id)
    .single();

  if (error || !data) return null;
  return data;
}
