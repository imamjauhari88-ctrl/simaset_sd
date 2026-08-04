/**
 * Format tanggal ISO jadi teks relatif ala aktivitas feed:
 * "10 menit lalu", "3 jam lalu", "Kemarin, 14:20", "5 hari lalu",
 * atau tanggal penuh kalau sudah lebih dari seminggu.
 */
export function formatWaktuRelatif(iso: string): string {
  const sekarang = new Date();
  const tanggal = new Date(iso);
  const diffMenit = Math.floor((sekarang.getTime() - tanggal.getTime()) / 60000);

  if (diffMenit < 1) return "Baru saja";
  if (diffMenit < 60) return `${diffMenit} menit lalu`;

  const diffJam = Math.floor(diffMenit / 60);
  if (diffJam < 24) return `${diffJam} jam lalu`;

  const diffHari = Math.floor(diffJam / 24);
  if (diffHari === 1) {
    return `Kemarin, ${tanggal.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  if (diffHari < 7) return `${diffHari} hari lalu`;

  return tanggal.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Format tanggal singkat "dd/mm/yyyy", dipakai di tabel laporan cetak
 * (KIB/KIR/Mutasi) — beda dari formatWaktuRelatif yang buat activity feed. */
export function formatTanggalSingkat(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Daftar tahun untuk opsi filter (tahun berjalan mundur beberapa tahun),
 * dipakai di filter tahun Mutasi & Pemeliharaan. Cukup dihitung dari tahun
 * sekarang tanpa perlu query tambahan ke DB.
 */
export function daftarTahunOpsi(jumlahTahun = 10): number[] {
  const tahunIni = new Date().getFullYear();
  return Array.from({ length: jumlahTahun }, (_, i) => tahunIni - i);
}
