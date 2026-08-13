import { buatSvgQr } from "@/lib/qr-label";

export async function LabelAsetCard({
  kodeAset,
  kodeBarang,
  register,
  namaAset,
  namaSekolah,
}: {
  /** Kode internal aplikasi — cuma dipakai buat isi QR code, gak pernah
   * ditampilkan sebagai teks di label (kecuali fallback, lihat bawah). */
  kodeAset: string;
  /** Kode Barang resmi dari dinas/ARKAS. */
  kodeBarang?: string | null;
  /** Nomor Register (per unit/batch). */
  register?: string | null;
  namaAset: string;
  namaSekolah: string;
}) {
  const svgQr = await buatSvgQr(kodeAset);

  // Kode Barang & Register ditampilkan bareng kalau DUA-duanya keisi
  // (mis. "02.06.02.01.01 / 0001-0090"). Kalau salah satu aja yang
  // kosong, tampilan jatuh balik ke kode aset internal — daripada
  // nampilin baris yang cuma separuh keisi.
  const keduanyaAda = Boolean(kodeBarang) && Boolean(register);
  const teksKode = keduanyaAda ? `${kodeBarang} / ${register}` : kodeAset;

  return (
    <div className="border border-line rounded-lg p-3 flex items-center gap-3 bg-white break-inside-avoid print:border-ink/30">
      <div
        className="w-16 h-16 shrink-0"
        dangerouslySetInnerHTML={{ __html: svgQr }}
      />
      <div className="min-w-0">
        <p className="text-[10px] text-ink-soft uppercase tracking-wide truncate">
          {namaSekolah}
        </p>
        <p className="font-mono text-[12px] font-semibold text-ink leading-tight truncate">
          {teksKode}
        </p>
        <p className="text-[11px] text-ink-soft truncate">{namaAset}</p>
      </div>
    </div>
  );
}
