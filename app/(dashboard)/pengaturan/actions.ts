"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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

/**
 * Ganti role pengguna lain (guru <-> kepsek). SENGAJA gak lewat client
 * RLS biasa (policy profil_update_diri_sendiri cuma izinin update baris
 * sendiri) — ini operasi lintas-user yang cuma boleh admin, jadi pakai
 * service client + validasi manual di sini (sama pola kayak generate
 * undangan & onboarding).
 */
export async function ubahRolePengguna(
  targetId: string,
  roleBaru: RolePengguna
) {
  const profil = await getProfilSaya();
  if (!profil) throw new Error("Kamu belum terhubung ke sekolah mana pun.");
  if (profil.role !== "admin") {
    throw new Error("Hanya admin yang bisa mengubah role pengguna.");
  }
  if (targetId === profil.id) {
    throw new Error("Gak bisa ubah role sendiri lewat sini.");
  }
  if (roleBaru === "admin") {
    throw new Error("Role admin nggak bisa dipindahkan — cuma ada satu per sekolah.");
  }

  const service = createServiceClient();

  // Pastikan target beneran satu sekolah sama admin ini — jangan percaya
  // targetId mentah-mentah dari client walau sudah admin-gated di atas.
  const { data: target } = await service
    .from("profil")
    .select("sekolah_id")
    .eq("id", targetId)
    .single();

  if (!target || target.sekolah_id !== profil.sekolah_id) {
    throw new Error("Pengguna tidak ditemukan di sekolahmu.");
  }

  const { error } = await service
    .from("profil")
    .update({ role: roleBaru })
    .eq("id", targetId);

  if (error) throw new Error(error.message);

  revalidatePath("/pengaturan");
}

/**
 * Cabut akses pengguna dari sekolah ini — hapus baris `profil`-nya
 * (bukan hapus akun auth-nya). Efeknya: RLS langsung nolak semua akses
 * data sekolah buat orang itu (current_sekolah_id() jadi null), tapi dia
 * masih bisa login & lewat /onboarding kalau mau gabung/bikin sekolah
 * baru lagi nanti — bukan ke-blokir permanen dari sistem.
 */
export async function cabutAksesPengguna(targetId: string) {
  const profil = await getProfilSaya();
  if (!profil) throw new Error("Kamu belum terhubung ke sekolah mana pun.");
  if (profil.role !== "admin") {
    throw new Error("Hanya admin yang bisa mencabut akses pengguna.");
  }
  if (targetId === profil.id) {
    throw new Error("Gak bisa cabut akses akun sendiri lewat sini.");
  }

  const service = createServiceClient();

  const { data: target } = await service
    .from("profil")
    .select("sekolah_id")
    .eq("id", targetId)
    .single();

  if (!target || target.sekolah_id !== profil.sekolah_id) {
    throw new Error("Pengguna tidak ditemukan di sekolahmu.");
  }

  const { error } = await service.from("profil").delete().eq("id", targetId);

  if (error) throw new Error(error.message);

  revalidatePath("/pengaturan");
}

/**
 * Update kode lokasi sekolah — dipakai di kop cetak laporan KIB format
 * dinas. Lewat client biasa (bukan service client) karena policy
 * `sekolah_update_admin` sudah mengizinkan admin update baris
 * sekolahnya sendiri.
 */
export async function updateKodeLokasi(kodeLokasi: string) {
  const profil = await getProfilSaya();
  if (!profil) throw new Error("Kamu belum terhubung ke sekolah mana pun.");
  if (profil.role !== "admin") {
    throw new Error("Hanya admin yang bisa mengubah pengaturan sekolah.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sekolah")
    .update({ kode_lokasi: kodeLokasi.trim() || null })
    .eq("id", profil.sekolah_id);

  if (error) throw new Error(error.message);

  revalidatePath("/pengaturan");
}
