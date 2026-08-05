"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

/** UI error boundary generik, dipakai oleh error.tsx di berbagai
 *  segment. Konsisten sama gaya EmptyState (tag-card, ikon bulat,
 *  judul + deskripsi) tapi nada "brick" buat nandain ini masalah,
 *  bukan cuma kosong data. */
export function ErrorState({
  error,
  reset,
  title = "Gagal memuat halaman",
  description = "Terjadi kendala saat mengambil data. Coba muat ulang — kalau masih gagal, cek koneksi internet kamu.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    // Dicatat di console buat debugging developer; tidak dikirim ke
    // servis eksternal karena app ini belum pakai error tracker.
    console.error(error);
  }, [error]);

  return (
    <div className="tag-card flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full border border-dashed border-line scale-[1.6]" />
        <div className="relative rounded-full bg-brick-soft text-brick p-3">
          <AlertTriangle size={22} />
        </div>
      </div>
      <p className="font-display font-semibold text-ink text-[17px]">
        {title}
      </p>
      <p className="text-ink-soft text-[13px] mt-1 max-w-sm">{description}</p>
      {error.digest && (
        <p className="text-ink-soft/60 text-[11px] mt-2 font-mono">
          Kode: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-5 inline-flex items-center gap-1.5 bg-pine text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-pine-dark transition-colors"
      >
        <RotateCw size={15} />
        Coba lagi
      </button>
    </div>
  );
}
