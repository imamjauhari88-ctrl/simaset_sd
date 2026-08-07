"use client";

import { useEffect } from "react";

/**
 * Next.js App Router SEHARUSNYA otomatis scroll ke elemen sesuai #hash
 * pas navigasi ke halaman baru — tapi kalau halaman itu di-stream lewat
 * Suspense/loading.tsx (kayak semua halaman dashboard di app ini),
 * kadang percobaan scroll pertama Next kejadian SEBELUM konten aslinya
 * (yang isi elemen id="...") kelar dirender, jadi gagal dan gak dicoba
 * ulang. Komponen ini scroll manual begitu halaman ini sendiri (bukan
 * skeleton-nya) selesai mount.
 *
 * Taruh sekali di halaman yang punya section ber-id yang mau dituju dari
 * link luar (mis. <ScrollToHash /> di app/(dashboard)/dashboard/page.tsx
 * buat elemen id="aktivitas-terbaru").
 */
export function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    // Delay kecil: kasih waktu chart/gambar di atas section itu kelar
    // ngukur tinggi dulu (masih bisa geser layout), baru scroll biar
    // posisinya presisi — bukan buat "nunggu render", itu udah pasti
    // selesai karena effect ini jalan setelah mount komponen halaman asli.
    const timer = setTimeout(() => {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
