"use server";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function kirimEmailResetSandi(
  _prevState: { pesan?: string; error?: string },
  formData: FormData
): Promise<{ pesan?: string; error?: string }> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-sandi`,
  });

  // Kalau ada error dicatat di server buat debugging, TAPI pesan ke user
  // SENGAJA selalu sama persis baik email-nya beneran terdaftar atau
  // enggak — kalau dibedain ("email gak ditemukan" vs "email terkirim"),
  // itu jadi celah buat orang lain nebak-nebak email siapa aja yang
  // punya akun di sistem ini (user enumeration).
  if (error) {
    console.error("Gagal kirim email reset sandi:", error.message);
  }

  return {
    pesan:
      "Kalau email itu terdaftar, kami udah kirim link reset kata sandi. Cek inbox (atau folder spam) kamu.",
  };
}
