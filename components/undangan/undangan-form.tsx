"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { terimaUndangan } from "@/app/undangan/[token]/actions";

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
        <input
          name="nama"
          required
          disabled={pending}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pine bg-surface disabled:opacity-60"
        />
      </div>
      <div>
        <label className="text-[13px] text-ink-soft block mb-1">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          disabled={pending}
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
        {pending ? "Memproses..." : "Buat Akun & Gabung"}
      </button>
    </form>
  );
}
