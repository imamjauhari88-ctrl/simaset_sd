"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function buatSekolahBaru(formData: FormData) {
  const supabase = await createClient();
  let {
    data: { user },
  } = await supabase.auth.getUser();

  const nama = String(formData.get("nama") ?? "").trim();
  const npsn = String(formData.get("npsn") ?? "").trim() || null;
  const alamat = String(formData.get("alamat") ?? "").trim() || null;
  const namaAdmin = String(formData.get("nama_admin") ?? "").trim();

  if (!nama || !namaAdmin) {
    throw new Error("Nama sekolah dan nama kamu wajib diisi.");
  }

  // Belum login sama sekali (kunjungan pertama ke /onboarding) →
  // bikin akun dulu pakai email & password dari form ini.
  if (!user) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      throw new Error("Email dan kata sandi wajib diisi untuk bikin akun baru.");
    }

    const { data: signUpData, error: errSignUp } = await supabase.auth.signUp({
      email,
      password,
    });

    if (errSignUp || !signUpData.user) {
      throw new Error(errSignUp?.message ?? "Gagal membuat akun.");
    }

    user = signUpData.user;
  }

  // Pakai service role karena user ini belum punya `profil` sama sekali,
  // jadi belum lolos RLS mana pun untuk insert baris `sekolah`.
  const service = createServiceClient();

  const { data: sekolah, error: errSekolah } = await service
    .from("sekolah")
    .insert({ nama, npsn, alamat })
    .select("id")
    .single();

  if (errSekolah || !sekolah) {
    throw new Error(errSekolah?.message ?? "Gagal membuat data sekolah.");
  }

  const { error: errProfil } = await service.from("profil").insert({
    id: user.id,
    sekolah_id: sekolah.id,
    nama: namaAdmin,
    role: "admin",
  });

  if (errProfil) {
    throw new Error(errProfil.message);
  }

  redirect("/dashboard");
}
