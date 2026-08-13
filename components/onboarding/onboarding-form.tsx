"use client";

import { useActionState } from "react";
import { Loader2, Mail, Lock, User, School, Hash } from "lucide-react";
import { buatSekolahBaru } from "@/app/onboarding/actions";
import { AuthInput } from "@/components/ui/auth-input";

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
            <AuthInput
              icon={Mail}
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={pending}
              placeholder="admin@sekolah.sch.id"
            />
          </div>
          <div>
            <label className="text-[13px] text-ink-soft block mb-1">
              Kata Sandi
            </label>
            <AuthInput
              icon={Lock}
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              disabled={pending}
              placeholder="••••••••"
            />
          </div>
          <hr className="border-line" />
        </>
      )}

      <div>
        <label className="text-[13px] text-ink-soft block mb-1">
          Nama Kamu
        </label>
        <AuthInput
          icon={User}
          name="nama_admin"
          required
          disabled={pending}
          placeholder="mis. Sri Wahyuni"
        />
      </div>
      <div>
        <label className="text-[13px] text-ink-soft block mb-1">
          Nama Sekolah
        </label>
        <AuthInput
          icon={School}
          name="nama"
          required
          disabled={pending}
          placeholder="mis. UPTD SDN Tamansareh 2"
        />
      </div>
      <div>
        <label className="text-[13px] text-ink-soft block mb-1">
          NPSN <span className="text-ink-soft/70">(opsional)</span>
        </label>
        <AuthInput
          icon={Hash}
          name="npsn"
          disabled={pending}
          placeholder="20xxxxxx"
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
          className="w-full bg-paper border border-transparent rounded-xl px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-pine focus:bg-surface disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-pine text-white font-medium text-sm py-3 rounded-xl hover:bg-pine-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {pending && <Loader2 size={16} className="animate-spin" />}
        {pending ? "Memproses..." : "Buat Sekolah & Masuk Dashboard"}
      </button>
    </form>
  );
}
