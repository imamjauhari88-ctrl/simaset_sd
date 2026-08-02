"use client";

import { useActionState } from "react";
import { login } from "./actions";

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
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="tag-card w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <svg width="28" height="28" viewBox="0 0 26 26" fill="none">
            <path d="M3 3H14L23 12L14 21L3 21V3Z" fill="var(--color-pine)" />
            <circle cx="8" cy="9" r="2" fill="var(--color-paper)" />
          </svg>
          <div>
            <p className="font-display font-semibold text-ink">SIMASET SD</p>
            <p className="text-[11px] text-ink-soft">Inventaris Aset Sekolah</p>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <p className="bg-brick-soft text-brick text-[13px] rounded-lg px-3 py-2">
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
              placeholder="admin@sekolah.sch.id"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
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
              placeholder="••••••••"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-pine text-white font-medium text-sm py-2.5 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
          >
            {pending ? "Masuk..." : "Masuk"}
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
    </main>
  );
}
