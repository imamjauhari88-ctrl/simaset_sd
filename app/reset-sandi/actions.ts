"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function perbaruiSandi(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
  const konfirmasi = String(formData.get("konfirmasi") ?? "");

  if (!password || password.length < 6) {
    return { error: "Kata sandi minimal 6 karakter." };
  }
  if (password !== konfirmasi) {
    return { error: "Konfirmasi kata sandi gak cocok." };
  }

  const supabase = await createClient();

  // Sesi di titik ini datang dari exchangeCodeForSession di
  // /auth/callback (link yang diklik dari email) — bukan login manual.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Sesi reset kata sandi sudah kedaluwarsa. Minta link baru.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
