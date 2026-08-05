"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Loader2 } from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { useAktivitasTerbaru } from "@/lib/queries/aktivitas";

export function NotifikasiDropdown() {
  const [buka, setBuka] = useState(false);
  const [posisi, setPosisi] = useState<{ top: number; right: number } | null>(
    null
  );
  const tombolRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setBuka(false), buka);

  const { data, isLoading } = useAktivitasTerbaru(buka);

  // Portal-kan dropdown ke <body>, jadi posisinya dihitung manual (fixed)
  // dari posisi tombol bell — tidak lagi bergantung pada `absolute` relatif
  // ke header, yang bisa berantakan kalau header punya sticky/backdrop-filter.
  useLayoutEffect(() => {
    if (!buka || !tombolRef.current) return;

    function hitungPosisi() {
      const rect = tombolRef.current!.getBoundingClientRect();
      setPosisi({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }

    hitungPosisi();
    window.addEventListener("resize", hitungPosisi);
    window.addEventListener("scroll", hitungPosisi, true);
    return () => {
      window.removeEventListener("resize", hitungPosisi);
      window.removeEventListener("scroll", hitungPosisi, true);
    };
  }, [buka]);

  return (
    <>
      <button
        ref={tombolRef}
        onClick={() => setBuka((v) => !v)}
        className="relative text-ink-soft hover:text-ink transition-colors"
        aria-label="Notifikasi"
      >
        <Bell size={19} />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brick ring-2 ring-surface" />
      </button>

      {buka &&
        posisi &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", top: posisi.top, right: posisi.right }}
            className="w-80 max-w-[calc(100vw-2rem)] tag-card p-0 overflow-hidden z-40 animate-fade-in"
          >
            <div className="px-4 py-3 border-b border-line">
              <p className="font-display font-semibold text-ink text-[14px]">
                Notifikasi
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-ink-soft">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : !data || data.length === 0 ? (
                <p className="text-[13px] text-ink-soft px-4 py-6 text-center">
                  Belum ada aktivitas terbaru.
                </p>
              ) : (
                <ul>
                  {data.map((item) => (
                    <li
                      key={item.id}
                      className="px-4 py-3 border-b border-line last:border-0 hover:bg-paper/70 transition-colors"
                    >
                      <p className="text-[13px] text-ink">{item.teks}</p>
                      <p className="text-[11px] text-ink-soft mt-0.5">
                        {item.waktu}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              href="/dashboard#aktivitas-terbaru"
              onClick={() => setBuka(false)}
              className="block text-center text-[12px] text-pine font-medium px-4 py-2.5 border-t border-line hover:bg-paper transition-colors"
            >
              Lihat semua di Dashboard
            </Link>
          </div>,
          document.body
        )}
    </>
  );
}
