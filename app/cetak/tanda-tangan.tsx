import type { Sekolah } from "@/types/database";

/**
 * Blok tanda tangan "MENGETAHUI, Kepala..." (kiri) + tanggal & "Pengurus
 * Barang" (kanan) — sama persis di semua contoh laporan format dinas
 * (KIB A-F, KIR, Buku Inventaris, Daftar Usulan): tanggal nempel di atas
 * kolom kanan, dua kolom penandatangan sejajar di bawahnya. Datanya
 * diisi sekali di Pengaturan > Info Sekolah, dipakai berulang di sini.
 */
export function TandaTangan({ sekolah }: { sekolah: Sekolah | null }) {
  const kabKota = sekolah?.kabupaten_kota || "…………………";
  const tanggal = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mt-10 print:mt-14 grid grid-cols-2 text-[12px]">
      <div className="text-center">
        <p className="mb-1">MENGETAHUI</p>
        <p className="font-medium mb-16">
          KEPALA {sekolah?.nama ? sekolah.nama.toUpperCase() : "SEKOLAH"}
        </p>
        <p className="font-medium underline underline-offset-2">
          {sekolah?.kepala_sekolah_nama || "…………………………"}
        </p>
        <p>NIP. {sekolah?.kepala_sekolah_nip || "……………………"}</p>
      </div>

      <div className="text-center">
        <p className="mb-1">
          {kabKota}, {tanggal}
        </p>
        <p className="font-medium mb-16">PENGURUS BARANG</p>
        <p className="font-medium underline underline-offset-2">
          {sekolah?.pengurus_barang_nama || "…………………………"}
        </p>
        <p>NIP. {sekolah?.pengurus_barang_nip || "……………………"}</p>
      </div>
    </div>
  );
}
