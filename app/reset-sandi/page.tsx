"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { perbaruiSandi } from "./actions";
import { LogoMark } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { PanelBrand } from "@/components/ui/panel-brand";

const initialState: { error?: string } = {};

export default function ResetSandiPage() {
  const [state, formAction, pending] = useActionState(
    perbaruiSandi,
    initialState
  );

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl md:h-[560px] rounded-2xl overflow-hidden border border-line shadow-sm bg-surface grid md:grid-cols-2 animate-fade-in">
          <div className="order-2 md:order-1 p-8 sm:p-10 flex flex-col justify-center">
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
              Kata Sandi Baru
            </h1>
            <p className="text-[13px] text-ink-soft mb-6">
              Buat kata sandi baru buat akunmu.
            </p>

            <form action={formAction} className="space-y-4" aria-busy={pending}>
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
                  Kata Sandi Baru
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoFocus
                  autoComplete="new-password"
                  disabled={pending}
                  placeholder="••••••••"
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-[13px] text-ink-soft block mb-1">
                  Konfirmasi Kata Sandi
                </label>
                <input
                  name="konfirmasi"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
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
                {pending ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
              </button>
            </form>
          </div>

          <div className="order-1 md:order-2">
            <PanelBrand
              title="Hampir Selesai!"
              description="Satu langkah lagi — buat kata sandi baru buat lanjut masuk."
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
