"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

const LEBAR_KELAS: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Modal({
  title,
  onClose,
  children,
  size = "md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Lebar modal — default "md" (form pendek/dialog konfirmasi). Pakai
   * "lg"/"xl"/"2xl" buat form yang kolomnya banyak (grid 2-3 kolom)
   * biar gak sesak dipepetin ke lebar sempit. */
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);

    const overflowSemula = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = overflowSemula;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />
      <div
        className={clsx(
          "relative tag-card w-full flex flex-col max-h-[90vh] animate-fade-in",
          LEBAR_KELAS[size]
        )}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <p className="font-display font-semibold text-ink text-[16px]">
            {title}
          </p>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-1"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
