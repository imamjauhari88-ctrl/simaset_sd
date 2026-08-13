"use client";

import { useActionState } from "react";
import { Loader2, User, Mail, Lock } from "lucide-react";
import { terimaUndangan } from "@/app/undangan/[token]/actions";
import { AuthInput } from "@/components/ui/auth-input";

const initialState: { error?: string } = {};

export function UndanganForm({ token }: { token: string }) {
  const submitDenganToken = terimaUndangan.bind(null, token);
  const [state, formAction, pending] = useActionState(
    submitDenganToken,
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
      <div>
        <label className="text-[13px] text-ink-soft block mb-1">
          Nama Lengkap
        </label>
        <AuthInput icon={User} name="nama" required disabled={pending} />
      </div>
      <div>
        <label className="text-[13px] text-ink-soft block mb-1">
          Email
        </label>
        <AuthInput
          icon={Mail}
          name="email"
          type="email"
          required
          disabled={pending}
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
          disabled={pending}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-pine text-white font-medium text-sm py-3 rounded-xl hover:bg-pine-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {pending && <Loader2 size={16} className="animate-spin" />}
        {pending ? "Memproses..." : "Buat Akun & Gabung"}
      </button>
    </form>
  );
}
