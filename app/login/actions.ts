"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdminEmail } from "@/lib/super-admin";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Pesan Supabase apa adanya biar jelas: salah password / user belum ada / dst.
    return { error: error.message };
  }

  // Super admin (developer platform) gak punya `profil`/sekolah sama
  // sekali — kalau dilempar ke /dashboard kayak user biasa, middleware
  // bakal nyasarin dia ke /onboarding (karena "belum punya profil").
  // Cek duluan di sini biar langsung ke tempat yang benar.
  if (isSuperAdminEmail(email)) {
    redirect("/super-admin");
  }

  // proxy.ts yang urus lanjutannya: kalau belum punya `profil`,
  // otomatis dilempar ke /onboarding; kalau sekolahnya belum di-approve,
  // ke /menunggu-approval; kalau udah, ke /dashboard.
  redirect("/dashboard");
}
