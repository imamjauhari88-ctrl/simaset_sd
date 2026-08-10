"use client";

import { useEffect, useRef, useState } from "react";
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
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickLuar(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setTerbuka(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("mousedown", handleClickLuar);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickLuar);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const dipilih = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
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

      {terbuka && (
        <div
          role="listbox"
          className="absolute z-20 mt-1.5 w-full max-h-64 overflow-auto bg-surface border border-line rounded-[0.75rem] shadow-[0_4px_14px_rgba(28,36,32,0.08),0_2px_4px_rgba(28,36,32,0.04)] p-1.5 animate-fade-in"
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
      )}
    </div>
  );
}
