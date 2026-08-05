"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "./actions";
import { LogoMark } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";

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
    <main className="min-h-screen flex flex-col items-center justify-center bg-paper px-4 py-8">
      <div className="tag-card w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <LogoMark size={28} />
          <div>
            <p className="font-display font-semibold text-ink">SIMASET SD</p>
            <p className="text-[11px] text-ink-soft">Inventaris Aset Sekolah</p>
          </div>
        </div>

        <form action={formAction} className="space-y-4" aria-busy={pending}>
          {/* role="alert" + aria-live: pesan error langsung diumumkan screen
              reader begitu muncul, gak perlu user cari sendiri di halaman. */}
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

        <p className="text-[12px] text-ink-soft text-center mt-5">
          Belum punya akun? Minta link undangan dari admin sekolahmu, atau{" "}
          <a href="/onboarding" className="text-pine hover:underline">
            daftarkan sekolah baru
          </a>
          .
        </p>
      </div>
      <Footer />
    </main>
  );
}
