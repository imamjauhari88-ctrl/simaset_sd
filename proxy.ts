import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // manifest.webmanifest & sw.js SENGAJA ditambahkan ke exclude-list.
  // Sebelumnya keduanya ikut lolos ke updateSession() seperti halaman
  // biasa — begitu request-nya nggak bawa cookie sesi valid (browser
  // sering fetch <link rel="manifest"> TANPA credentials), proxy ini
  // ngebalikin redirect ke /login. Browser lalu nyoba parse HTML halaman
  // login itu sebagai JSON manifest -> "Line 1, column 1, Syntax error"
  // persis yang muncul di console. sw.js kena masalah serupa: kalau
  // register terjadi sebelum sesi kebentuk, isi yang keregister jadi
  // HTML redirect, bukan skrip service worker.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
