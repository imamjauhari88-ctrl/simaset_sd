import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Titik singgah semua link yang dikirim lewat email Supabase Auth (reset
 * password, dst) — link itu berisi `?code=...` yang harus ditukar jadi
 * sesi lewat exchangeCodeForSession SEBELUM redirect ke halaman
 * tujuannya. Ini WAJIB kejadian di server (route handler), bukan di
 * client, karena exchangeCodeForSession perlu nulis cookie sesi.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const url = new URL("/login", origin);
  url.searchParams.set("error", "link-tidak-valid");
  return NextResponse.redirect(url);
}
