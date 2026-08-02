"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  // proxy.ts yang urus lanjutannya: kalau belum punya `profil`,
  // otomatis dilempar ke /onboarding; kalau sudah, ke /dashboard.
  redirect("/dashboard");
}
