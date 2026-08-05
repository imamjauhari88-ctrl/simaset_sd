"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";

/**
 * Search box global di Topbar (tampil di semua halaman). Dua perilaku:
 * - Lagi di /aset: sinkron langsung ke URL ?q= (debounce), sama persis
 *   pola di tabel-aset.tsx — jadi field ini & search internal halaman
 *   Data Aset itu satu sumber yang sama, gak dobel state.
 * - Di halaman lain: baru pindah ke /aset?q=... pas user tekan Enter,
 *   biar gak nyeret pindah halaman di setiap ketukan huruf.
 *
 * Shortcut keyboard "/" buat fokus ke sini dari mana aja (kecuali lagi
 * ngetik di field lain), pola umum di app pencarian modern.
 */
export function TopbarSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const diHalamanAset = pathname === "/aset";
  const qUrl = diHalamanAset ? searchParams.get("q") ?? "" : "";

  const [nilai, setNilai] = useState(qUrl);
  const debounced = useDebounce(nilai, 400);

  // Field ikut kereset kalau user pindah keluar/masuk /aset atau filter
  // di halaman Data Aset diubah dari tempat lain (mis. tombol reset).
  // Ini bukan "copy state" biasa yang react-hooks/set-state-in-effect
  // cegah — field ini & search box internal TabelAset merepresentasikan
  // satu sumber sama (?q= di URL) dari dua komponen berbeda, jadi
  // sinkronisasi dari URL (sistem eksternal) ke sini memang harus lewat
  // effect, gak bisa dihitung langsung pas render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNilai(qUrl);
  }, [pathname, qUrl]);

  useEffect(() => {
    if (!diHalamanAset) return;
    if (debounced === qUrl) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debounced) {
      params.set("q", debounced);
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`/aset?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const kirim = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (diHalamanAset) return; // udah live-sync, submit gak perlu apa-apa
      const params = new URLSearchParams();
      if (nilai) params.set("q", nilai);
      router.push(`/aset${params.toString() ? `?${params}` : ""}`);
    },
    [diHalamanAset, nilai, router]
  );

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const sedangMengetik =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (e.key === "/" && !sedangMengetik) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <form
      onSubmit={kirim}
      className="hidden lg:flex items-center gap-2 bg-paper border border-line rounded-lg px-3 py-1.5 text-sm text-ink-soft w-64 focus-within:border-pine transition-colors"
    >
      <Search size={16} className="shrink-0" />
      <input
        ref={inputRef}
        value={nilai}
        onChange={(e) => setNilai(e.target.value)}
        placeholder="Cari kode / nama aset..."
        className="bg-transparent outline-none w-full placeholder:text-ink-soft"
      />
      {!diHalamanAset && nilai && (
        <kbd className="hidden xl:inline text-[10px] text-ink-soft/70 border border-line rounded px-1">
          Enter
        </kbd>
      )}
    </form>
  );
}
