"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import type { PengumumanItem } from "@/lib/supabase/queries";

const KEY_DITUTUP = "simaset-pengumuman-ditutup";

export function PengumumanBanner({ data }: { data: PengumumanItem[] }) {
  const [ditutup, setDitutup] = useState<string[]>([]);

  // Sama kayak pola NotifikasiDropdown: localStorage cuma ada di klien,
  // jadi dibaca di useEffect (bukan saat render awal) supaya gak
  // hydration-mismatch dengan render server.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY_DITUTUP);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDitutup(raw ? JSON.parse(raw) : []);
    } catch {
      // localStorage rusak/gak valid — anggap belum ada yang ditutup.
    }
  }, []);

  const belumDitutup = data.filter((p) => !ditutup.includes(p.id));

  function tutup(id: string) {
    const baru = [...ditutup, id];
    setDitutup(baru);
    try {
      localStorage.setItem(KEY_DITUTUP, JSON.stringify(baru));
    } catch {
      // gak masalah kalau gagal disimpan — cuma berarti muncul lagi
      // pas refresh, gak fatal.
    }
  }

  if (belumDitutup.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 pt-4 space-y-2">
      {belumDitutup.map((p) => (
        <div
          key={p.id}
          className="flex items-start gap-3 bg-brass-soft border border-brass/30 rounded-lg px-4 py-3"
        >
          <Megaphone size={16} className="text-brass shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-ink">{p.judul}</p>
            <p className="text-[13px] text-ink-soft mt-0.5">{p.isi}</p>
          </div>
          <button
            onClick={() => tutup(p.id)}
            className="text-ink-soft hover:text-ink p-1 shrink-0"
            aria-label="Tutup pengumuman"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
