"use client";

import { useState, useTransition } from "react";
import { Copy, Check, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { generateLinkUndangan } from "./actions";
import { Select } from "@/components/ui/select";
import type { RolePengguna } from "@/types/database";

export function UndangPengguna() {
  const [role, setRole] = useState<RolePengguna>("guru");
  const [link, setLink] = useState<string | null>(null);
  const [tersalin, setTersalin] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      try {
        const url = await generateLinkUndangan(role);
        setLink(url);
        setTersalin(false);
        toast.success("Link undangan dibuat — sekali pakai, berlaku 7 hari");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal membuat link.");
      }
    });
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setTersalin(true);
    toast.success("Link disalin ke clipboard");
  }

  return (
    <div className="tag-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <UserPlus size={18} className="text-pine" />
        <p className="font-display font-semibold text-ink">
          Undang Pengguna
        </p>
      </div>
      <p className="text-[13px] text-ink-soft mb-4">
        Buat link undangan untuk guru/staf lain bergabung ke sekolahmu.
        Link berlaku 7 hari dan <strong>cuma bisa dipakai satu kali</strong> —
        begitu ada yang daftar lewat link ini, link yang sama nggak bisa
        dipakai lagi. Butuh mengundang orang lain? Generate link baru.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={role}
          onChange={(v) => setRole(v as RolePengguna)}
          className="sm:w-48"
          options={[
            { value: "guru", label: "Guru" },
            { value: "kepsek", label: "Kepala Sekolah" },
          ]}
        />
        <button
          onClick={handleGenerate}
          disabled={pending}
          className="bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors disabled:opacity-60"
        >
          {pending ? "Membuat link..." : "Buat Link Undangan"}
        </button>
      </div>

      {link && (
        <div className="mt-3 flex items-center gap-2 bg-paper border border-line rounded-lg px-3 py-2">
          <input
            readOnly
            value={link}
            className="flex-1 bg-transparent text-[13px] font-mono text-ink-soft outline-none"
          />
          <button
            onClick={handleCopy}
            className="text-pine hover:text-pine-dark shrink-0"
            aria-label="Salin link"
          >
            {tersalin ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}
