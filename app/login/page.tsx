"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "./actions";
import { LogoMark } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { PanelBrand } from "@/components/ui/panel-brand";

const initialState: { error?: string } = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await login(formData);
      return result ?? {};
    },
    initialState
  );

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl md:h-[560px] rounded-2xl overflow-hidden border border-line shadow-sm bg-surface grid md:grid-cols-2">
          {/* Form — di kiri saat Login, biar posisinya "ketuker" sama
              Onboarding (panel di kanan sana) — ngasih kesan dua halaman
              ini sepasang/saling terhubung, senada video referensi.
              animate-book-open-* bikin dua sisi kartu ini "kebuka" dari
              tengah pas halaman dimuat, kesan buka buku. */}
          <div className="order-2 md:order-1 p-8 sm:p-10 flex flex-col justify-center animate-book-open-left">
            <div className="flex items-center gap-3 mb-8">
              <LogoMark size={28} />
              <div>
                <p className="font-display font-semibold text-ink">
                  SIMASET SD
                </p>
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

            <form action={formAction} className="space-y-4" aria-busy={pending}>
              {/* role="alert" + aria-live: pesan error langsung diumumkan
                  screen reader begitu muncul, gak perlu user cari sendiri. */}
              {state?.error && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="bg-brick-soft text-brick text-[13px] rounded-lg px-3 py-2"
                >
                  {state.error}
                </p>
              )}
              <div>
                <label className="text-[13px] text-ink-soft block mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  disabled={pending}
                  placeholder="admin@sekolah.sch.id"
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-[13px] text-ink-soft block mb-1">
                  Kata Sandi
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  disabled={pending}
                  placeholder="••••••••"
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="w-full flex items-center justify-center gap-2 bg-pine text-white font-medium text-sm py-2.5 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pending && <Loader2 size={16} className="animate-spin" />}
                {pending ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <p className="text-[12px] text-ink-soft mt-5">
              Diundang admin sekolahmu? Pakai link undangan yang dikirim ke
              emailmu.
            </p>
          </div>

          <div className="order-1 md:order-2 animate-book-open-right">
            <PanelBrand
              title="Selamat Datang Kembali!"
              description="Belum punya akun admin sekolah? Registrasi dulu sekolahmu di sini."
              linkHref="/onboarding"
              linkLabel="Registrasi Sekolah"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
