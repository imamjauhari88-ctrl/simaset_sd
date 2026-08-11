"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import clsx from "clsx";

/*
 * Dropdown kustom buat ganti <select> native.
 *
 * Alasannya: kotak <select> sendiri BISA di-styling pakai Tailwind (border,
 * bg, text — itu udah bener di semua halaman), tapi daftar pilihan yang
 * kebuka (popup listbox-nya) itu dirender browser di luar jangkauan CSS —
 * makanya walau kotaknya udah ikut warna tema, pas diklik yang muncul tetap
 * putih polos + biru default OS/browser. Satu-satunya cara biar konsisten
 * di semua halaman adalah bangun listbox sendiri dari <div>, bukan native
 * <option>.
 *
 * Listbox-nya di-render lewat portal ke <body> (bukan `position: absolute`
 * biasa di dalam kartu) — soalnya kalau cuma absolute, dia masih kejebak di
 * "lapisan" kartunya sendiri, jadi begitu ada kartu lain di grid yang render
 * belakangan (row di bawahnya), dropdown yang lagi kebuka bisa ketutupan.
 * Lewat portal, posisinya dihitung manual dari lokasi tombolnya, jadi selalu
 * di lapisan paling atas gak peduli ada di kartu mana dia dipanggil.
 */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Pilih",
  className,
  disabled = false,
  size = "md",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [posisi, setPosisi] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const tombolRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!terbuka || !tombolRef.current) return;
    function hitungPosisi() {
      const r = tombolRef.current!.getBoundingClientRect();
      setPosisi({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: r.width });
    }
    hitungPosisi();
    window.addEventListener("scroll", hitungPosisi, true);
    window.addEventListener("resize", hitungPosisi);
    return () => {
      window.removeEventListener("scroll", hitungPosisi, true);
      window.removeEventListener("resize", hitungPosisi);
    };
  }, [terbuka]);

  useEffect(() => {
    function handleKlikLuar(e: MouseEvent) {
      const target = e.target as Node;
      if (
        rootRef.current &&
        !rootRef.current.contains(target) &&
        listboxRef.current &&
        !listboxRef.current.contains(target)
      ) {
        setTerbuka(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("mousedown", handleKlikLuar);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleKlikLuar);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const dipilih = options.find((o) => o.value === value);

  const listbox = terbuka && (
    <div
      ref={listboxRef}
      role="listbox"
      style={{ position: "absolute", top: posisi.top, left: posisi.left, width: posisi.width }}
      className="z-[100] max-h-64 overflow-auto bg-surface border border-line rounded-[0.75rem] shadow-[0_4px_14px_rgba(28,36,32,0.08),0_2px_4px_rgba(28,36,32,0.04)] p-1.5 animate-fade-in"
    >
      {options.map((opt) => {
        const aktif = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={aktif}
            disabled={opt.disabled}
            onClick={() => {
              if (opt.disabled) return;
              onChange(opt.value);
              setTerbuka(false);
            }}
            className={clsx(
              "w-full flex items-center justify-between gap-2 text-left px-2.5 py-2 rounded-md text-sm transition-colors",
              opt.disabled
                ? "text-ink-soft/50 cursor-not-allowed"
                : aktif
                ? "bg-pine-soft text-pine-dark font-medium"
                : "text-ink hover:bg-paper"
            )}
          >
            <span className="truncate">{opt.label}</span>
            {aktif && <Check size={14} className="shrink-0" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        ref={tombolRef}
        type="button"
        disabled={disabled}
        onClick={() => setTerbuka((t) => !t)}
        className={clsx(
          "w-full flex items-center justify-between gap-2 bg-surface border border-line rounded-lg text-left outline-none transition-colors",
          "focus:border-pine",
          size === "sm" ? "px-3 py-1.5 text-sm" : "px-3 py-2 text-sm",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:border-pine/60",
          terbuka && "border-pine"
        )}
      >
        <span className={clsx("truncate", !dipilih && "text-ink-soft")}>
          {dipilih ? dipilih.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={clsx(
            "text-ink-soft shrink-0 transition-transform",
            terbuka && "rotate-180"
          )}
        />
      </button>

      {listbox && typeof document !== "undefined" && createPortal(listbox, document.body)}
    </div>
  );
}
