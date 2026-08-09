import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdminEmail } from "@/lib/super-admin";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const publikTanpaAuth =
    path.startsWith("/login") ||
    path.startsWith("/undangan") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/lupa-sandi") ||
    path.startsWith("/auth/callback");

  // Sekolah baru sekarang langsung 'aktif' pas daftar (tanpa approval
  // super admin) — satu-satunya cara status jadi bukan 'aktif' sekarang
  // adalah di-suspend, makanya halamannya dinamai /akun-nonaktif.
  const halamanAkunNonaktif = path.startsWith("/akun-nonaktif");

  // /reset-sandi beda dari yang di atas: WAJIB ada sesi (cuma bisa
  // dicapai lewat link reset yang diklik, yang bikin sesi recovery
  // sementara lewat /auth/callback) — tapi sengaja dikecualikan dari
  // cek profil/sekolah di bawah, karena orang yang lagi reset password
  // belum tentu udah py sekolah, jangan disela alurnya.
  const halamanResetSandi = path.startsWith("/reset-sandi");

  // /super-admin: jalur proteksi TERPISAH TOTAL dari sistem tenant biasa
  // (super admin dicek dari email allowlist, bukan dari `profil`/RLS
  // per-sekolah — lihat lib/super-admin.ts). Lolos dari !user check di
  // bawah kalau memang email-nya cocok; kalau enggak, tetap kelempar ke
  // /login sama seperti halaman terproteksi lain.
  // Include juga /api/super-admin/* (mis. route export Excel) — kalau
  // enggak, path-nya gak ke-match "/super-admin" (karena diawali /api),
  // trus kena cabang "super admin nyasar ke path tenant" di bawah dan
  // ke-redirect balik ke /super-admin, bikin download-nya gagal.
  const halamanSuperAdmin =
    path.startsWith("/super-admin") || path.startsWith("/api/super-admin");

  if (!user && !publikTanpaAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (halamanSuperAdmin) {
    if (!user || !isSuperAdminEmail(user.email)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Super admin gak perlu (dan gak boleh) lolos cek profil/sekolah di
    // bawah — dia emang gak terikat ke sekolah manapun.
    return supabaseResponse;
  }

  // Super admin yang somehow nyasar ke path tenant biasa (mis. ngetik
  // /dashboard langsung, atau sesi lama sebelum redirect login
  // diperbaiki) — lempar balik ke /super-admin, JANGAN ikut alur
  // profil/onboarding tenant di bawah (dia emang gak akan pernah punya
  // baris `profil`, bakal keputer di /onboarding kalau lolos ke situ).
  if (user && !halamanSuperAdmin && !publikTanpaAuth && isSuperAdminEmail(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/super-admin";
    return NextResponse.redirect(url);
  }

  // User sudah login tapi belum punya baris `profil` (belum onboarding
  // bikin sekolah, atau belum terima undangan) → arahkan ke /onboarding.
  // Kalau udah punya profil tapi sekolahnya di-suspend super admin →
  // arahkan ke /akun-nonaktif, bukan ke dashboard.
  if (user && !publikTanpaAuth && !halamanResetSandi) {
    const { data: profil } = await supabase
      .from("profil")
      .select("id, sekolah:sekolah_id ( status )")
      .eq("id", user.id)
      .maybeSingle();

    if (!profil) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    const statusSekolah = (
      profil as unknown as { sekolah: { status: string } | null }
    ).sekolah?.status;

    if (statusSekolah === "nonaktif" && !halamanAkunNonaktif) {
      const url = request.nextUrl.clone();
      url.pathname = "/akun-nonaktif";
      return NextResponse.redirect(url);
    }

    // Sekolahnya aktif tapi entah kenapa nyasar ke /akun-nonaktif (mis.
    // baru aja diaktifkan lagi) — lempar balik ke dashboard.
    if (statusSekolah === "aktif" && halamanAkunNonaktif) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
