"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifikasiTokenUndangan } from "@/lib/tenant/undangan";

export async function terimaUndangan(token: string, formData: FormData) {
  const payload = await verifikasiTokenUndangan(token);
  if (!payload) {
    throw new Error("Link undangan tidak valid atau sudah kedaluwarsa.");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nama = String(formData.get("nama") ?? "").trim();

  if (!email || !password || !nama) {
    throw new Error("Semua kolom wajib diisi.");
  }

  // Service role: user yang menerima undangan belum punya `profil` sama
  // sekali, jadi belum tunduk ke RLS mana pun untuk tabel `undangan`.
  const service = createServiceClient();

  // Klaim baris undangan secara atomik SEBELUM bikin akun: `update ...
  // where dipakai_at is null` cuma akan berhasil sekali walau dua orang
  // buka link yang sama nyaris bersamaan — race condition-nya ditutup di
  // level database, bukan cek-lalu-tulis di kode app yang bisa keduluan.
  const { data: diklaim, error: errKlaim } = await service
    .from("undangan")
    .update({ dipakai_at: new Date().toISOString() })
    .eq("id", payload.undanganId)
    .is("dipakai_at", null)
    .gt("kedaluwarsa_at", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (errKlaim || !diklaim) {
    throw new Error(
      "Link undangan ini sudah pernah dipakai untuk mendaftar atau sudah kedaluwarsa. Minta admin sekolahmu kirim ulang undangan baru."
    );
  }

  const supabase = await createClient();
  const { data: signUpData, error: errSignUp } = await supabase.auth.signUp({
    email,
    password,
  });

  if (errSignUp || !signUpData.user) {
    // Gagal bikin akun (mis. email sudah terdaftar) — lepas lagi klaimnya
    // supaya link masih bisa dipakai untuk percobaan berikutnya.
    await service
      .from("undangan")
      .update({ dipakai_at: null })
      .eq("id", payload.undanganId);
    throw new Error(errSignUp?.message ?? "Gagal membuat akun.");
  }

  const { error: errProfil } = await service.from("profil").insert({
    id: signUpData.user.id,
    sekolah_id: payload.sekolahId,
    nama,
    role: payload.role,
  });

  if (errProfil) {
    await service
      .from("undangan")
      .update({ dipakai_at: null })
      .eq("id", payload.undanganId);
    throw new Error(errProfil.message);
  }

  // Catat siapa yang memakai link ini (best-effort — dipakai_at di atas
  // sudah cukup untuk mencegah pemakaian ulang walau baris ini gagal).
  await service
    .from("undangan")
    .update({ dipakai_oleh: signUpData.user.id })
    .eq("id", payload.undanganId);

  redirect("/dashboard");
}
