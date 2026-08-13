"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Mail, Lock } from "lucide-react";
import { login } from "@/app/login/actions";
import { LogoMark } from "@/components/layout/sidebar";
import { AuthInput } from "@/components/ui/auth-input";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { createClient } from "@/lib/supabase/client";

const initialLoginState: { error?: string } = {};

/**
 * Kartu Login/Onboarding gaya "sliding toggle" — satu container, dua
 * form ditumpuk & digeser lewat class .active (CSS: lihat .auth-card
 * dkk di globals.css, port langsung dari referensi kartu sliding
 * login/register yang dikasih user). BUKAN navigasi Next.js antar
 * /login <-> /onboarding lagi — toggle-nya murni state lokal biar
 * animasinya mulus kayak referensi (panel nyapu nutupin form dulu,
 * baru form barunya kebuka). URL tetap disinkronin (history.replaceState,
 * tanpa remount) biar /login & /onboarding masih bisa diakses/dibookmark
 * langsung dari luar.
 */
export function AuthCard({
  initialMode,
}: {
  initialMode: "login" | "onboarding";
}) {
  const [active, setActive] = useState(initialMode === "onboarding");
  const [sudahLogin, setSudahLogin] = useState(false);

  useEffect(() => {
    let batal = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!batal) setSudahLogin(!!data.user);
    });
    return () => {
      batal = true;
    };
  }, []);

  useEffect(() => {
    const target = active ? "/onboarding" : "/login";
    if (window.location.pathname !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [active]);

  const [loginState, loginFormAction, loginPending] = useActionState(
    async (_prev: typeof initialLoginState, formData: FormData) => {
      const result = await login(formData);
      return result ?? {};
    },
    initialLoginState
  );

  return (
    <div className={`auth-card ${active ? "active" : ""}`}>
      {/* Form Login — selalu ada di DOM & selalu "visible" (gak ada
          aturan visibility di kelas ini), tapi ketutup sama form
          Onboarding begitu class .active bikin form onboarding jadi
          visible (menang krn belakangan di DOM, posisi sama persis). */}
      <div className="auth-form-box">
        <div className="flex items-center gap-3 mb-8">
          <LogoMark size={28} />
          <div>
            <p className="font-display font-semibold text-ink">SIMASET SD</p>
            <p className="text-[11px] text-ink-soft">
              Inventaris Aset Sekolah
            </p>
          </div>
        </div>

        <h1 className="font-display text-xl font-semibold text-ink mb-1">
          Masuk
        </h1>
        <p className="text-[13px] text-ink-soft mb-6">
          Masuk pakai email & kata sandi akunmu.
        </p>

        <form
          action={loginFormAction}
          className="space-y-4"
          aria-busy={loginPending}
        >
          {loginState?.error && (
            <p
              role="alert"
              aria-live="assertive"
              className="bg-brick-soft text-brick text-[13px] rounded-lg px-3 py-2"
            >
              {loginState.error}
            </p>
          )}
          <div>
            <label className="text-[13px] text-ink-soft block mb-1">
              Email
            </label>
            <AuthInput
              icon={Mail}
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={loginPending}
              placeholder="admin@sekolah.sch.id"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[13px] text-ink-soft">
                Kata Sandi
              </label>
              <a
                href="/lupa-sandi"
                className="text-[12px] text-pine hover:underline"
              >
                Lupa kata sandi?
              </a>
            </div>
            <AuthInput
              icon={Lock}
              name="password"
              type="password"
              required
              autoComplete="current-password"
              disabled={loginPending}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loginPending}
            className="w-full flex items-center justify-center gap-2 bg-pine text-white font-medium text-sm py-3 rounded-xl hover:bg-pine-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loginPending && <Loader2 size={16} className="animate-spin" />}
            {loginPending ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="text-[12px] text-ink-soft mt-5">
          Diundang admin sekolahmu? Pakai link undangan yang dikirim ke
          emailmu.
        </p>
      </div>

      {/* Form Onboarding — hidden (visibility) sampai .active. */}
      <div className="auth-form-box auth-form-box-onboarding">
        <p className="font-display font-semibold text-ink text-lg">
          Daftarkan Sekolah
        </p>
        <p className="text-[13px] text-ink-soft mt-1 mb-6">
          {sudahLogin
            ? "Belum ada sekolah yang terhubung ke akunmu. Isi data di bawah untuk mulai — kamu akan jadi admin pertama."
            : "Bikin akun sekaligus daftarkan sekolahmu. Kamu akan jadi admin pertama."}
        </p>
        <OnboardingForm sudahLogin={sudahLogin} />
      </div>

      {/* Kapsul warna + teks ajakan, geser bareng class .active. */}
      <div className="auth-toggle-box">
        <div className="auth-toggle-panel auth-toggle-left">
          <h2 className="font-display text-2xl font-bold text-white">
            Halo, Selamat datang!
          </h2>
          <p className="mt-2 max-w-xs text-sm text-white/75">
            Belum punya akun admin sekolah? Registrasi dulu sekolahmu di
            sini.
          </p>
          <button
            type="button"
            onClick={() => setActive(true)}
            className="mt-6 inline-flex items-center justify-center border border-white/40 text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm"
          >
            Registrasi Sekolah
          </button>
        </div>

        <div className="auth-toggle-panel auth-toggle-right">
          {sudahLogin ? (
            <>
              <h2 className="font-display text-2xl font-bold text-white">
                Hampir Selesai!
              </h2>
              <p className="mt-2 max-w-xs text-sm text-white/75">
                Akunmu sudah aktif — tinggal lengkapi data sekolah di
                samping buat mulai.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-white">
                Selamat Datang Kembali!
              </h2>
              <p className="mt-2 max-w-xs text-sm text-white/75">
                Sudah punya akun admin? Gak perlu daftar ulang, langsung
                masuk aja.
              </p>
              <button
                type="button"
                onClick={() => setActive(false)}
                className="mt-6 inline-flex items-center justify-center border border-white/40 text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm"
              >
                Masuk
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
