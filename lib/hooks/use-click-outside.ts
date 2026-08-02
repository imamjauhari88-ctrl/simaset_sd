"use client";

import { useEffect, type RefObject } from "react";

/**
 * Panggil `onOutside` saat user klik/tap di luar elemen yang direferensikan
 * `ref`. Dipakai untuk menutup dropdown (notifikasi, menu user) tanpa perlu
 * backdrop penuh layar seperti Modal.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  aktif: boolean
) {
  useEffect(() => {
    if (!aktif) return;

    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutside();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, onOutside, aktif]);
}
