"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { buatSekolahBaru } from "@/app/onboarding/actions";

const initialState: { error?: string } = {};

export function OnboardingForm({ sudahLogin }: { sudahLogin: boolean }) {
  const [state, formAction, pending] = useActionState(
    buatSekolahBaru,
    initialState
  );

  return (
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

      {!sudahLogin && (
        <>
          <div>
            <label className="text-[13px] text-ink-soft block mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
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
              minLength={6}
              autoComplete="new-password"
              disabled={pending}
              placeholder="••••••••"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface disabled:opacity-60"
            />
          </div>
          <hr className="border-line" />
        </>
      )}

      <div>
        <label className="text-[13px] text-ink-soft block mb-1">
          Nama Kamu
        </label>
        <input
          name="nama_admin"
          required
          disabled={pending}
          placeholder="mis. Sri Wahyuni"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface disabled:opacity-60"
        />
      </div>
      <div>
        <label className="text-[13px] text-ink-soft block mb-1">
          Nama Sekolah
        </label>
        <input
          name="nama"
          required
          disabled={pending}
          placeholder="mis. UPTD SDN Tamansareh 2"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface disabled:opacity-60"
        />
      </div>
      <div>
        <label className="text-[13px] text-ink-soft block mb-1">
          NPSN <span className="text-ink-soft/70">(opsional)</span>
        </label>
        <input
          name="npsn"
          disabled={pending}
          placeholder="20xxxxxx"
          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface disabled:opacity-60"
        />
      </div>
      <div>
        <label className="text-[13px] text-ink-soft block mb-1">
          Alamat <span className="text-ink-soft/70">(opsional)</span>
        </label>
        <textarea
          name="alamat"
          rows={2}
          disabled={pending}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-pine text-white font-medium text-sm py-2.5 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending && <Loader2 size={16} className="animate-spin" />}
        {pending ? "Memproses..." : "Buat Sekolah & Masuk Dashboard"}
      </button>
    </form>
  );
}
