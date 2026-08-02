import { buatSvgQr } from "@/lib/qr-label";

export async function LabelAsetCard({
  kodeAset,
  namaAset,
  namaSekolah,
}: {
  kodeAset: string;
  namaAset: string;
  namaSekolah: string;
}) {
  const svgQr = await buatSvgQr(kodeAset);

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
        <p className="font-mono text-[13px] font-semibold text-ink leading-tight">
          {kodeAset}
        </p>
        <p className="text-[11px] text-ink-soft truncate">{namaAset}</p>
      </div>
    </div>
  );
}
