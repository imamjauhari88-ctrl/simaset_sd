"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { kirimEmailResetSandi } from "./actions";
import { LogoMark } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { PanelBrand } from "@/components/ui/panel-brand";

const initialState: { pesan?: string; error?: string } = {};

export default function LupaSandiPage() {
  const [state, formAction, pending] = useActionState(
    kirimEmailResetSandi,
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
              Lupa Kata Sandi
            </h1>
            <p className="text-[13px] text-ink-soft mb-6">
              Masukkan email akunmu — kami kirim link buat bikin kata sandi
              baru.
            </p>

            {state?.pesan ? (
              <div className="bg-sage-soft text-sage text-[13px] rounded-lg px-4 py-3 flex gap-2.5">
                <MailCheck size={18} className="shrink-0 mt-0.5" />
                <p>{state.pesan}</p>
              </div>
            ) : (
              <form
                action={formAction}
                className="space-y-4"
                aria-busy={pending}
              >
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
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full flex items-center justify-center gap-2 bg-pine text-white font-medium text-sm py-2.5 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {pending && <Loader2 size={16} className="animate-spin" />}
                  {pending ? "Mengirim..." : "Kirim Link Reset"}
                </button>
              </form>
            )}

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-soft hover:text-ink mt-5"
            >
              <ArrowLeft size={13} />
              Kembali ke halaman Masuk
            </Link>
          </div>

          <div className="order-1 md:order-2">
            <PanelBrand
              title="Gak Masalah!"
              description="Kejadian sama semua orang. Ikuti langkah di sebelah buat bikin kata sandi baru."
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
